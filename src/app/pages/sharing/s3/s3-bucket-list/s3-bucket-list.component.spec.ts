import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness,
  TnTableHarness,
} from '@truenas/ui-components';
import { Subject, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3ObjectOwnership, S3PermissionsModel, S3Versioning } from 'app/enums/s3.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { S3BucketListComponent } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('S3BucketListComponent', () => {
  let spectator: Spectator<S3BucketListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const buckets = [
    {
      id: 1,
      name: 'backups',
      dataset: 'tank/buckets/backups',
      owner: 'bob',
      permissions_model: S3PermissionsModel.S3,
      object_ownership: S3ObjectOwnership.BucketOwnerEnforced,
      versioning: S3Versioning.Enabled,
      object_lock: true,
      enabled: true,
      locked: false,
    },
  ] as S3Bucket[];

  const createComponent = createComponentFactory({
    component: S3BucketListComponent,
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockProvider(ErrorHandlerService),
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
        mockCall('sharing.s3.query', buckets),
        mockCall('sharing.s3.delete'),
        mockCall('sharing.s3.update'),
        mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
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

  it('shows the page title', () => {
    // White-box: no TnCardHarness in @truenas/ui-components yet.
    expect(spectator.query(TnCardComponent)!.title()).toBe('S3 Buckets');
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Name', 'Dataset', 'Owner', 'Permissions Model', 'Versioning', 'Object Lock', 'Enabled', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['backups', 'tank/buckets/backups', 'bob', 'S3 Only', 'Enabled', 'Yes', '', ''],
    ]);
  });

  it('opens the bucket form when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      title: 'Add S3 Bucket',
      inputs: { bucket: undefined },
    });
  });

  it('opens the bucket form with the row when Edit is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      title: 'Edit S3 Bucket',
      inputs: { bucket: expect.objectContaining(buckets[0]) },
    });
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

  it('reverts the toggle when the update fails', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
    expect(await toggle.isChecked()).toBe(true);
    // The failure arrives after the flip has been applied, as a real API error would.
    const update$ = new Subject<S3Bucket>();
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(update$ as never);

    await toggle.uncheck();
    expect(await toggle.isChecked()).toBe(false);
    update$.error(new Error('nope'));

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    expect(await toggle.isChecked()).toBe(true);
  });
});
