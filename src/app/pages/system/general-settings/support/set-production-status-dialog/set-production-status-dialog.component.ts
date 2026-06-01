import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class SetProductionStatusDialog {
  private dialogRef = inject<DialogRef<SetProductionStatusDialogResult, SetProductionStatusDialog>>(DialogRef);

  protected readonly requiredRoles = [Role.FullAdmin];

  sendInitialDebugCheckbox = new FormControl(false, { nonNullable: true });

  onSubmit(): void {
    this.dialogRef.close({ sendInitialDebug: this.sendInitialDebugCheckbox.value });
  }
}
