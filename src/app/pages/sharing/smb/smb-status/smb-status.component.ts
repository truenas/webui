import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { smbStatusElements } from 'app/pages/sharing/smb/smb-status/smb-status.elements';
import { SmbLockListComponent } from './components/smb-lock-list/smb-lock-list.component';
import { SmbNotificationListComponent } from './components/smb-notification-list/smb-notification-list.component';
import { SmbSessionListComponent } from './components/smb-session-list/smb-session-list.component';
import { SmbShareListComponent } from './components/smb-share-list/smb-share-list.component';

@Component({
  selector: 'ix-smb-status',
  templateUrl: './smb-status.component.html',
  styleUrls: ['./smb-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTabNav,
    MatTabLink,
    TestDirective,
    MatTabNavPanel,
    SmbSessionListComponent,
    UiSearchDirective,
    SmbLockListComponent,
    SmbShareListComponent,
    SmbNotificationListComponent,
    TranslateModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
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
