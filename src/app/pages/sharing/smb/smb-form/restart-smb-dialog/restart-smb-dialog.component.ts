import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { TestDirective } from 'app/modules/test-id/test.directive';

interface RestartDialogData {
  homeshare: boolean;
  timemachine: boolean;
  hosts: boolean;
  path: boolean;
  isNew: boolean;
}

@Component({
  selector: 'ix-restart-smb-dialog',
  templateUrl: './restart-smb-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class RestartSmbDialogComponent {
  readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];

  readonly helptext = helptextSharingSmb;
  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: RestartDialogData,
  ) {}

  get homeShareMessage(): string {
    return this.data.isNew
      ? this.translate.instant('Enabled \'Use as Home Share\'')
      : this.translate.instant('Updated \'Use as Home Share\'');
  }

  get timemachineMessage(): string {
    return this.data.isNew
      ? this.translate.instant('Enabled \'Time Machine\'')
      : this.translate.instant('Update \'Time Machine\'');
  }

  get pathMessage(): string {
    return this.translate.instant('Share Path updated');
  }

  get hostsMessage(): string {
    return this.data.isNew
      ? this.translate.instant('\'Hosts Allow\' or \'Hosts Deny\' has been set')
      : this.translate.instant('\'Hosts Allow\' or \'Hosts Deny\' has been updated');
  }
}
