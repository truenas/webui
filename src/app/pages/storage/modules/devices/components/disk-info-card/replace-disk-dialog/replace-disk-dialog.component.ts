import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVolumeStatus } from 'app/helptext/storage/volumes/volume-status';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ReplaceDiskDialogData {
  diskName: string;
  guid: string;
  poolId: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-replace-disk-dialog',
  templateUrl: './replace-disk-dialog.component.html',
  styleUrls: ['./replace-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    UnusedDiskSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ReplaceDiskDialogComponent {
  form = this.formBuilder.group({
    replacement: ['', Validators.required],
    preserve_settings: [true],
    preserve_description: [true],
    force: [false],
  });

  readonly helptext = helptextVolumeStatus;

  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ReplaceDiskDialogComponent>,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: ReplaceDiskDialogData,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.ws.job('pool.replace', [this.data.poolId, {
        label: this.data.guid,
        disk: this.form.value.replacement,
        force: this.form.value.force,
        preserve_settings: this.form.value.preserve_settings,
        preserve_description: this.form.value.preserve_description,
      }]),
      { title: helptextVolumeStatus.replace_disk.title },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.snackbar.success(
          this.translate.instant('Successfully replaced disk {disk}.', { disk: this.data.diskName }),
        );
      });
  }
}
