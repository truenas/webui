import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { OldSlideInRef } from 'app/modules/slide-ins/old-slide-in-ref';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { UserApiKeysComponent } from 'app/pages/credentials/users/user-api-keys/user-api-keys.component';
import { LocaleService } from 'app/services/locale.service';
import { OldSlideInService } from 'app/services/old-slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('UserApiKeysComponent', () => {
  let spectator: Spectator<UserApiKeysComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const apiKeys = [
    {
      id: 1,
      name: 'first-api-key',
      username: 'root',
      local: true,
      revoked: false,
      created_at: {
        $date: new Date('2002-01-03T15:36:50Z').getTime(),
      },
      expires_at: {
        $date: new Date('2032-02-06T05:10:10Z').getTime(),
      },
    }, {
      id: 2,
      name: 'second-api-key',
      username: 'root',
      local: false,
      revoked: true,
      created_at: {
        $date: new Date('2002-01-15T05:23:30Z').getTime(),
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
      mockApi([
        mockCall('api_key.query', apiKeys),
        mockCall('api_key.delete'),
      ]),
      mockProvider(OldSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
      }),
      mockProvider(OldSlideInRef, {
        slideInClosed$: of(true),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('renders a button to add new API key', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ApiKeyFormComponent, { data: undefined });
  });

  it('renders a button that opens API docs', async () => {
    const docsButton = await loader.getHarness(MatButtonHarness.with({ text: 'API Docs' }));
    const host = await docsButton.host();

    expect(docsButton).toBeTruthy();
    expect(await host.getAttribute('href')).toBe('/api/docs');
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Username', 'Local', 'Revoked', 'Created Date', 'Expires', ''],
      ['first-api-key', 'root', 'Yes', 'No', '2002-01-03 07:36:50', 'in 7 years', ''],
      ['second-api-key', 'root', 'No', 'Yes', '2002-01-14 21:23:30', 'Never', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing API Key when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-pencil' }), 1, 6);
    await editButton.click();

    expect(spectator.inject(OldSlideInService).open).toHaveBeenCalledWith(ApiKeyFormComponent, {
      data: apiKeys[0],
    });
  });

  it('deletes a API Key with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 6);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete API Key',
      buttonText: 'Delete',
      cancelText: 'Cancel',
      message: 'Are you sure you want to delete the <b>first-api-key</b> API Key?',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.delete', [1]);
  });
});
