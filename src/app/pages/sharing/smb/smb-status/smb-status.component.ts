import {
  ChangeDetectionStrategy, Component, computed, input, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TnTabComponent, TnTabsComponent, type TabChangeEvent } from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
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
  imports: [
    TnTabsComponent,
    TnTabComponent,
    SmbSessionListComponent,
    UiSearchDirective,
    SmbLockListComponent,
    SmbShareListComponent,
    SmbNotificationListComponent,
  ],
})
export class SmbStatusComponent {
  private translate = inject(TranslateService);
  private router = inject(Router);

  readonly activeTab = input('sessions');

  protected readonly navLinks = [{
    label: this.translate.instant('Sessions'),
    path: '/sharing/smb/status/sessions',
    slug: 'sessions',
  }, {
    label: this.translate.instant('Locks'),
    path: '/sharing/smb/status/locks',
    slug: 'locks',
  }, {
    label: this.translate.instant('Shares'),
    path: '/sharing/smb/status/shares',
    slug: 'shares',
  }, {
    label: this.translate.instant('Notifications'),
    path: '/sharing/smb/status/notifications',
    slug: 'notifications',
  }];

  protected readonly activeTabIndex = computed(() => {
    const index = this.navLinks.findIndex((link) => link.slug === this.activeTab());
    return index === -1 ? 0 : index;
  });

  protected onTabChange(event: TabChangeEvent): void {
    // tn-tabs re-emits the current index while initializing (index === previousIndex)
    // and the route-driven [selectedIndex] binding already reflects router state — only
    // a genuine user tab switch should navigate.
    if (event.index === event.previousIndex || event.index === this.activeTabIndex()) {
      return;
    }
    const link = this.navLinks[event.index];
    if (link) {
      this.router.navigate([link.path]);
    }
  }

  protected readonly searchableElements = smbStatusElements;
}
