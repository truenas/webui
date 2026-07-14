import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnTabsHarness } from '@truenas/ui-components';
import { MockComponent, MockComponents } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { LicenseService } from 'app/services/license.service';
import { IscsiComponent } from './iscsi.component';

describe('IscsiComponent', () => {
  let spectator: Spectator<IscsiComponent>;
  const hasFibreChannel$ = new BehaviorSubject(false);
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: IscsiComponent,
    declarations: [
      MockComponents(GlobalTargetConfigurationComponent),
    ],
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockProvider(LicenseService, {
        hasFibreChannel$,
      }),
      mockAuth(),
      mockApi(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has a Global Target Configuration button that opens the settings form', async () => {
    const configurationButton = await loader.getHarness(TnButtonHarness.with({ label: 'Global Target Configuration' }));
    await configurationButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(GlobalTargetConfigurationComponent, {
      title: 'iSCSI Global Configuration',
    });
  });

  it('shows a navtab with supported links', async () => {
    const tabs = await loader.getHarness(TnTabsHarness);

    expect(await tabs.getTabLabels()).toEqual([
      'Targets',
      'Extents',
      'Initiators',
      'Portals',
      'Authorized Access',
    ]);
  });

  it('shows fibre channel link navtab on a fibre channel capable system', async () => {
    hasFibreChannel$.next(true);
    spectator.detectChanges();

    const tabs = await loader.getHarness(TnTabsHarness);
    const labels = await tabs.getTabLabels();

    expect(labels).toHaveLength(6);
    expect(labels[5]).toBe('Fibre Channel Ports');
  });

  it('navigates to the tab route when a tab is selected', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const tabs = await loader.getHarness(TnTabsHarness);
    await tabs.selectTab({ label: 'Extents' });

    expect(router.navigate).toHaveBeenCalledWith(['/sharing/iscsi/extents']);
  });
});
