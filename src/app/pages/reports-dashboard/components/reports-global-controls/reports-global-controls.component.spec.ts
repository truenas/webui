import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  fakeAsync, flush, flushMicrotasks, tick,
} from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { ActivatedRoute } from '@angular/router';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import {
  ReportsGlobalControlsComponent,
} from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { autoRefreshReportsToggled } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('ReportsGlobalControlsComponent', () => {
  let spectator: Spectator<ReportsGlobalControlsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReportsGlobalControlsComponent,
    providers: [
      mockProvider(ReportsService, {
        getReportGraphs: jest.fn(() => of([])),
        getReportTabs: jest.fn(() => [
          { label: 'Disk', value: ReportType.Disk },
          { label: 'CPU', value: ReportType.Cpu },
          { label: 'UPS', value: ReportType.Ups },
        ] as ReportTab[]),
        getDiskDevices: jest.fn(() => of([
          { label: 'sda', value: 'sda' },
          { label: 'sdb', value: 'sdb' },
        ])),
        getDiskMetrics: jest.fn(() => of([
          { label: 'Disk I/O', value: 'disk' },
          { label: 'Disk Temperature', value: 'disktemp' },
        ])),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              autoRefreshReports: true,
            },
          },
        ],
      }),
      mockProvider(ActivatedRoute, {
        routeConfig: {
          path: ReportType.Disk,
        },
        snapshot: {
          queryParams: {
            disks: ['sda'],
          },
        },
      }),
    ],
  });

  beforeEach(fakeAsync(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }));

  describe('report selector', () => {
    it('shows a list of available reports', async () => {
      const reportMenu = await loader.getHarness(MatMenuHarness);

      await reportMenu.open();
      const menuItems = await reportMenu.getItems();

      expect(menuItems).toHaveLength(3);
      expect(await menuItems[0].getText()).toBe('Disk');
      expect(await menuItems[1].getText()).toBe('CPU');
      expect(await menuItems[2].getText()).toBe('UPS');
    });

    it('marks currently selected menu item based on current route', async () => {
      const reportMenu = await loader.getHarness(MatMenuHarness);

      expect(await reportMenu.getTriggerText()).toBe('Disk');
    });
  });

  describe('disk reports', () => {
    it('shows disks multiselect when disk report is selected', async () => {
      const devices = await loader.getHarness(IxSelectHarness.with({ label: 'Devices' }));
      const options = await devices.getOptionLabels();

      expect(options).toEqual(['sda', 'sdb']);
    });

    it('shows disk metrics when disk report is selected', async () => {
      const metrics = await loader.getHarness(IxSelectHarness.with({ label: 'Metrics' }));
      const options = await metrics.getOptionLabels();

      expect(options).toEqual(['Disk I/O', 'Disk Temperature']);
    });

    it('pre-selects disks based on route params', async () => {
      const devices = await loader.getHarness(IxSelectHarness.with({ label: 'Devices' }));

      expect(await devices.getValue()).toEqual(['sda']);
    });

    it('emits (diskOptionsChanged) when user changes disk or disk metric selection', fakeAsync(async () => {
      jest.spyOn(spectator.component.diskOptionsChanged, 'emit');

      const devices = await loader.getHarness(IxSelectHarness.with({ label: 'Devices' }));
      await devices.setValue(['sdb']);

      flush(1);
      flushMicrotasks();

      tick(1000);

      expect(spectator.component.diskOptionsChanged.emit).toHaveBeenCalledWith({
        devices: ['sdb'],
        metrics: ['disk', 'disktemp'],
      });
    }));
  });

  describe('Auto Refresh toggle', () => {
    it('shows Auto Refresh toggle with current value based on user preferences', async () => {
      const autoRefreshToggle = await loader.getHarness(IxSlideToggleHarness.with({ label: 'Auto Refresh' }));

      expect(await autoRefreshToggle.getValue()).toBe(true);
    });

    it('dispatches autoRefreshReportsToggled() action when Auto Refresh is toggled', async () => {
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');

      const autoRefreshToggle = await loader.getHarness(IxSlideToggleHarness.with({ label: 'Auto Refresh' }));
      await autoRefreshToggle.toggle();

      expect(store$.dispatch).toHaveBeenCalledWith(autoRefreshReportsToggled());
    });
  });

  it('shows Exporters button', async () => {
    const exportersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Exporters' }));

    expect(exportersButton).toBeTruthy();
  });
});
