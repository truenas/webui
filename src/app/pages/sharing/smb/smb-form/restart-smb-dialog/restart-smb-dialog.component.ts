import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-restart-smb-dialog',
  templateUrl: './restart-smb-dialog.component.html',
  styleUrl: './restart-smb-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
    IxIconComponent,
  ],
})
export class RestartSmbDialog {
  protected readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];

  readonly helptext = helptextSharingSmb;

  readonly showLearnMore = signal(false);

  toggleLearnMore(): void {
    this.showLearnMore.set(!this.showLearnMore());
  }
}
