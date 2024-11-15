import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VmDeviceType } from 'app/enums/vm.enum';
import { VmDevice, VmDeviceDelete, VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-device-delete-modal',
  styleUrls: ['./device-delete-modal.component.scss'],
  templateUrl: './device-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    MatDialogContent,
    IxCheckboxComponent,
    IxInputComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DeviceDeleteModalComponent implements OnInit {
  readonly VmDeviceType = VmDeviceType;
  protected readonly requiredRoles = [Role.VmDeviceWrite];

  zvolConfirmLabelText: string;

  form = this.fb.group({
    zvol: [false],
    raw_file: [false],
    force: [false],
    zvolConfirm: [''],
  });

  constructor(
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public device: VmDevice,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DeviceDeleteModalComponent>,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private ws: ApiService,
  ) {
    if (this.device.attributes.dtype !== VmDeviceType.Disk) {
      return;
    }

    const zvolConfirmRequired = this.validatorsService.withMessage(
      Validators.required,
      this.translate.instant('Name of the zvol is required'),
    );

    const zvolName = this.getZvolName(this.device as VmDiskDevice);

    const zvolConfirmMustMatch = this.validatorsService.withMessage(
      Validators.pattern(new RegExp(`^${zvolName}$`)),
      this.translate.instant('Name of the zvol must be correct'),
    );

    this.form.controls.zvolConfirm.setValidators([
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
    this.form.controls.zvol.valueChanges.pipe(untilDestroyed(this)).subscribe(
      ($event) => this.onDestroyCheckedStateChanged($event),
    );
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    const value = this.form.value as VmDeviceDelete;
    this.ws.call('vm.device.delete', [
      this.device.id,
      {
        zvol: value.zvol,
        raw_file: value.raw_file,
        force: value.force,
      },
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }

  onDestroyCheckedStateChanged($event: unknown): void {
    if (!$event) {
      this.resetZvolConfirmValidState();
    }
  }

  private resetZvolConfirmValidState(): void {
    this.form.controls.zvolConfirm.reset();
    this.form.controls.zvolConfirm.setErrors(null);
  }

  private getZvolName(disk: VmDiskDevice): string {
    return disk.attributes.path.split('/').pop();
  }
}
