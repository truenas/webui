import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { of, pipe } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { PortalListComponent } from 'app/pages/sharing/iscsi/portal/portal-list/portal-list.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
  let table: IxTable2Harness;

  const createComponent = createRoutingFactory({
    component: PortalListComponent,
    imports: [IxTable2Module, AppLoaderModule],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(EmptyService),
      mockProvider(AppLoaderService, {
        withLoader: jest.fn(() => pipe()),
      }),
      mockWebsocket([
        mockCall('iscsi.portal.query', portals),
        mockCall('iscsi.portal.delete'),
        mockCall('iscsi.portal.listen_ip_choices', { '0.0.0.0': '0.0.0.0' } as Choices),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Portals');
  });

  it('opens portal form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(PortalFormComponent);
  });

  it('opens portal form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();


    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(PortalFormComponent, {
      data: portals[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('iscsi.portal.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Portal Group ID', 'Listen', 'Description', 'Discovery Auth Method', 'Discovery Auth Group', ''],
      [
        '1',
        '0.0.0.0:3260',
        'test-portal',
        'NONE',
        '0',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
