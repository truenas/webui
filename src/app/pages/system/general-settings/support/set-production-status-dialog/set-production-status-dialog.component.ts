import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface SetProductionStatusDialogResult {
  sendInitialDebug: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-set-production-status-dialog',
  templateUrl: './set-production-status-dialog.component.html',
  styleUrls: ['./set-production-status-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class SetProductionStatusDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

  sendInitialDebugCheckbox = new FormControl(false);

  constructor(
    private dialogRef: MatDialogRef<SetProductionStatusDialogComponent, SetProductionStatusDialogResult>,
  ) { }

  onSubmit(): void {
    this.dialogRef.close({ sendInitialDebug: this.sendInitialDebugCheckbox.value });
  }
}
