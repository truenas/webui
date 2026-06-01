import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-subsystem-port-or-host-delete-dialog',
  templateUrl: './subsystem-port-ot-host-delete-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
TranslateModule,
    ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class SubsystemPortOrHostDeleteDialogComponent {
  private dialogRef = inject<DialogRef<unknown, SubsystemPortOrHostDeleteDialogComponent>>(DialogRef);
  private translate = inject(TranslateService);

  protected readonly data = inject<PortOrHostDeleteDialogData>(DIALOG_DATA);
  protected readonly requiredRoles: Role[] = [Role.SharingNvmeTargetWrite];
  protected readonly type = this.data.type === PortOrHostDeleteType.Host
    ? this.translate.instant('Host')
    : this.translate.instant('Port');

  protected delete(): void {
    this.dialogRef.close({
      confirmed: true,
      force: this.data.subsystemsInUse?.length > 0,
    });
  }
}
