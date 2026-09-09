import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3AccessKeyStatus } from 'app/enums/s3.enum';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { S3AccessKeyFormComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-form/s3-access-key-form.component';
import { S3AccessKeyListComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-list/s3-access-key-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('S3AccessKeyListComponent', () => {
  let spectator: Spectator<S3AccessKeyListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const keys = [
    {
      id: 1,
      name: 'backup-key',
      username: 'alice',
      access_key: 'AKIAEXAMPLE12345',
      secret: 'secret',
      status: S3AccessKeyStatus.Enabled,
      expires_at: null,
      created_at: { $date: 1700000000000 },
    },
  ] as S3AccessKey[];

  const rotatedKey = { ...keys[0], secret: 'newsecret' } as S3AccessKey;

  const createComponent = createComponentFactory({
    component: S3AccessKeyListComponent,
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockProvider(SnackbarService),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn(() => of(undefined)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      provideMockStore({
        selectors: [{ selector: selectPreferences, value: {} }],
      }),
      mockApi([
        mockCall('s3.accesskey.query', keys),
        mockCall('s3.accesskey.update', rotatedKey),
        mockCall('s3.accesskey.delete'),
      ]),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Name', 'User', 'Access Key ID', 'Status', 'Expires On', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['backup-key', 'alice', 'AKIAEXAMPLE12345', 'Enabled', 'Never', ''],
    ]);
  });

  it('opens the access key form when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3AccessKeyFormComponent, {
      title: 'Add S3 Access Key',
      inputs: { accessKey: undefined },
    });
  });

  it('rotates the secret after confirmation and shows the new credentials', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Rotate Secret' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      buttonColor: 'warn',
    }));
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.update', [1, { rotate: true }]);
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      S3AccessKeyCredentialsDialogComponent,
      { data: rotatedKey },
    );
  });

  it('confirms deletion when Delete is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      call: expect.any(Function),
    });
  });
});
