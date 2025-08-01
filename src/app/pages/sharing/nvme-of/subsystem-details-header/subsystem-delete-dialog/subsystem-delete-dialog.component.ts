import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-subsystem-delete-dialog',
  templateUrl: './subsystem-delete-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
  ],
})
export class SubsystemDeleteDialogComponent {
  private dialogRef = inject<MatDialogRef<SubsystemDeleteDialogComponent>>(MatDialogRef);

  protected readonly subsystem = inject<NvmeOfSubsystem>(MAT_DIALOG_DATA);
  protected readonly force = new FormControl(false as boolean);
  protected readonly requiredRoles: Role[] = [Role.SharingNvmeTargetWrite];

  protected delete(): void {
    this.dialogRef.close({ confirmed: true, force: this.force.value });
  }
}
