import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { BootPoolState } from 'app/interfaces/boot-pool-state.interface';
import { AppLoaderModule } from 'app/modules/app-loader/app-loader.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService, WebSocketService } from 'app/services';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { BootenvStatsDialogComponent } from './bootenv-stats-dialog.component';

describe('BootenvStatsDialogComponent', () => {
  let spectator: Spectator<BootenvStatsDialogComponent>;
  let loader: HarnessLoader;
  let websocket: WebSocketService;
  const createComponent = createComponentFactory({
    component: BootenvStatsDialogComponent,
    imports: [
      AppLoaderModule,
      IxFormsModule,
      ReactiveFormsModule,
      CoreComponents,
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      mockWebsocket([
        mockCall('boot.get_state', {
          properties: {
            health: {
              value: PoolStatus.Online,
            },
            size: {
              parsed: 20401094656,
            },
            allocated: {
              parsed: 16723320832,
            },
          },
          scan: {
            end_time: {
              $date: 1643309114000,
            },
          },
        } as BootPoolState),
        mockCall('boot.set_scrub_interval'),
      ]),
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
      MockPipe(FormatDateTimePipe, jest.fn(() => '2022-01-27 20:45:14')),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    websocket = spectator.inject(WebSocketService);
  });

  function getStatusItems(): { [name: string]: string } {
    return spectator.queryAll('.status-item').reduce((allItems, element) => {
      const label = element.querySelector('.status-name').textContent.trim();
      const value = element.querySelector('.status-value').textContent.trim();
      allItems[label] = value;
      return allItems;
    }, {} as { [name: string]: string });
  }

  it('loads boot pool state and shows it', () => {
    expect(websocket.call).toHaveBeenCalledWith('boot.get_state');

    expect(getStatusItems()).toEqual({
      'Boot Pool Condition:': 'Online',
      'Last Scrub Run:': '2022-01-27 20:45:14',
      'Size:': '19 GiB',
      'Used:': '15.57 GiB',
    });
  });

  it('shows current scrub interval from system settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Scrub interval (in days)': '2',
    });
  });

  it('saves new scrub interval and closes modal when form is submitted', async () => {
    const dialogService = spectator.inject(DialogService);
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Scrub interval (in days)': 3,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update Interval' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('boot.set_scrub_interval', [3]);
    expect(dialogService.info.mock.calls[0][0]).toEqual('Scrub Interval Set');
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('tells user to look at alerts if boot pool status is degraded', () => {
    const mockWebsocket = spectator.inject(MockWebsocketService);
    mockWebsocket.mockCall('boot.get_state', {
      properties: {
        health: {
          value: PoolStatus.Degraded,
        },
      },
    } as BootPoolState);

    spectator.component.ngOnInit();
    spectator.detectChanges();

    const conditionMessage = getStatusItems()['Boot Pool Condition:'];
    expect(conditionMessage).toContain('Degraded');
    expect(conditionMessage).toContain('Check Alerts for more details.');
  });
});
