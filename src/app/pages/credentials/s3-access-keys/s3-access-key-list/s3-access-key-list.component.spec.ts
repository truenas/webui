import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3AccessKeyStatus } from 'app/enums/s3.enum';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  let table: IxTableHarness;

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
    imports: [
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    declarations: [FakeFormatDateTimePipe],
    providers: [
      mockAuth(),
      mockProvider(LocaleService, {
        timezone: 'UTC',
      }),
      mockProvider(EmptyService),
      mockProvider(SnackbarService),
      mockProvider(MatDialog),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
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

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Name', 'User', 'Access Key ID', 'Status', 'Expires On', ''],
      ['backup-key', 'alice', 'AKIAEXAMPLE12345', 'Enabled', 'Never', ''],
    ]);
  });

  it('opens access key form when Add is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(S3AccessKeyFormComponent);
  });

  it('rotates the secret after confirmation and shows the new credentials', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Rotate Secret' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.update', [1, { rotate: true }]);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      S3AccessKeyCredentialsDialogComponent,
      { data: rotatedKey },
    );
  });

  it('deletes the key after confirmation when Delete is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.accesskey.delete', [1]);
  });
});
