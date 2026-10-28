import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, of, startWith } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3RecoverableBucket, S3RecoverBucket, S3RecoveredBucket } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { s3BucketNamePattern } from 'app/pages/sharing/s3/utils/s3-bucket.utils';
import {
  createS3UserPickerProvider, s3UserFormPreset,
} from 'app/pages/sharing/s3/utils/s3-user-picker.utils';
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
 *
 * Its data, when given, is a dataset to limit the panel to: the bucket form opens it that way when a new bucket's
 * dataset turns out to hold a deleted one.
 */
@Component({
  selector: 'ix-s3-bucket-recover-form',
  templateUrl: './s3-bucket-recover-form.component.html',
  styleUrls: ['./s3-bucket-recover-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    MatButton,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxInputComponent,
    IxUserPickerComponent,
    WarningComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
  ],
})
export class S3BucketRecoverFormComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<string | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly ownerProvider = createS3UserPickerProvider();
  protected readonly userFormPreset = s3UserFormPreset;

  /** Limits the panel to the bucket on this dataset; absent, every recoverable bucket is listed. */
  private readonly dataset = this.slideInRef.getData();

  protected readonly form = this.fb.group({
    buckets: this.fb.array<RecoverRowGroup>([]),
  });

  protected readonly rows = signal<RecoverRow[]>([]);

  /** The listing on open, then each recover request. */
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);

  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status), map(() => this.form.valid)),
    { initialValue: false },
  );

  private readonly selectedCount = toSignal(
    this.form.valueChanges.pipe(
      map(() => this.form.controls.buckets.getRawValue().filter((row) => row.selected).length),
    ),
    { initialValue: 0 },
  );

  protected readonly canSubmit = computed(() => !this.isLoading() && this.formValid() && this.selectedCount() > 0);

  protected get title(): string {
    return this.dataset
      ? this.translate.instant('Recover S3 Bucket')
      : this.translate.instant('Recover S3 Buckets');
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => of(this.form.dirty));
  }

  ngOnInit(): void {
    this.api.call('sharing.s3.recoverable_buckets').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (buckets) => {
        const rows = buckets
          .filter((bucket) => !this.dataset || bucket.dataset === this.dataset)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((bucket) => this.createRow(bucket));
        rows.forEach((row) => this.form.controls.buckets.push(row.group));
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
    // Held while the request is out: an edit made now would land on a row whose values were already sent, and a
    // failed row would then show what middleware never saw. Without events, so the `selected` subscriptions in
    // `createRow` do not re-enable the fields they hold.
    this.form.disable({ emitEvent: false });
    this.api.call('sharing.s3.recover', [selected.map((row) => this.toRecoverBucket(row))]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (results) => this.applyResults(results),
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.enableRows();
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

  /** Undoes the hold in `onSubmit`, leaving an unticked row's fields disabled as `createRow` keeps them. */
  private enableRows(): void {
    this.form.enable({ emitEvent: false });
    this.rows().forEach(({ group }) => {
      if (!group.controls.selected.value) {
        group.controls.name.disable({ emitEvent: false });
        group.controls.owner.disable({ emitEvent: false });
      }
    });
    this.form.updateValueAndValidity();
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

    const buckets = this.form.controls.buckets;
    recovered.forEach((row) => buckets.removeAt(buckets.controls.indexOf(row.group)));
    this.rows.set(remaining);
    this.enableRows();

    if (recovered.length) {
      this.snackbar.success(this.translate.instant(
        '{n, plural, one {# bucket recovered} other {# buckets recovered}}',
        { n: recovered.length },
      ));
    }

    if (results.every((result) => result.bucket)) {
      this.slideInRef.close({ response: true });
      return;
    }

    // What failed stays on screen with its reason. Nothing here is unsaved any more, so closing the panel to deal
    // with it elsewhere (e.g. renaming a clashing bucket) should not ask to discard anything.
    this.form.markAsPristine();
  }
}
