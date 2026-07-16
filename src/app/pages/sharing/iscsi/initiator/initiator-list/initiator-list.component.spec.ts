import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiInitiatorGroup } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { InitiatorListComponent } from 'app/pages/sharing/iscsi/initiator/initiator-list/initiator-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const initiators = [
  {
    id: 1,
    comment: 'test-iscsi-initiators-groups-comment',
  } as IscsiInitiatorGroup,
];

describe('InitiatorListComponent', () => {
  let spectator: SpectatorRouting<InitiatorListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createRoutingFactory({
    component: InitiatorListComponent,
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.initiator.query', initiators),
        mockCall('iscsi.initiator.delete'),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
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
    expect(spectator.query(TnCardComponent)!.title()).toBe('Initiators Groups');
  });

  it('redirects to initiator form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sharing', 'iscsi', 'initiators', 'add']);
  });

  it('redirects to initiator form when "Edit" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sharing', 'iscsi', 'initiators', 'edit', 1]);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete this item?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.initiator.delete', [1]);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Group ID', 'Initiators', 'Description', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['1', 'Allow all initiators', 'test-iscsi-initiators-groups-comment', ''],
    ]);
  });
});
