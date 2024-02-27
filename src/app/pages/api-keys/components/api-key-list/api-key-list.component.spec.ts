import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { WebSocketService } from 'app/services/ws.service';

describe('ApiKeyListComponent', () => {
  let spectator: Spectator<ApiKeyListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const apiKeys = [
    {
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
    },
  ] as ApiKey[];

  const createComponent = createComponentFactory({
    component: ApiKeyListComponent,
    imports: [
      AppLoaderModule,
      IxTable2Module,
      SearchInput1Component,
      MockModule(PageHeaderModule),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      ApiKeyFormDialogComponent,
    ],
    providers: [
      mockAuth(),
      ApiKeyComponentStore,
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockWebSocket([
        mockCall('api_key.query', apiKeys),
        mockCall('api_key.delete'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Created Date', ''],
      ['first-api-key', '2002-01-04 01:36:50', ''],
      ['second-api-key', '2002-01-15 15:23:30', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Smart Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ApiKeyFormDialogComponent, {
      data: apiKeys[1],
    });
  });

  it('deletes a Smart Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 0, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete API Key',
      buttonText: 'Delete',
      cancelText: 'Cancel',
      message: 'Are you sure you want to delete the <b>first-api-key</b> API Key?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.delete', ['1']);
  });
});
