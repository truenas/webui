import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { PortalListComponent } from 'app/pages/sharing/iscsi/portal/portal-list/portal-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const portals: IscsiPortal[] = [
  {
    id: 1,
    listen: [{
      ip: '0.0.0.0',
      port: 3260,
    }],
    comment: 'test-portal',
    discovery_authmethod: 'NONE',
    discovery_authgroup: 0,
    tag: 1,
  } as IscsiPortal,
];

describe('PortalListComponent', () => {
  let spectator: Spectator<PortalListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: PortalListComponent,
    providers: [
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.portal.query', portals),
        mockCall('iscsi.portal.delete'),
        mockCall('iscsi.portal.listen_ip_choices', { '0.0.0.0': '0.0.0.0' } as Choices),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockAuth(),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows accurate page title', () => {
    // White-box: no TnCardHarness in @truenas/ui-components yet.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Portals');
  });

  it('opens portal form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(PortalFormComponent, {
      title: 'Add Portal',
      inputs: { portalData: undefined },
    });
  });

  it('opens portal form when "Edit" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(PortalFormComponent, {
      title: 'Edit Portal',
      inputs: { portalData: portals[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete this item?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.portal.delete', [1]);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Portal Group ID', 'Listen', 'Description', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['1', '0.0.0.0:3260', 'test-portal', ''],
    ]);
  });
});
