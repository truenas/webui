import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
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

@UntilDestroy()
@Component({
  selector: 'ix-stop-vm-dialog',
  templateUrl: './stop-vm-dialog.component.html',
  styleUrls: ['./stop-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    IxCheckboxComponent,
    ReactiveFormsModule,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class StopVmDialogComponent {
  forceAfterTimeoutCheckbox = new FormControl(false);
  protected readonly requiredRoles = [Role.VmWrite];

  readonly helptext = helptextVmList;

  constructor(
    private dialogRef: MatDialogRef<StopVmDialogComponent, StopVmDialogData>,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
  ) { }

  onStop(): void {
    this.dialogRef.close({
      forceAfterTimeout: this.forceAfterTimeoutCheckbox.value,
    });
  }
}
