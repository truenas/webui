import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';
import { ApiKeyComponentStore, ApiKeysState } from 'app/pages/api-keys/store/api-key.store';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

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
      FakeFormatDateTimePipe,
      ApiKeyFormDialogComponent,
    ],
    providers: [
      ApiKeyComponentStore,
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
            $date: 1011101010101,
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
      ['first-api-key', '2002-01-04 01:36:50', ''],
      ['second-api-key', '2002-01-15 15:23:30', ''],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store.setState({ isLoading: false, entities: [], error: null } as ApiKeysState);

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should have error message when can not retrieve response', async () => {
    store.setState({ error: 'Can not retrieve response', isLoading: false, entities: [] } as ApiKeysState);

    spectator.detectChanges();
    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('Can not retrieve response');
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
    await actionsMenu.clickItem({ text: 'Edit' });

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
    await actionsMenu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.delete', ['1']);
  });
});
