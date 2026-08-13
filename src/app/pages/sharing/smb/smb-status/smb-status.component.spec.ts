import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory } from '@ngneat/spectator/jest';
import { TnTabsHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { SmbLockListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-lock-list/smb-lock-list.component';
import { SmbNotificationListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-notification-list/smb-notification-list.component';
import { SmbSessionListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-session-list/smb-session-list.component';
import { SmbShareListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-share-list/smb-share-list.component';
import { SmbStatusComponent } from 'app/pages/sharing/smb/smb-status/smb-status.component';

describe('SmbStatusComponent', () => {
  let spectator: SpectatorRouting<SmbStatusComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: SmbStatusComponent,
    declarations: [
      MockComponents(
        SmbSessionListComponent,
        SmbLockListComponent,
        SmbShareListComponent,
        SmbNotificationListComponent,
      ),
    ],
    providers: [],
    params: {
      activeTab: 'sessions',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a tab for every SMB status view', async () => {
    const tabs = await loader.getHarness(TnTabsHarness);

    expect(await tabs.getTabLabels()).toEqual([
      'Sessions',
      'Locks',
      'Shares',
      'Notifications',
    ]);
  });

  it('shows the list matching the active tab', () => {
    spectator.setInput('activeTab', 'locks');

    expect(spectator.query(SmbLockListComponent)).toExist();
    expect(spectator.query(SmbSessionListComponent)).not.toExist();
  });

  it('navigates to the tab route when a tab is selected', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const tabs = await loader.getHarness(TnTabsHarness);
    await tabs.selectTab({ label: 'Shares' });

    expect(router.navigate).toHaveBeenCalledWith(['/sharing/smb/status/shares']);
  });
});
