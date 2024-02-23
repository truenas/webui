import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, pipe } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { AuthorizedAccessFormComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { AuthorizedAccessListComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-list/authorized-access-list.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const authAccess: IscsiAuthAccess[] = [
  {
    id: 1,
    tag: 1,
    user: 'test',
    peeruser: 'test',
  } as IscsiAuthAccess,
];

describe('AuthorizedAccessListComponent', () => {
  let spectator: Spectator<AuthorizedAccessListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: AuthorizedAccessListComponent,
    imports: [
      IxTable2Module,
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(EmptyService),
      mockProvider(AppLoaderService, {
        withLoader: jest.fn(() => pipe()),
      }),
      mockWebSocket([
        mockCall('iscsi.auth.query', authAccess),
        mockCall('iscsi.auth.delete'),
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

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Authorized Access');
  });

  it('opens authorized access form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AuthorizedAccessFormComponent);
  });

  it('opens authorized access form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AuthorizedAccessFormComponent, {
      data: authAccess[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('iscsi.auth.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Group ID', 'User', 'Peer User', ''],
      [
        '1',
        'test',
        'test',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
