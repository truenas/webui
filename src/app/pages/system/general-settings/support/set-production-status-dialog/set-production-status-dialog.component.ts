import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

export interface SetProductionStatusDialogResult {
  sendInitialDebug: boolean;
}

@Component({
  selector: 'ix-set-production-status-dialog',
  templateUrl: './set-production-status-dialog.component.html',
  styleUrls: ['./set-production-status-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnCheckboxComponent, TnFormFieldComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class SetProductionStatusDialog {
  protected dialogRef = inject<DialogRef<SetProductionStatusDialogResult, SetProductionStatusDialog>>(DialogRef);

  protected readonly requiredRoles = [Role.FullAdmin];

  sendInitialDebugCheckbox = new FormControl(false, { nonNullable: true });

  onSubmit(): void {
    this.dialogRef.close({ sendInitialDebug: this.sendInitialDebugCheckbox.value });
  }
}
