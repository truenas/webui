import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatListModule } from '@angular/material/list';
import { MatListItemHarness } from '@angular/material/list/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { BehaviorSubject, of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Codename } from 'app/enums/codename.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemLicense, SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectUpdateJobForPassiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { WidgetSysInfoPassiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.component';
import { selectCanFailover, selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware,
  selectProductType,
  selectIsEnterprise,
  selectEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

describe('WidgetSysInfoPassiveComponent', () => {
  let spectator: Spectator<WidgetSysInfoPassiveComponent>;
  let loader: HarnessLoader;
  let store$: MockStore;
  const refreshInterval$ = new BehaviorSubject<number>(0);

  const systemInfo = {
    remote_info: {
      platform: 'TRUENAS-M40-HA',
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
    component: WidgetSysInfoPassiveComponent,
    imports: [
      MatListModule,
      UptimePipe,
    ],
    declarations: [
      MockComponent(ProductImageComponent),
      MockComponent(NgxSkeletonLoaderComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(WidgetResourcesService, {
        systemInfo$: of({
          isLoading: false,
          error: null,
          value: systemInfo,
        } as LoadingState<SystemInfo>),
        updateAvailable$: of(true),
        refreshInterval$,
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectProductType,
            value: ProductType.ScaleEnterprise,
          },
          {
            selector: selectIsEnterprise,
            value: true,
          },
          {
            selector: selectEnclosureSupport,
            value: true,
          },
          {
            selector: selectIsIxHardware,
            value: true,
          },
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectIsHaEnabled,
            value: true,
          },
          {
            selector: selectCanFailover,
            value: true,
          },
          {
            selector: selectUpdateJobForPassiveNode,
            value: null,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('checks title', () => {
    expect(spectator.query('.header h3')).toHaveText('System Information standby');
  });

  it('checks system info rows', async () => {
    const matListItems = await loader.getAllHarnesses(MatListItemHarness);
    const items = await parallel(() => matListItems.map((item) => item.getFullText()));
    expect(items).toEqual([
      'Platform: TRUENAS-M40-HA',
      'Version: ElectricEel-24.10.0-MASTER-20240301-233006',
      'License: Best contract, expires 2025-01-01',
      'System Serial: AA-00002',
      'Hostname: test-hostname-b',
      'Uptime: 1 minute 17 seconds as of 2024-03-15 10:34:11',
    ]);
  });

  it('checks Uptime changed over time', () => {
    jest.useFakeTimers();

    const initialUptime = spectator.component.uptime();
    const initialDatetime = spectator.component.datetime();

    jest.advanceTimersByTime(5000);
    refreshInterval$.next(1);

    spectator.detectChanges();

    const updatedUptime = spectator.component.uptime();
    const updatedDatetime = spectator.component.datetime();

    expect(updatedUptime).toBeGreaterThan(initialUptime);
    expect(updatedDatetime).toBeGreaterThan(initialDatetime);

    jest.useRealTimers();
  });

  it('checks unlicensed HA system', () => {
    store$.overrideSelector(selectIsHaLicensed, false);
    store$.refreshState();
    spectator.detectChanges();

    expect(spectator.query('.container.empty div')).toHaveText('The system is not licensed for HA.');
    expect(spectator.query('.container.empty small')).toHaveText('Configure dashboard to edit the widget.');
  });
});
