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
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskIoBus, diskIoBusLabels } from 'app/enums/virtualization.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-change-root-disk-setup',
  templateUrl: './change-root-disk-setup.component.html',
  styleUrls: ['./change-root-disk-setup.component.scss'],
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
    IxSelectComponent,
    FormActionsComponent,
  ],
})
export class ChangeRootDiskSetupComponent {
  protected readonly form = this.formBuilder.group({
    size: [0],
    root_disk_io_bus: [DiskIoBus.Nvme],
  });

  protected readonly diskIoBusOptions$ = of(mapToOptions(diskIoBusLabels, this.translate));
  protected readonly containersHelptext = instancesHelptext;

  constructor(
    @Inject(MAT_DIALOG_DATA) private instance: VirtualizationInstance,
    private formBuilder: NonNullableFormBuilder,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private api: ApiService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ChangeRootDiskSetupComponent>,
    protected formatter: IxFormatterService,
  ) {
    this.form.setValue({
      size: Number(this.instance.root_disk_size) / GiB,
      root_disk_io_bus: this.instance.root_disk_io_bus,
    });

    this.form.controls.size.addValidators(Validators.min(this.instance.root_disk_size / GiB));
  }

  onSubmit(): void {
    const payload = {
      root_disk_size: this.form.value.size,
      root_disk_io_bus: this.form.value.root_disk_io_bus,
    };

    if (payload.root_disk_size === Number(this.instance.root_disk_size) / GiB) {
      delete payload.root_disk_size;
    }

    if (payload.root_disk_io_bus === this.instance.root_disk_io_bus) {
      delete payload.root_disk_io_bus;
    }

    if (!Object.keys(payload).length) {
      this.dialogRef.close();
      return;
    }

    this.dialogService.jobDialog(
      this.api.job('virt.instance.update', [this.instance.id, payload]),
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
