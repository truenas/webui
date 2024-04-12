import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListItemHarness } from '@angular/material/list/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { of } from 'rxjs';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Codename } from 'app/enums/codename.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { SystemInfo, SystemLicense } from 'app/interfaces/system-info.interface';
import { SystemUpdate } from 'app/interfaces/system-update.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SimpleFailoverBtnComponent } from 'app/pages/dashboard-old/components/widget-sys-info/simple-failover-btn.component';
import { WidgetSysInfoComponent } from 'app/pages/dashboard-old/components/widget-sys-info/widget-sys-info.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import {
  selectCanFailover, selectHaInfoState,
} from 'app/store/ha-info/ha-info.selectors';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { selectSystemInfo, selectSystemFeatures, selectIsIxHardware } from 'app/store/system-info/system-info.selectors';

describe('WidgetSysInfoComponent', () => {
  let spectator: Spectator<WidgetSysInfoComponent>;
  let loader: HarnessLoader;

  const systemInfo = {
    platform: 'TRUENAS-TEST-HA',
    version: 'TrueNAS-SCALE-24.10.0-MASTER-20240301-233006',
    codename: Codename.ElectricEel,
    license: {
      contract_type: 'BEST',
      contract_end: {
        $type: 'date',
        $value: '2025-01-01',
      },
    } as SystemLicense,
    system_serial: 'AA-00001',
    hostname: 'test-hostname-a',
    uptime_seconds: 83532.938532175,
    datetime: {
      $date: 1710491651000,
    },
    remote_info: {
      platform: 'TRUENAS-TEST-HA',
      version: 'TrueNAS-SCALE-24.10.0-MASTER-20240301-233006',
      codename: Codename.ElectricEel,
      license: {
        contract_type: 'BEST',
        contract_end: {
          $type: 'date',
          $value: '2025-01-01',
        },
      } as SystemLicense,
      system_serial: 'AA-00002',
      hostname: 'test-hostname-b',
      uptime_seconds: 77.915545062,
      datetime: {
        $date: 1710491651000,
      },
    } as SystemInfo,
  } as SystemInfo;

  const createComponent = createComponentFactory({
    component: WidgetSysInfoComponent,
    imports: [
      MatGridListModule,
      ImgFallbackModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(SimpleFailoverBtnComponent),
      MockComponent(IxIconComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('webui.main.dashboard.sys_info', systemInfo),
        mockCall('update.check_available', { status: SystemUpdateStatus.Unavailable } as SystemUpdate),
        mockCall('core.get_jobs', []),
      ]),
      mockProvider(SystemGeneralService, {
        isEnterprise: () => true,
        getProductType: () => ProductType.ScaleEnterprise,
        isEnterprise$: of(true),
        updateRunning: of(false),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              areLoaded: true,
              preferences: {
                timeFormat: 'timeFormat',
              },
              dashboardState: [],
            } as PreferencesState,
          },
          {
            selector: selectSystemInfo,
            value: {
              cores: 6,
            } as SystemInfo,
          },
          {
            selector: selectSystemFeatures,
            value: {
              enclosure: true,
            },
          },
          {
            selector: selectIsIxHardware,
            value: true,
          },
          {
            selector: selectCanFailover,
            value: true,
          },
          {
            selector: selectHaInfoState,
            value: {
              haStatus: { hasHa: true },
              isHaLicensed: false,
              hasOnlyMismatchVersionsReason: false,
              isUpgradePending: false,
            },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('check active mode', () => {
    it('checks title', () => {
      expect(spectator.query('.card-title-text')).toHaveText('System Information');
    });

    it('checks system info rows', fakeAsync(async () => {
      spectator.tick(1000);

      const matListItems = await loader.getAllHarnesses(MatListItemHarness);
      const items = await parallel(() => matListItems.map((item) => item.getFullText()));
      expect(items).toEqual([
        'Platform: TRUENAS-TEST-HA',
        'Version:ElectricEel-24.10.0-MASTER-20240301-233006',
        'License:Best contract, expires 2025-01-01',
        'System Serial:AA-00001',
        'Hostname:test-hostname-a',
        'Uptime:23 hours 12 minutes as of 2024-03-15 10:34:11',
      ]);
    }));

    // TODO: Add more tests for active mode
  });

  describe('check standby mode', () => {
    beforeEach(() => {
      spectator.setInput('isPassive', true);
      spectator.component.ngOnInit();
    });

    it('checks title', () => {
      expect(spectator.query('.card-title-text')).toHaveText('System Information Standby');
    });

    it('checks system info rows', fakeAsync(async () => {
      jest.resetAllMocks();
      spectator.tick(1000);

      const matListItems = await loader.getAllHarnesses(MatListItemHarness);
      const items = await parallel(() => matListItems.map((item) => item.getFullText()));
      expect(items).toEqual([
        'Platform: TRUENAS-TEST-HA',
        'Version:ElectricEel-24.10.0-MASTER-20240301-233006',
        'License:Best contract, expires 2025-01-01',
        'System Serial:AA-00002',
        'Hostname:test-hostname-b',
        'Uptime:1 minute 17 seconds',
      ]);
    }));

    // TODO: Add more tests standby mode
  });
});
