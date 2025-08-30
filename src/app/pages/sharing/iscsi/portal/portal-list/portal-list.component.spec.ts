import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
  let spectator: SpectatorRouting<PortalListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createRoutingFactory({
    component: PortalListComponent,
    imports: [
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.portal.query', portals),
        mockCall('iscsi.portal.delete'),
        mockCall('iscsi.portal.listen_ip_choices', { '0.0.0.0': '0.0.0.0' } as Choices),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(),
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

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Portals');
  });

  it('opens portal form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortalFormComponent);
  });

  it('opens portal form when "Edit" button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortalFormComponent, {
      data: portals[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('iscsi.portal.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Portal Group ID', 'Listen', 'Description', ''],
      [
        '1',
        '0.0.0.0:3260',
        'test-portal',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
