import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VmDeviceType, vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-delete-vm-dialog',
  templateUrl: './delete-vm-dialog.component.html',
  styleUrls: ['./delete-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxInputComponent,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DeleteVmDialogComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<DeleteVmDialogComponent>>(MatDialogRef);
  private validators = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  vm = inject<VirtualMachine>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.VmWrite];

  form = this.formBuilder.group({
    zvols: [false],
    force: [false],
    confirmName: [''],
  });

  readonly helptext = helptextVmList;
  protected devices = signal<VmDevice[]>([]);

  ngOnInit(): void {
    this.setConfirmationValidator();
    this.loadDevices();
  }

  private loadDevices(): void {
    this.api.call('vm.device.query', [[['vm', '=', this.vm.id]]])
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((devices) => {
        // Only show DISK and RAW devices
        const filteredDevices = devices.filter((device) => {
          return [VmDeviceType.Disk, VmDeviceType.Raw].includes(device.attributes.dtype);
        });
        this.devices.set(filteredDevices);
      });
  }

  protected getDeviceLabel(device: VmDevice): string {
    const typeLabel = this.translate.instant(vmDeviceTypeLabels.get(device.attributes.dtype));
    // Only DISK and RAW devices are shown, both have path property
    const path = 'path' in device.attributes ? device.attributes.path : '';
    return `${typeLabel} (${path})`;
  }

  onDelete(): void {
    this.api.call('vm.delete', [this.vm.id, {
      force: this.form.value.force,
      zvols: this.form.value.zvols,
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }

  private setConfirmationValidator(): void {
    const validator = this.validators.confirmValidator(
      this.vm.name,
      this.translate.instant('Enter vm name to continue.'),
    );
    this.form.controls.confirmName.setValidators(validator);
  }
}
