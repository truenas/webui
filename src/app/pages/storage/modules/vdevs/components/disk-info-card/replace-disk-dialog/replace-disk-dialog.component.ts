import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent, TnFormFieldComponent } from '@truenas/ui-components';
import { switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SedDiskPasswordComponent } from 'app/pages/storage/modules/vdevs/components/sed-disk-password/sed-disk-password.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ReplaceDiskDialogData {
  diskName: string;
  guid: string;
  poolId: number;
}

@Component({
  selector: 'ix-replace-disk-dialog',
  templateUrl: './replace-disk-dialog.component.html',
  styleUrls: ['./replace-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    UnusedDiskSelectComponent,
    SedDiskPasswordComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ReplaceDiskDialog {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<unknown, ReplaceDiskDialog>>(DialogRef);
  private snackbar = inject(SnackbarService);
  data = inject<ReplaceDiskDialogData>(DIALOG_DATA);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.nonNullable.group({
    replacement: ['', Validators.required],
    preserve_settings: [true],
    preserve_description: [true],
    force: [false],
  });

  protected readonly replacement = toSignal(this.form.controls.replacement.valueChanges, { initialValue: '' });
  private readonly sedDiskPassword = viewChild.required(SedDiskPasswordComponent);
  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  protected readonly canSubmit = computed(() => this.formStatus() === 'VALID' && this.sedDiskPassword().isValid());

  readonly helptext = helptextVolumeStatus;

  protected readonly Role = Role;

  onSubmit(): void {
    const values = this.form.getRawValue();
    this.sedDiskPassword().prepareDisk()
      .pipe(
        switchMap(() => this.dialogService.jobDialog(
          this.api.job('pool.replace', [this.data.poolId, {
            label: this.data.guid,
            disk: values.replacement,
            force: values.force,
            preserve_settings: values.preserve_settings,
            preserve_description: values.preserve_description,
          }]),
          { title: this.translate.instant(helptextVolumeStatus.replaceDisk.title) },
        ).afterClosed()),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.snackbar.success(
          this.translate.instant('Successfully replaced disk {disk}.', { disk: this.data.diskName }),
        );
      });
  }
}
