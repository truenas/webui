import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, finalize, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { LockedSedDisk } from 'app/pages/storage/components/import-pool/locked-sed-disks/locked-sed-disks.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-unlock-sed-disks',
  templateUrl: './unlock-sed-disks.component.html',
  styleUrls: ['./unlock-sed-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    IxIconComponent,
    FormActionsComponent,
    MatButton,
    MatIconButton,
    MatCheckbox,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class UnlockSedDisksComponent {
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

  get exceptions(): FormArray {
    return this.form.controls.exceptions;
  }

  protected get availableDisksForException(): Option[] {
    const usedDiskNames = new Set(
      this.exceptions.controls.map((control) => control.get('diskName')?.value as string),
    );
    return this.lockedDisks()
      .filter((disk) => !usedDiskNames.has(disk.name))
      .map((disk) => ({
        label: `${disk.name} - ${disk.model} (${disk.serial})`,
        value: disk.name,
      }));
  }

  protected getOptionsForException(index: number): Observable<Option[]> {
    const currentDiskName = this.exceptions.at(index).get('diskName')?.value as string;
    const usedDiskNames = new Set(
      this.exceptions.controls
        .filter((_, i) => i !== index)
        .map((control) => control.get('diskName')?.value as string),
    );

    const options = this.lockedDisks()
      .filter((disk) => !usedDiskNames.has(disk.name) || disk.name === currentDiskName)
      .map((disk) => ({
        label: `${disk.name} - ${disk.model} (${disk.serial})`,
        value: disk.name,
      }));

    return of(options);
  }

  protected addException(): void {
    const available = this.availableDisksForException;
    if (available.length === 0) return;

    this.exceptions.push(
      this.formBuilder.group({
        diskName: [''],
        password: [''],
      }),
    );
  }

  protected removeException(index: number): void {
    this.exceptions.removeAt(index);
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
        const errors = results.filter((result) => result.error !== null);
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
          this.dialogService.error({
            title: this.translate.instant('Error'),
            message: errors[0].error,
          });
        }
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
