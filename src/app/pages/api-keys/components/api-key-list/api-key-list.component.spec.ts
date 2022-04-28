import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';
import { ApiKeyComponentStore, ApiKeysState } from 'app/pages/api-keys/store/api-key.store';
import { DialogService, WebSocketService } from 'app/services';

describe('ApiKeyListComponent', () => {
  let spectator: Spectator<ApiKeyListComponent>;
  let loader: HarnessLoader;
  let store: ApiKeyComponentStore;

  const createComponent = createComponentFactory({
    component: ApiKeyListComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => 'Jan 10 2022 10:36')),
      ApiKeyFormDialogComponent,
    ],
    providers: [
      ApiKeyComponentStore,
      mockProvider(WebSocketService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockWebsocket([
        mockCall('api_key.query', [{
          id: 1,
          name: 'first-api-key',
          key: 'strong-key',
          created_at: {
            $date: 1010101010101,
          },
        }, {
          id: 2,
          name: 'second-api-key',
          key: 'strong-key',
          created_at: {
            $date: 1010101010101,
          },
        }]),
        mockCall('api_key.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store = spectator.inject(ApiKeyComponentStore);
  });

  it('should show table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Name', 'Created Date', ''],
      ['first-api-key', 'Jan 10 2022 10:36', 'more_vert'],
      ['second-api-key', 'Jan 10 2022 10:36', 'more_vert'],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store.setState({ isLoading: false, entities: [], error: null } as ApiKeysState);

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No API Keys']]);
  });

  it('should have error message when can not retrieve response', async () => {
    store.setState({ error: 'Can not retrieve response', isLoading: false, entities: [] } as ApiKeysState);

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Can not retrieve response']]);
  });

  it('should open edit dialog form when Edit item is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');
    spectator.inject(MockWebsocketService).mockCallOnce('api_key.query', [{
      id: 1,
      name: 'first-api-key',
      key: 'strong-key',
      created_at: {
        $date: 1010101010101,
      },
    }]);

    const actionsMenu = await loader.getHarness(MatMenuHarness.with({ selector: '[aria-label="API Key Actions"]' }));
    await actionsMenu.open();
    await actionsMenu.clickItem({ text: 'editEdit' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ApiKeyFormDialogComponent, {
      data: {
        id: 1,
        name: 'first-api-key',
        key: 'strong-key',
        created_at: {
          $date: 1010101010101,
        },
      },
    });
  });

  it('should open delete dialog when Delete item is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open');
    spectator.inject(MockWebsocketService).mockCallOnce('api_key.query', [{
      id: 1,
      name: 'first-api-key',
      key: 'strong-key',
      created_at: {
        $date: 1010101010101,
      },
    }]);

    const actionsMenu = await loader.getHarness(MatMenuHarness.with({ selector: '[aria-label="API Key Actions"]' }));
    await actionsMenu.open();
    await actionsMenu.clickItem({ text: 'deleteDelete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.delete', ['1']);
  });
});
