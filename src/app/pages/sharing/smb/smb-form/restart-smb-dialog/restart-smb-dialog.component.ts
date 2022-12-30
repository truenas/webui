import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { helptextSharingSmb } from 'app/helptext/sharing';

interface RestartDialogData {
  homeshare: boolean;
  timemachine: boolean;
  hosts: boolean;
  path: boolean;
  isNew: boolean;
}

@Component({
  templateUrl: './restart-smb-dialog.component.html',
})
export class RestartSmbDialogComponent {
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
