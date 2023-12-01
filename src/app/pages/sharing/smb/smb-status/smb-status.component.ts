import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ix-smb-status',
  templateUrl: './smb-status.component.html',
  styleUrls: ['./smb-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbStatusComponent {
  @Input() activeTab = 'sessions';
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

  constructor(
    protected translate: TranslateService,
  ) {}
}
