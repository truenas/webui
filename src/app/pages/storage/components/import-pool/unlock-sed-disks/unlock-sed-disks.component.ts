import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnCheckboxLabelDirective, TnFormFieldComponent,
  TnIconButtonComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import { of, startWith } from 'rxjs';
import { distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translatedSignal } from 'app/modules/translate/translated-signal';
import { ApiService } from 'app/modules/websocket/api.service';
import { LockedSedDisk } from 'app/pages/storage/components/import-pool/utils/sed-disk.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-unlock-sed-disks',
  templateUrl: './unlock-sed-disks.component.html',
  styleUrls: ['./unlock-sed-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnCheckboxLabelDirective,
    FormActionsComponent,
    TnButtonComponent,
    TnIconButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UnlockSedDisksComponent {
  protected readonly InputType = InputType;

  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  readonly lockedDisks = input.required<LockedSedDisk[]>();
  readonly globalSedPassword = input<string>('');
  readonly skip = output();
  readonly unlocked = output();

  constructor() {
    effect(() => {
      const password = this.globalSedPassword();
      if (password) {
        this.form.controls.globalPassword.setValue(password);
      }
    });
  }

  protected readonly Role = Role;

  protected readonly updateGlobalSettingsLabel = T('Update global settings (applies to all disks/pools)');
  protected readonly updateGlobalSettingsHint = T('Save this password to the system configuration for future use with these disks.');

  /**
   * `tn-checkbox` emits `label` as the input's `aria-label`, which overrides the projected content
   * as the accessible name — so it has to carry the hint the projection renders below. Composed
   * through a translatable pattern so clause order and punctuation stay in the translator's hands
   * rather than being hard-coded as `+ '. ' +`.
   *
   * Folding the hint into the *name* rather than exposing it as an `aria-describedby`
   * *description* is a downgrade, and the obvious fix — wrapping this in a `tn-form-field
   * [hint]`, as the layout dropdowns do — does not work: in the pinned 0.3.26 only `tn-input`,
   * `tn-select`, `tn-autocomplete` and `tn-chip-input` consume `TN_FORM_FIELD_CONTEXT`.
   * `tn-checkbox`'s `aria-describedby` is hard-wired to its own error id, so a field-level hint
   * would render visibly but reach no screen reader at all — strictly worse than this. See the
   * tn-migration playbook's "Known upstream defects" table; revisit once tn-checkbox wires up
   * the field context.
   */
  protected readonly updateGlobalSettingsAriaLabel = translatedSignal((translate) => translate.instant(
    '{label}. {hint}',
    {
      label: translate.instant(this.updateGlobalSettingsLabel),
      hint: translate.instant(this.updateGlobalSettingsHint),
    },
  ));

  protected form = this.formBuilder.nonNullable.group({
    globalPassword: ['', Validators.required],
    updateGlobalSettings: [true],
    exceptions: this.formBuilder.array<FormGroup<{ diskName: FormControl<string>; password: FormControl<string> }>>([]),
  });

  protected isUnlocking = signal(false);

  /**
   * A `FormArray` isn't signal-based, so mirror its emissions (push/removeAt both emit) into a
   * signal and derive the option lists from it, rather than from a hand-rolled version counter.
   *
   * Only the disk names feed the option lists, so the projection stops there and
   * `distinctUntilChanged` drops the emissions typing in a password field produces — otherwise
   * every keystroke would hand each `tn-select` a freshly built options array.
   */
  private readonly exceptionDiskNames = toSignal(
    this.form.controls.exceptions.valueChanges.pipe(
      startWith(null),
      map(() => this.form.controls.exceptions.getRawValue().map((exception) => exception.diskName)),
      distinctUntilChanged<string[]>(isEqual),
    ),
    { initialValue: [] as string[] },
  );

  private readonly diskOptions = computed<Option[]>(() => this.lockedDisks().map((disk) => ({
    label: `${disk.name} - ${disk.model} (${disk.serial})`,
    value: disk.name,
  })));

  /**
   * How many locked disks a new exception row could still pick from: those no row has claimed,
   * less one slot for every row already added but left unpicked. Counting the blank rows matters —
   * their `diskName` is `''`, which claims no disk, so without it "Add Disk Exception" stayed
   * enabled indefinitely and the surplus rows each rendered over a "No options" dropdown.
   */
  protected readonly availableDiskCountForException = computed(() => {
    const diskNames = this.exceptionDiskNames();
    const claimedDiskNames = new Set(diskNames.filter(Boolean));
    const blankRowCount = diskNames.filter((diskName) => !diskName).length;
    const unclaimedCount = this.diskOptions()
      .filter((option) => !claimedDiskNames.has(String(option.value))).length;

    return unclaimedCount - blankRowCount;
  });

  /** Per-row option list: every disk not claimed by another row, plus the row's own selection. */
  protected readonly exceptionOptions = computed<Option[][]>(() => {
    const diskNames = this.exceptionDiskNames();
    return diskNames.map((diskName, index) => {
      const usedDiskNames = new Set(diskNames.filter((_, i) => i !== index));
      return this.diskOptions()
        .filter((option) => !usedDiskNames.has(String(option.value)) || option.value === diskName);
    });
  });

  /**
   * The option label is `<name> - <model> (<serial>)` while the value is the bare disk name, so
   * the test id is pinned to the label rather than the value, keeping the pre-migration
   * `…-<label>` tail. The select's own base carries the row position, so an option resolves to
   * `option-disk-name-<position>-<label>` — unique across rows.
   */
  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  protected addException(): void {
    if (this.availableDiskCountForException() <= 0) return;

    this.form.controls.exceptions.push(
      this.formBuilder.group({
        diskName: ['', Validators.required],
        password: ['', Validators.required],
      }),
    );
  }

  protected removeException(index: number): void {
    this.form.controls.exceptions.removeAt(index);
  }

  /** Consulted by the hosting {@link ImportPoolComponent}'s unsaved-changes guard. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  protected onSkip(): void {
    this.skip.emit();
  }

  protected onSubmit(): void {
    const { globalPassword, updateGlobalSettings, exceptions } = this.form.getRawValue();

    const exceptionMap = new Map<string, string>();
    for (const exception of exceptions) {
      if (exception.diskName && exception.password) {
        exceptionMap.set(exception.diskName, exception.password);
      }
    }

    this.isUnlocking.set(true);

    const bulkParams: { name: string; password: string }[] = this.lockedDisks().map((disk) => ({
      name: disk.name,
      password: exceptionMap.get(disk.name) || globalPassword,
    }));

    const updateGlobalPassword$ = updateGlobalSettings
      ? this.api.call('system.advanced.update', [{ sed_passwd: globalPassword }])
      : of(null);

    updateGlobalPassword$.pipe(
      switchMap(() => this.dialogService.jobDialog(
        this.api.job('core.bulk', ['disk.unlock_sed', bulkParams.map((params) => [params])]),
        { title: this.translate.instant('Unlocking SED Disks') },
      ).afterClosed()),
      filter((job: Job<CoreBulkResponse[]>) => job.state === JobState.Success),
      finalize(() => this.isUnlocking.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job: Job<CoreBulkResponse[]>) => {
        const results = job.result;
        const resultsWithIndex = results.map((result, index) => ({ result, index }));
        const errors = resultsWithIndex.filter(({ result }) => result.error !== null);
        const successCount = results.length - errors.length;

        if (errors.length === 0) {
          this.snackbar.success(this.translate.instant('All SED disks unlocked successfully'));
          this.unlocked.emit();
        } else if (successCount > 0) {
          this.snackbar.success(this.translate.instant('{count} of {total} disks unlocked successfully', {
            count: successCount,
            total: results.length,
          }));
          this.unlocked.emit();
        } else {
          const errorMessages = errors
            .map(({ result, index }) => `${bulkParams[index].name}: ${result.error}`)
            .join('\n');
          this.dialogService.error({
            title: this.translate.instant('Failed to Unlock Disks'),
            message: errorMessages,
          });
        }
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
