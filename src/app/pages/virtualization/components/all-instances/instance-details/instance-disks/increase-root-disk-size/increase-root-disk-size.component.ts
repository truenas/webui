import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GiB } from 'app/constants/bytes.constant';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-increase-root-disk-size',
  templateUrl: './increase-root-disk-size.component.html',
  styleUrls: ['./increase-root-disk-size.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxInputComponent,
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    FormActionsComponent,
  ],
})
export class IncreaseRootDiskSizeComponent {
  protected readonly form = this.formBuilder.group({
    size: [0],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) private instance: VirtualizationInstance,
    private formBuilder: NonNullableFormBuilder,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private api: ApiService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<IncreaseRootDiskSizeComponent>,
    protected formatter: IxFormatterService,
  ) {
    this.form.setValue({
      size: this.instance.root_disk_size / GiB,
    });

    this.form.controls.size.addValidators(Validators.min(this.instance.root_disk_size / GiB));
  }

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.api.job('virt.instance.update', [this.instance.id, { root_disk_size: this.form.value.size }]),
      { title: this.translate.instant('Increasing disk size') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(this.form.value.size);
        this.snackbar.success(this.translate.instant('Disk size increased'));
      });
  }
}
