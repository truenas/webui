import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const shares: Partial<NfsShare>[] = [
  {
    id: 1,
    enabled: true,
    hosts: ['host1', 'host2'],
    networks: ['network1', 'network2'],
    comment: 'comment',
    path: 'some-path',
  },
];

describe('NfsListComponent', () => {
  let spectator: Spectator<NfsListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: NfsListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(EmptyService),
      mockWebsocket([
        mockCall('sharing.nfs.query', shares as NfsShare[]),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
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
    expect(title).toHaveText('NFS');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(NfsFormComponent);
  });

  it('opens acme dns authenticator form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();


    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(NfsFormComponent, {
      data: shares[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('sharing.nfs.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Path', 'Description', 'Networks', 'Hosts', 'Enabled', ''],
      ['some-path', 'comment', 'network1, network2', 'host1, host2', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});