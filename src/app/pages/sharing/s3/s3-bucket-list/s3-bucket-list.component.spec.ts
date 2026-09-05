import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3PermissionsModel } from 'app/enums/s3.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { S3BucketListComponent } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('S3BucketListComponent', () => {
  let spectator: Spectator<S3BucketListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const buckets = [
    {
      id: 1,
      name: 'backups',
      dataset: 'tank/buckets/backups',
      owner: 'bob',
      permissions_model: S3PermissionsModel.BucketOwnerEnforced,
      enabled: true,
      locked: false,
    },
  ] as S3Bucket[];

  const createComponent = createComponentFactory({
    component: S3BucketListComponent,
    imports: [
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
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
        mockCall('sharing.s3.query', buckets),
        mockCall('sharing.s3.delete'),
        mockCall('sharing.s3.update'),
        mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
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
      ['Name', 'Dataset', 'Owner', 'Permissions Model', 'Enabled', ''],
      ['backups', 'tank/buckets/backups', 'bob', 'Bucket Owner Enforced', '', ''],
    ]);
  });

  it('opens bucket form when Add is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(S3BucketFormComponent);
  });

  it('opens bucket form for editing when Edit is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      data: expect.objectContaining(buckets[0]),
    });
  });

  it('deletes a bucket after confirmation when Delete is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.delete', [1]);
  });
});
