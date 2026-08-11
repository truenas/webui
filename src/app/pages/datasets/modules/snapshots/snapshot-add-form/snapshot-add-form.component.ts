import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { format } from 'date-fns';
import { isEmpty, omit } from 'lodash-es';
import {
  catchError, combineLatest, map, merge, Observable, of, Subject, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { Option } from 'app/interfaces/option.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/forms/ix-forms/validators/required-empty-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { StorageService } from 'app/services/storage.service';

/** Validation error key the failed VM lookup parks on the `dataset` control. */
const vmCheckError = 'vmCheckFailed';

@Component({
  selector: 'ix-snapshot-add-form',
  templateUrl: './snapshot-add-form.component.html',
  styleUrls: ['./snapshot-add-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotAddFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private validatorsService = inject(IxValidatorsService);
  private datasetStore = inject(DatasetTreeStore);
  private storageService = inject(StorageService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SnapshotWrite];

  /** Initial options load. Drives the panel's progress bar and busy overlay. */
  protected isFormLoading = signal(true);

  /**
   * The background `vmware.dataset_has_vms` lookup. Only gates Save — routing it through the panel's
   * busy state would dim and lock the whole form mid-edit each time a field is touched.
   */
  protected isCheckingVms = signal(false);

  /** Whether the last VM lookup failed. Blocks Save — see {@link setVmCheckFailed}. */
  protected readonly vmCheckFailed = signal(false);

  /**
   * Whether the retry button is on screen. A latch rather than {@link vmCheckFailed} itself: the
   * button unmounting on the state change it triggers would drop the focus of the user who just
   * pressed it back to `<body>`, mid-form. So a failure puts it there and a success leaves it —
   * disabled while a check runs — and only picking another dataset takes it down, by which point
   * focus has moved to the select and there is a new question to answer anyway.
   */
  protected readonly canRetryVmCheck = signal(false);

  /**
   * Live-region text for the retry cycle. Silent until a check has failed, so the ordinary lookups
   * that run on every dataset/recursive change don't chatter.
   */
  protected readonly vmCheckStatus = computed(() => {
    if (!this.canRetryVmCheck()) {
      return '';
    }
    if (this.isCheckingVms()) {
      return this.translate.instant(helptextSnapshots.checkingForVms);
    }
    return this.translate.instant(
      this.vmCheckFailed() ? helptextSnapshots.vmCheckFailed : helptextSnapshots.vmCheckSucceeded,
    );
  });

  /** Re-runs the VM lookup without the user having to disturb a field to trigger one. */
  private readonly retryVmCheck$ = new Subject<void>();

  /** Dataset to preset, supplied by the `<tn-side-panel>` host. */
  readonly presetDatasetId = input<string | undefined>(undefined);

  form = this.fb.nonNullable.group({
    dataset: ['', Validators.required],
    name: [this.getDefaultSnapshotName(), [this.validatorsService.withMessage(
      atLeastOne('naming_schema', [helptextSnapshots.nameLabel, helptextSnapshots.namingSchemaLabel]),
      this.translate.instant('Name or Naming Schema must be provided.'),
    ), this.validatorsService.validateOnCondition(
      (control: AbstractControl) => control.value && control.parent?.get('naming_schema')?.value,
      this.validatorsService.withMessage(
        requiredEmpty(),
        this.translate.instant('Name and Naming Schema cannot be provided at the same time.'),
      ),
    )]],
    naming_schema: [''],
    recursive: [false],
    vmware_sync: [false],
  });

  datasetOptions$: Observable<Option[]>;
  namingSchemaOptions$: Observable<Option[]>;

  /**
   * Whether the selected dataset holds VMs, which decides both the VMware Sync checkbox's
   * visibility and whether `vmware_sync` reaches the payload.
   */
  protected readonly hasVmsInDataset = signal(false);

  readonly helptext = helptextSnapshots;

  /** Renders {@link vmCheckError} on the dataset field instead of the raw error key. */
  protected readonly datasetErrorMessages = {
    [vmCheckError]: this.translate.instant(helptextSnapshots.vmCheckFailed),
  };

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  ngOnInit(): void {
    // Subscribed before the preset below sets `dataset`, so that first check isn't dropped.
    // `switchMap` cancels an in-flight lookup when either field changes again, so only the newest
    // response can clear the Save gate or set `hasVmsInDataset` — an earlier, slower response can
    // neither re-enable Save early nor leave a stale flag behind (which would silently drop
    // `vmware_sync` from the payload).
    merge(
      this.form.controls.recursive.valueChanges.pipe(map(() => 'recursive' as const)),
      this.form.controls.dataset.valueChanges.pipe(map(() => 'dataset' as const)),
      this.retryVmCheck$.pipe(map(() => 'retry' as const)),
    ).pipe(
      tap((trigger) => {
        if (trigger === 'dataset') {
          // A different dataset is a different question, so a leftover retry button has nothing to
          // retry — see {@link canRetryVmCheck} for why only this trigger clears it.
          this.canRetryVmCheck.set(false);
        }
        this.isCheckingVms.set(true);
        // Per attempt, not per dataset: a parked failure would keep Save blocked after a good retry.
        this.setVmCheckFailed(false);
      }),
      // Guarded inside the projection rather than by a `filter` before it: a filter would drop the
      // emission after `isCheckingVms` was already set, latching Save disabled forever. With no
      // dataset there is nothing to ask about — toggling Recursive first would otherwise call
      // `vmware.dataset_has_vms` with ''.
      switchMap((trigger) => {
        return this.form.controls.dataset.value ? this.queryVmsInDataset(trigger === 'retry') : of(false);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((hasVmsInDataset) => {
      this.hasVmsInDataset.set(hasVmsInDataset);
      this.isCheckingVms.set(false);
    });

    combineLatest([
      this.getDatasetOptions(),
      this.getNamingSchemaOptions(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([datasetOptions, namingSchemaOptions]) => {
        this.datasetOptions$ = of(datasetOptions);
        this.namingSchemaOptions$ = of(namingSchemaOptions);
        this.isFormLoading.set(false);
        this.form.controls.name.markAsTouched();
      },
      error: (error: unknown) => {
        // Both are read-only option lookups, so a failure can't map onto a control — surface it
        // rather than routing it through the form's validation errors. (Submit errors still go
        // through FormErrorHandlerService, inside `<ix-form>`.)
        this.errorHandler.showErrorModal(error);
        this.isFormLoading.set(false);
      },
    });

    const presetDatasetId = this.presetDatasetId();
    if (presetDatasetId) {
      this.form.controls.dataset.setValue(presetDatasetId);
    }
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const values = this.form.getRawValue();
    const params: CreateZfsSnapshot = {
      dataset: values.dataset,
      recursive: values.recursive,
    };
    if (values.naming_schema) {
      params.naming_schema = values.naming_schema;
    } else {
      params.name = values.name;
    }

    // Only reached with a settled lookup — a failed one blocks Save (see `setVmCheckFailed`) — so a
    // `false` here means "checked, no VMs" rather than "never found out".
    if (this.hasVmsInDataset()) {
      params.vmware_sync = values.vmware_sync;
    }

    return {
      request$: this.api.call('pool.snapshot.create', [params]),
      // Owned by the form so every entry point confirms identically.
      successMessage: this.translate.instant('Snapshot added successfully.'),
      onSuccess: () => this.datasetStore.datasetUpdated(),
    };
  };

  private getDefaultSnapshotName(): string {
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `manual-${datetime}`;
  }

  private getDatasetOptions(): Observable<Option[]> {
    return this.storageService.getDatasetNameOptions();
  }

  private getNamingSchemaOptions(): Observable<Option[]> {
    return this.authService.hasRole([Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull]).pipe(
      switchMap((hasAccess) => {
        if (!hasAccess) {
          return of([]);
        }

        return this.api.call('replication.list_naming_schemas').pipe(
          singleArrayToOptions(),
        );
      }),
    );
  }

  protected retryVmCheck(): void {
    this.retryVmCheck$.next();
  }

  /**
   * No `timeout(...)`: a timer here keeps the Angular zone unstable for the whole lookup (hanging
   * harness-driven tests), and every settled outcome — success, error, or being superseded by
   * `switchMap` — already clears the Save gate.
   *
   * @param reportFailure Whether a failure also raises an error modal. Only the explicit Retry does:
   * the auto re-checks run on every dataset/recursive change, so with the endpoint down a user
   * toggling Recursive a couple of times would collect a stack of identical modals on top of a form
   * that already explains the failure inline and offers the retry.
   */
  private queryVmsInDataset(reportFailure: boolean): Observable<boolean> {
    return this.api
      .call('vmware.dataset_has_vms', [this.form.controls.dataset.value, this.form.controls.recursive.value])
      .pipe(
        // Caught inside the switchMap projection so a failed lookup doesn't kill the outer stream
        // and stop every later check. The modal carries the backend's own wording; the blocking
        // part of the report is what `setVmCheckFailed` puts on the field.
        catchError((error: unknown) => {
          this.setVmCheckFailed(true);
          if (reportFailure) {
            this.errorHandler.showErrorModal(error);
          }
          return of(false);
        }),
      );
  }

  /**
   * Records the lookup's failure and mirrors it onto the `dataset` control. With VMs unanswered,
   * `vmware_sync` cannot be decided — falling through to `false` would silently take an
   * unsynchronised snapshot of a dataset that does hold VMs — so the failure blocks Save.
   *
   * The block is the {@link vmCheckFailed} signal, read by `[extraDisabled]`; the control error is
   * only how the field says why, so a stray `updateValueAndValidity()` can't unblock Save.
   */
  private setVmCheckFailed(failed: boolean): void {
    this.vmCheckFailed.set(failed);
    const dataset = this.form.controls.dataset;

    if (failed) {
      // Not cleared on a later success — see {@link canRetryVmCheck}.
      this.canRetryVmCheck.set(true);
      dataset.setErrors({ ...dataset.errors, [vmCheckError]: true });
      // `tn-form-field` only renders an error on an interacted control, and a preset dataset is
      // never touched by the user — without this the block would be silent on the very path that
      // opens the form with a dataset already chosen.
      dataset.markAsTouched();
    } else if (dataset.hasError(vmCheckError)) {
      // Drops our key alone. `setErrors(null)` would take any other error with it and doesn't re-run
      // validators to restore it, while `updateValueAndValidity()` re-emits `valueChanges` and would
      // retrigger the very stream that calls this.
      const remaining = omit(dataset.errors, vmCheckError);
      dataset.setErrors(isEmpty(remaining) ? null : remaining);
    }
  }
}
