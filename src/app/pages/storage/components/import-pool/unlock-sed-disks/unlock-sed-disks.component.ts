import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnCheckboxLabelDirective, TnFormFieldComponent,
  TnIconButtonComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of, startWith } from 'rxjs';
import { filter, finalize, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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

  protected form = this.formBuilder.nonNullable.group({
    globalPassword: ['', Validators.required],
    updateGlobalSettings: [true],
    exceptions: this.formBuilder.array<FormGroup<{ diskName: FormControl<string>; password: FormControl<string> }>>([]),
  });

  protected isUnlocking = signal(false);

  /**
   * A `FormArray` isn't signal-based, so mirror its emissions (push/removeAt both emit) into a
   * signal and derive the option lists from it, rather than from a hand-rolled version counter.
   */
  private readonly exceptions = toSignal(
    this.form.controls.exceptions.valueChanges.pipe(
      startWith(null),
      map(() => this.form.controls.exceptions.getRawValue()),
    ),
    { initialValue: [] as { diskName: string; password: string }[] },
  );

  private readonly diskOptions = computed<Option[]>(() => this.lockedDisks().map((disk) => ({
    label: `${disk.name} - ${disk.model} (${disk.serial})`,
    value: disk.name,
  })));

  protected availableDisksForException = computed(() => {
    const usedDiskNames = new Set(this.exceptions().map((exception) => exception.diskName));
    return this.diskOptions().filter((option) => !usedDiskNames.has(String(option.value)));
  });

  /** Per-row option list: every disk not claimed by another row, plus the row's own selection. */
  protected readonly exceptionOptions = computed<Option[][]>(() => {
    const exceptions = this.exceptions();
    return exceptions.map((exception, index) => {
      const usedDiskNames = new Set(
        exceptions.filter((_, i) => i !== index).map((other) => other.diskName),
      );
      return this.diskOptions()
        .filter((option) => !usedDiskNames.has(String(option.value)) || option.value === exception.diskName);
    });
  });

  /**
   * The option label is `<name> - <model> (<serial>)` while the value is the bare disk name, so
   * the test id is pinned to the label to keep the pre-migration `option-disk-name-<label>`.
   */
  protected readonly diskOptionTestIdKey = (option: Option): string => String(option.label);

  protected addException(): void {
    const available = this.availableDisksForException();
    if (available.length === 0) return;

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
