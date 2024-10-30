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
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { UserApiKeysComponent } from 'app/pages/credentials/users/user-api-keys/user-api-keys.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('UserApiKeysComponent', () => {
  let spectator: Spectator<UserApiKeysComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const apiKeys = [
    {
      id: 1,
      name: 'first-api-key',
      username: 'root',
      keyhash: 'strong-key',
      created_at: {
        $date: 1010101010101,
      },
    }, {
      id: 2,
      name: 'second-api-key',
      username: 'root',
      keyhash: 'strong-key',
      created_at: {
        $date: 1011101010102,
      },
    },
  ] as ApiKey[];

  const createComponent = createComponentFactory({
    component: UserApiKeysComponent,
    imports: [
      SearchInputComponent,
      MockComponent(PageHeaderComponent),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      ApiKeyFormComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
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
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
      }),
      mockProvider(SlideInRef, {
        slideInClosed$: of(true),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Username', 'Keyhash', 'Created date', 'Expires date', ''],
      ['first-api-key', 'root', 'strong-key', '2002-01-03 15:36:50', 'Never', ''],
      ['second-api-key', 'root', 'strong-key', '2002-01-15 05:23:30', 'Never', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Smart Task when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-pencil' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ApiKeyFormComponent, {
      data: apiKeys[0],
    });
  });

  it('deletes a Smart Task with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
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
