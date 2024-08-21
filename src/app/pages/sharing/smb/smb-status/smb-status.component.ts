import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { smbStatusElements } from 'app/pages/sharing/smb/smb-status/smb-status.elements';

@Component({
  selector: 'ix-smb-status',
  templateUrl: './smb-status.component.html',
  styleUrls: ['./smb-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbStatusComponent {
  readonly activeTab = input('sessions');

  navLinks = [{
    label: this.translate.instant('Sessions'),
    path: '/sharing/smb/status/sessions',
  }, {
    label: this.translate.instant('Locks'),
    path: '/sharing/smb/status/locks',
  }, {
    label: this.translate.instant('Shares'),
    path: '/sharing/smb/status/shares',
  }, {
    label: this.translate.instant('Notifications'),
    path: '/sharing/smb/status/notifications',
  }];

  protected readonly searchableElements = smbStatusElements;

  constructor(
    protected translate: TranslateService,
  ) {}
}
