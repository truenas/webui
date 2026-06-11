import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

@Component({
  selector: 'ix-subsystem-delete-dialog',
  templateUrl: './subsystem-delete-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    TnCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
  ],
})
export class SubsystemDeleteDialogComponent {
  protected dialogRef = inject<DialogRef<unknown, SubsystemDeleteDialogComponent>>(DialogRef);

  protected readonly subsystem = inject<NvmeOfSubsystem>(DIALOG_DATA);
  protected readonly force = new FormControl(false as boolean);
  protected readonly requiredRoles: Role[] = [Role.SharingNvmeTargetWrite];

  protected delete(): void {
    this.dialogRef.close({ confirmed: true, force: this.force.value });
  }
}
