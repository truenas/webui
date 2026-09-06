import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TablePagerShowMoreComponent,
} from 'app/modules/tn-table/components/table-pager-show-more/table-pager-show-more.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3CardComponent } from 'app/pages/sharing/components/shares-dashboard/s3-card/s3-card.component';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('S3CardComponent', () => {
  let spectator: Spectator<S3CardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const buckets = [
    {
      id: 10,
      name: 'photos',
      dataset: 'tank/buckets/photos',
      owner: 'alice',
      enabled: true,
      locked: false,
    },
  ] as S3Bucket[];

  const createComponent = createComponentFactory({
    component: S3CardComponent,
    imports: [TablePagerShowMoreComponent],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.s3.query', buckets),
        mockCall('sharing.s3.delete'),
        mockCall('sharing.s3.update', { id: 10 } as S3Bucket),
        mockCall('pool.query', [{ path: '/mnt/tank' }] as Pool[]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn(() => of(undefined)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SnackbarService),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.S3,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical', ancestor: 'tn-table' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Dataset', 'Owner', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['photos', 'tank/buckets/photos', 'alice', '', ''],
    ]);
  });

  it('opens the bucket form in a side panel when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(S3BucketFormComponent, {
      title: 'Add S3 Bucket',
      inputs: { bucket: undefined },
    });
  });

  it('opens the bucket form with the row when Edit is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /^Edit$/ });

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

  it('updates enabled state when the row toggle is changed', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.s3.update', [10, { enabled: false }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('S3 bucket «photos» disabled');
  });
});
