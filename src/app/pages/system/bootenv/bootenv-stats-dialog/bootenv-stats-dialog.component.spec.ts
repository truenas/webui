import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { BootenvStatsDialog } from './bootenv-stats-dialog.component';

const poolInstance = {
  status: PoolStatus.Online,
  size: 20401094656,
  allocated: 16723320832,
  scan: {
    end_time: {
      $date: 1643309114000,
    },
  },
} as PoolInstance;

describe('BootenvStatsDialogComponent', () => {
  let spectator: Spectator<BootenvStatsDialog>;
  let loader: HarnessLoader;
  let api: ApiService;
  const createComponent = createComponentFactory({
    component: BootenvStatsDialog,
    imports: [
      ReactiveFormsModule,
      MapValuePipe,
      FileSizePipe,
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(DialogRef),
      mockApi([
        mockCall('boot.get_state', poolInstance),
        mockCall('boot.set_scrub_interval'),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { boot_scrub: 2 } as AdvancedConfig,
          },
        ],
      }),
    ],
    declarations: [
      FakeFormatDateTimePipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  function getStatusItems(): Record<string, string> {
    return spectator.queryAll('.status-item').reduce((allItems, element) => {
      const label = element.querySelector('.status-name')!.textContent!.trim();
      const value = element.querySelector('.status-value')!.textContent!.trim();
      return {
        ...allItems,
        [label]: value,
      };
    }, {} as Record<string, string>);
  }

  it('loads boot pool state and shows it', () => {
    expect(api.call).toHaveBeenCalledWith('boot.get_state');

    expect(getStatusItems()).toEqual({
      'Boot Pool Condition:': 'Online',
      'Last Scrub Run:': '2022-01-27 20:45:14',
      'Size:': '19 GiB',
      'Used:': '15.57 GiB',
    });
  });

  it('shows current scrub interval from system settings', async () => {
    const input = await loader.getHarness(TnInputHarness);

    expect(await input.getValue()).toBe('2');
  });

  it('saves new scrub interval and closes modal when form is submitted', async () => {
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue('3');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Update Interval' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('boot.set_scrub_interval', [3]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Scrub interval set to 3 days');
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });

  it('tells user to look at alerts if boot pool status is degraded', () => {
    const websocketMock = spectator.inject(MockApiService);
    websocketMock.mockCall('boot.get_state', {
      ...poolInstance,
      status: PoolStatus.Degraded,
    } as PoolInstance);

    spectator.component.ngOnInit();
    spectator.detectChanges();

    const conditionMessage = getStatusItems()['Boot Pool Condition:'];
    expect(conditionMessage).toContain('Degraded');
    expect(conditionMessage).toContain('Check Alerts for more details.');
  });
});
