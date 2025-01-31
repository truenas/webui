import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Codename } from 'app/enums/codename.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemLicense, SystemInfo, ContractType } from 'app/interfaces/system-info.interface';
import { selectUpdateJobForActiveNode } from 'app/modules/jobs/store/job.selectors';
import { LocaleService } from 'app/modules/language/locale.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoActiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.component';
import { selectIsHaLicensed, selectIsHaEnabled } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware, selectProductType,
  selectHasEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

describe('WidgetSysInfoActiveComponent', () => {
  let spectator: Spectator<WidgetSysInfoActiveComponent>;
  let loader: HarnessLoader;
  const refreshInterval$ = new BehaviorSubject<number>(0);

  const systemInfo = {
    platform: 'TRUENAS-M40-HA',
    version: 'TrueNAS-COMMUNITY_EDITION-25.10.0-MASTER-20250126-184805',
    codename: Codename.Goldeye,
    license: {
      contract_type: ContractType.Gold,
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
  } as SystemInfo;

  const systemInfo$ = new BehaviorSubject({
    isLoading: false,
    error: null,
    value: systemInfo,
  } as LoadingState<SystemInfo>);

  const updateAvailable$ = new BehaviorSubject(true);

  const createComponent = createComponentFactory({
    component: WidgetSysInfoActiveComponent,
    providers: [
      mockAuth(),
      mockProvider(WidgetResourcesService, {
        systemInfo$,
        updateAvailable$,
        refreshInterval$,
      }),
      mockProvider(LocaleService, {
        getDateAndTime: () => ['2024-03-15', '10:34:11'],
        getDateFromString: (date: string) => new Date(date),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectProductType,
            value: ProductType.Enterprise,
          },
          {
            selector: selectHasEnclosureSupport,
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
            selector: selectUpdateJobForActiveNode,
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
  });

  it('checks title', () => {
    expect(spectator.query('.header h3')).toHaveText('System Information');
  });

  it('checks system info rows', async () => {
    const matListItems = await loader.getAllHarnesses(MatListItemHarness);
    const items = await parallel(() => matListItems.map((item) => item.getFullText()));
    expect(items).toEqual([
      'Platform: TRUENAS-M40-HA',
      'Edition: Enterprise',
      'Version: Goldeye-25.10.0-MASTER-20250126-184805',
      'Support License: Gold Contract,  Expires on 2025-01-01',
      'System Serial: AA-00001',
      'Hostname: test-hostname-a',
      'Uptime: 23 hours 12 minutes as of 10:34',
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
    expect(updatedDatetime).toBe(initialDatetime);

    jest.useRealTimers();
  });

  it('checks update button text', async () => {
    updateAvailable$.next(false);
    const checkUpdateButton = await loader.getHarness(MatButtonHarness.with({ text: /Check for Updates/ }));
    expect(await checkUpdateButton.host()).toExist();

    updateAvailable$.next(true);
    const updateButton = await loader.getHarness(MatButtonHarness.with({ text: /Updates Available/ }));
    expect(await updateButton.host()).toExist();
  });
});
