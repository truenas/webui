import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnIconHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { UserApiKeysComponent } from 'app/pages/credentials/users/user-api-keys/user-api-keys.component';

describe('UserApiKeysComponent', () => {
  let spectator: Spectator<UserApiKeysComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  beforeEach(() => fakeDate(new Date('2026-01-20T00:00:00Z')));
  afterEach(() => restoreDate());

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
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockApi([
        mockCall('api_key.query', apiKeys),
        mockCall('api_key.delete'),
      ]),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('renders a button to add new API key', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(
      spectator.inject(FormSidePanelService).open,
    ).toHaveBeenCalledWith(ApiKeyFormComponent, { title: 'Add API Key', inputs: { editingKey: undefined } });
  });

  it('renders a button that opens API docs', async () => {
    const docsButton = await loader.getHarness(TnButtonHarness.with({ label: 'API Docs' }));
    const host = await docsButton.host();

    expect(docsButton).toBeTruthy();
    expect(await host.getAttribute('href')).toBe('/api/docs');
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(
      ['Name', 'Username', 'Local', 'Revoked', 'Created Date', 'Expires On', ''],
    );

    expect(await table.getAllRowTexts()).toEqual([
      ['first-api-key', 'root', 'Yes', 'No', '2002-01-03 07:36:50', 'in about 6 years', ''],
      ['second-api-key', 'root', 'No', 'Yes', '2002-01-14 21:23:30', 'Never', ''],
    ]);
  });

  it('shows form to edit an existing API Key when Edit button is pressed', async () => {
    const editButton = await loader.getHarness(TnIconHarness.with({ name: 'pencil' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(ApiKeyFormComponent, {
      title: 'Edit API Key',
      inputs: { editingKey: apiKeys[0] },
    });
  });

  it('deletes a API Key with confirmation when Delete button is pressed', async () => {
    const deleteIcons = await loader.getAllHarnesses(TnIconHarness.with({ name: 'delete' }));
    await deleteIcons[0].click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete API Key',
      message: 'Are you sure you want to delete the <b>first-api-key</b> API Key?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('api_key.delete', [1]);
  });
});
