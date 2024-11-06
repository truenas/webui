import { MatTabsModule } from '@angular/material/tabs';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { SmbSessionListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-session-list/smb-session-list.component';
import { SmbStatusComponent } from 'app/pages/sharing/smb/smb-status/smb-status.component';

describe('SmbStatusComponent', () => {
  let spectator: SpectatorRouting<SmbStatusComponent>;

  const createComponent = createRoutingFactory({
    component: SmbStatusComponent,
    declarations: [
      MockComponents(SmbSessionListComponent),
    ],
    imports: [MatTabsModule],
    providers: [],
    params: {
      activeTab: 'sessions',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should have correct navLinks', () => {
    const expectedNavLinks = [
      {
        label: 'Sessions',
        path: '/sharing/smb/status/sessions',
      },
      {
        label: 'Locks',
        path: '/sharing/smb/status/locks',
      },
      {
        label: 'Shares',
        path: '/sharing/smb/status/shares',
      },
      {
        label: 'Notifications',
        path: '/sharing/smb/status/notifications',
      },
    ];
    expect(spectator.component.navLinks).toEqual(expectedNavLinks);
  });
});
