import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiKeysComponent } from 'app/pages/api-keys/api-keys.component';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ApiKeysComponent', () => {
  let spectator: Spectator<ApiKeysComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
        $date: 1011101010102,
      },
    },
  ] as ApiKey[];

  const createComponent = createComponentFactory({
    component: ApiKeysComponent,
    imports: [
      SearchInput1Component,
      MockComponent(PageHeaderComponent),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      ApiKeyFormDialogComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Created Date', ''],
      ['first-api-key', '2002-01-03 15:36:50', ''],
      ['second-api-key', '2002-01-15 05:23:30', ''],
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
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 0, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete API Key',
      buttonText: 'Delete',
      cancelText: 'Cancel',
      message: 'Are you sure you want to delete the <b>first-api-key</b> API Key?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('api_key.delete', [1]);
  });
});
