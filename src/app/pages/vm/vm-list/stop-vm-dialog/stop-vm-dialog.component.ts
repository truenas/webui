import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface StopVmDialogData {
  forceAfterTimeout: boolean;
}

@Component({
  selector: 'ix-stop-vm-dialog',
  templateUrl: './stop-vm-dialog.component.html',
  styleUrls: ['./stop-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnDialogShellComponent,
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class StopVmDialogComponent {
  protected dialogRef = inject<DialogRef<StopVmDialogData, StopVmDialogComponent>>(DialogRef);
  vm = inject<VirtualMachine>(DIALOG_DATA);

  forceAfterTimeoutCheckbox = new FormControl(false, { nonNullable: true });
  protected readonly requiredRoles = [Role.VmWrite];

  readonly helptext = helptextVmList;

  onStop(): void {
    this.dialogRef.close({
      forceAfterTimeout: this.forceAfterTimeoutCheckbox.value,
    });
  }
}
