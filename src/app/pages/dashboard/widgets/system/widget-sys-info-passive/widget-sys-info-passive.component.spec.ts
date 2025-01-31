import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatListItemHarness } from '@angular/material/list/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Codename } from 'app/enums/codename.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemLicense, SystemInfo, ContractType } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectUpdateJobForPassiveNode } from 'app/modules/jobs/store/job.selectors';
import { LocaleService } from 'app/modules/language/locale.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetSysInfoPassiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-passive/widget-sys-info-passive.component';
import { selectCanFailover, selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware,
  selectProductType,
  selectHasEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

describe('WidgetSysInfoPassiveComponent', () => {
  let spectator: Spectator<WidgetSysInfoPassiveComponent>;
  let loader: HarnessLoader;
  let store$: MockStore;
  const refreshInterval$ = new BehaviorSubject<number>(0);

  const systemInfo = {
    remote_info: {
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
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockProvider(Router),
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

  describe('system info remote_info is loaded', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            systemInfo$: of({
              isLoading: false,
              error: null,
              value: systemInfo,
            } as LoadingState<SystemInfo>),
            updateAvailable$: of(true),
            refreshInterval$,
          }),
        ],
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
        'Edition: Enterprise',
        'Version: Goldeye-25.10.0-MASTER-20250126-184805',
        'Support License: Gold Contract,  Expires on 2025-01-01',
        'System Serial: AA-00002',
        'Hostname: test-hostname-b',
        'Uptime: 1 minute 17 seconds as of 10:34',
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

    it('checks unlicensed HA system', () => {
      store$.overrideSelector(selectIsHaLicensed, false);
      store$.refreshState();
      spectator.detectChanges();

      expect(spectator.query('.container.empty div')).toHaveText('This system is not licensed for HA.');
      expect(spectator.query('.container.empty small')).toHaveText('Configure dashboard to edit this widget.');
    });
  });

  describe('system info remote_info is not loaded - waiting for standby controller', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            systemInfo$: of({
              isLoading: false,
              error: null,
              value: { ...systemInfo, remote_info: null },
            } as LoadingState<SystemInfo>),
            updateAvailable$: of(true),
            refreshInterval$,
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      store$ = spectator.inject(MockStore);
    });

    it('shows "Waiting for standby controller" content', () => {
      store$.overrideSelector(selectCanFailover, false);
      store$.overrideSelector(selectIsHaEnabled, false);

      store$.refreshState();
      spectator.detectChanges();

      expect(spectator.query('.container.empty h3')).toHaveText('Waiting for standby controller');
    });
  });
});
