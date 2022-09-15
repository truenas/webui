import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { VmDeviceType } from 'app/enums/vm.enum';
import { VmDevice, VmDeviceDelete, VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

export interface DeviceDeleteModalState {
  row: VmDevice;
}

@UntilDestroy()
@Component({
  styleUrls: ['./device-delete-modal.component.scss'],
  templateUrl: './device-delete-modal.component.html',
})
export class DeviceDeleteModalComponent implements OnInit {
  readonly VmDeviceType = VmDeviceType;

  zvolConfirmLabelText: string;

  form = this.fb.group({
    zvol: [false],
    raw_file: [false],
    force: [false],
    zvolConfirm: [''],
  });

  constructor(
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: DeviceDeleteModalState,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<DeviceDeleteModalComponent>,
    private dialogService: DialogService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private ws: WebSocketService,
  ) {
    if (this.data.row.dtype !== VmDeviceType.Disk) {
      return;
    }

    const zvolConfirmRequired = this.validatorsService.withMessage(
      Validators.required,
      this.translate.instant('Name of the zvol is required'),
    );

    const zvolName = this.getZvolName(this.data.row);

    const zvolConfirmMustMatch = this.validatorsService.withMessage(
      Validators.pattern(new RegExp(`^${zvolName}$`)),
      this.translate.instant('Name of the zvol must be correct'),
    );

    this.form.controls['zvolConfirm'].setValidators([
      this.validatorsService.validateOnCondition(
        (control: AbstractControl) => control.parent.get('zvol').value,
        Validators.compose([
          zvolConfirmRequired,
          zvolConfirmMustMatch,
        ]),
      ),
    ]);

    this.form.updateValueAndValidity();

    this.zvolConfirmLabelText = this.translate.instant('Enter <strong>{zvolName}</strong> below to confirm.', { zvolName });
  }

  ngOnInit(): void {
    this.form.controls['zvol'].valueChanges.pipe(untilDestroyed(this)).subscribe(
      ($event) => this.onDestroyCheckedStateChanged($event),
    );
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    const value = this.form.value as VmDeviceDelete;
    this.loader.open();
    this.ws.call('vm.device.delete', [
      this.data.row.id,
      {
        zvol: value.zvol,
        raw_file: value.raw_file,
        force: value.force,
      },
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
          this.loader.close();
        },
        error: (err) => {
          new EntityUtils().handleWsError(this, err, this.dialogService);
          this.loader.close();
        },
      });
  }

  onDestroyCheckedStateChanged($event: unknown): void {
    if (!$event) {
      this.resetZvolConfirmValidState();
    }
  }

  private resetZvolConfirmValidState(): void {
    this.form.get('zvolConfirm').reset();
    this.form.get('zvolConfirm').setErrors(null);
  }

  private getZvolName(disk: VmDiskDevice): string {
    return disk.attributes.path.split('/').pop();
  }
}
