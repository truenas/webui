import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnBannerComponent, TnCheckboxComponent, TnFormFieldComponent, TnInputComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3RecoverableBucket, S3RecoverBucket, S3RecoveredBucket } from 'app/interfaces/s3.interface';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { s3BucketNamePattern } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { s3UserDirectoryOptions, s3UserFormPreset } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

type RecoverRowGroup = FormGroup<{
  selected: FormControl<boolean>;
  name: FormControl<string>;
  owner: FormControl<string>;
}>;

interface RecoverRow {
  bucket: S3RecoverableBucket;
  group: RecoverRowGroup;
  /** Why the last attempt to recover this bucket failed, as middleware put it. */
  error: WritableSignal<string | null>;
}

/**
 * Registers buckets again from datasets that still hold them — one deleted by mistake, or a disaster recovery
 * system taking over replicated datasets. Middleware keeps a backup of each bucket's configuration on its dataset,
 * and `sharing.s3.recover` restores it unchanged except for the name and owner, which are the two things that can
 * clash with what this system already has.
 *
 * Every dataset gets its own answer, so a partial failure keeps the panel open on the buckets that failed, each
 * with its reason, while the ones that worked drop out of the list. The opener reloads on any close for that reason.
 */
@Component({
  selector: 'ix-s3-bucket-recover-form',
  templateUrl: './s3-bucket-recover-form.component.html',
  styleUrls: ['./s3-bucket-recover-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnBannerComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnTestIdDirective,
    IxUserComboboxComponent,
  ],
})
export class S3BucketRecoverFormComponent extends SidePanelForm implements OnInit {
  private api = inject(TypedApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly ownerDirectoryOptions = s3UserDirectoryOptions;
  protected readonly userFormPreset = s3UserFormPreset;

  protected readonly form = this.fb.array<RecoverRowGroup>([]);
  protected readonly rows = signal<RecoverRow[]>([]);

  /** The listing on open, then each recover request. */
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);

  private readonly formCanSubmit = this.trackCanSubmit(this.isLoading);

  private readonly selectedCount = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue().filter((row) => row.selected).length)),
    { initialValue: 0 },
  );

  readonly canSubmit = computed(() => this.formCanSubmit() && this.selectedCount() > 0);

  ngOnInit(): void {
    this.api.call('sharing.s3.recoverable_buckets').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (buckets) => {
        const rows = [...buckets]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((bucket) => this.createRow(bucket));
        rows.forEach((row) => this.form.push(row.group));
        this.rows.set(rows);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.loadFailed.set(true);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onSubmit(): void {
    const selected = this.selectedRows();
    if (!selected.length || this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.api.call('sharing.s3.recover', [selected.map((row) => this.toRecoverBucket(row))]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (results) => this.applyResults(results),
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private createRow(bucket: S3RecoverableBucket): RecoverRow {
    const group: RecoverRowGroup = this.fb.group({
      selected: [true],
      name: [bucket.name, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(63),
        Validators.pattern(s3BucketNamePattern),
      ]],
      owner: [bucket.owner, Validators.required],
    });

    // Disabled rather than left alone while the bucket is unticked: its fields are not rendered then, and an
    // invalid one would otherwise hold Recover disabled with nothing on screen to fix.
    group.controls.selected.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selected) => {
      if (selected) {
        group.controls.name.enable();
        group.controls.owner.enable();
      } else {
        group.controls.name.disable();
        group.controls.owner.disable();
      }
    });

    return { bucket, group, error: signal(null) };
  }

  private selectedRows(): RecoverRow[] {
    return this.rows().filter((row) => row.group.controls.selected.value);
  }

  /** Overrides only what was changed, so a bucket left as it was comes back from its backup untouched. */
  private toRecoverBucket({ bucket, group }: RecoverRow): S3RecoverBucket {
    const { name, owner } = group.getRawValue();
    return {
      dataset: bucket.dataset,
      name_override: name === bucket.name ? null : name,
      owner_override: owner === bucket.owner ? null : owner,
    };
  }

  private applyResults(results: S3RecoveredBucket[]): void {
    this.isLoading.set(false);
    const answers = new Map(results.map((result) => [result.dataset, result]));

    const recovered: RecoverRow[] = [];
    const remaining: RecoverRow[] = [];
    this.rows().forEach((row) => {
      const answer = answers.get(row.bucket.dataset);
      if (answer?.bucket) {
        recovered.push(row);
        return;
      }
      if (answer) {
        row.error.set(answer.error || this.translate.instant('The bucket could not be recovered.'));
      }
      remaining.push(row);
    });

    recovered.forEach((row) => this.form.removeAt(this.form.controls.indexOf(row.group)));
    this.rows.set(remaining);

    if (recovered.length) {
      this.snackbar.success(this.translate.instant(
        '{n, plural, one {# bucket recovered} other {# buckets recovered}}',
        { n: recovered.length },
      ));
    }

    if (results.every((result) => result.bucket)) {
      this.close(true);
      return;
    }

    // What failed stays on screen with its reason. Nothing here is unsaved any more, so closing the panel to deal
    // with it elsewhere (e.g. renaming a clashing bucket) should not ask to discard anything.
    this.form.markAsPristine();
  }
}
