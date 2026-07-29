import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { DeleteExtentDialog } from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { ExtentListComponent } from 'app/pages/sharing/iscsi/extent/extent-list/extent-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const extents: IscsiExtent[] = [
  {
    id: 1,
    name: 'test-iscsi-extent',
    path: '/dev/zvol/tank/iscsi-extent',
    comment: 'test-iscsi-extent-comment',
    serial: 'test-iscsi-extent-serial',
    product_id: 'test-product-id',
    enabled: true,
    naa: '0x6589cfc00000097bd2aa6aff515d84c9',
  } as IscsiExtent,
];

describe('ExtentListComponent', () => {
  let spectator: Spectator<ExtentListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: ExtentListComponent,
    providers: [
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.extent.query', extents),
        mockCall('iscsi.extent.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(null),
          close: jest.fn(),
        } as unknown as DialogRef)),
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
    expect(spectator.query(TnCardComponent)!.title()).toBe('Extents');
  });

  it('opens extent form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(ExtentFormComponent, {
      title: 'Add Extent',
      wide: true,
      inputs: { extentData: undefined },
    });
  });

  it('opens extent form when "Edit" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(ExtentFormComponent, {
      title: 'Edit Extent',
      wide: true,
      inputs: { extentData: extents[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DeleteExtentDialog, {
      data: extents[0],
    });
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Extent Name', 'Device/File', 'Description', 'Serial', 'Product ID', 'NAA', 'Enabled', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      [
        'test-iscsi-extent',
        '/dev/zvol/tank/iscsi-extent',
        'test-iscsi-extent-comment',
        'test-iscsi-extent-serial',
        'test-product-id',
        '0x6589cfc00000097bd2aa6aff515d84c9',
        'Yes',
        '',
      ],
    ]);
  });
});
