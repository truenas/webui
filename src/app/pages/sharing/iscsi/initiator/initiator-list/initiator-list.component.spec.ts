import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiExtent, IscsiInitiatorGroup } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { InitiatorListComponent } from 'app/pages/sharing/iscsi/initiator/initiator-list/initiator-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const initiators: IscsiInitiatorGroup[] = [
  {
    id: 1,
    comment: 'test-iscsi-initiators-groups-comment',
  } as IscsiExtent,
];

describe('InitiatorListComponent', () => {
  let spectator: SpectatorRouting<InitiatorListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createRoutingFactory({
    component: InitiatorListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockWebSocket([
        mockCall('iscsi.initiator.query', initiators),
        mockCall('iscsi.initiator.delete'),
      ]),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Initiators Groups');
  });

  it('redirects to initiator form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sharing', 'iscsi', 'initiators', 'add']);
  });

  it('redirects to initiator form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sharing', 'iscsi', 'initiators', 'edit', 1]);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('iscsi.initiator.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Group ID', 'Initiators', 'Description', ''],
      [
        '1',
        'Allow all initiators',
        'test-iscsi-initiators-groups-comment',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
