import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActivatedRoute, Router } from '@angular/router';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnSelectHarness, TnSlideToggleHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import {
  ReportsGlobalControlsComponent,
} from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { autoRefreshReportsToggled } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

/**
 * helper type for `getSelectHarnesses`
 */
type SelectHarnesses = Partial<{
  devicesSelect: TnSelectHarness;
  metricsSelect: TnSelectHarness;
  categorySelect: TnSelectHarness;
}>

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
      mockProvider(Router),
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

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function getSelectHarnesses(): Promise<SelectHarnesses> {
    const [devicesSelect, metricsSelect, categorySelect] = await loader.getAllHarnesses(TnSelectHarness);
    return { devicesSelect, metricsSelect, categorySelect };
  }

  describe('report selector', () => {
    it('shows a list of available reports', async () => {
      const { categorySelect } = await getSelectHarnesses();
      const options = await categorySelect.getOptions();

      expect(options).toEqual(['Disk', 'CPU', 'UPS']);
    });

    it('marks currently selected tab based on current route', async () => {
      const { categorySelect } = await getSelectHarnesses();

      expect(await categorySelect.getDisplayText()).toBe('Disk');
    });

    it('navigates to the selected report category when the category changes', async () => {
      const router = spectator.inject(Router);

      const { categorySelect } = await getSelectHarnesses();
      await categorySelect.selectOption('CPU');

      expect(router.navigate).toHaveBeenCalledWith(['/reportsdashboard', ReportType.Cpu]);
    });
  });

  describe('disk reports', () => {
    it('shows disks multiselect when disk report is selected', async () => {
      const { devicesSelect } = await getSelectHarnesses();
      const options = await devicesSelect.getOptions();

      expect(options).toEqual(['sda', 'sdb']);
    });

    it('shows disk metrics when disk report is selected', async () => {
      const { metricsSelect } = await getSelectHarnesses();
      const options = await metricsSelect.getOptions();

      expect(options).toEqual(['Disk I/O', 'Disk Temperature']);
    });

    it('pre-selects disks based on route params', async () => {
      const { devicesSelect } = await getSelectHarnesses();

      expect(await devicesSelect.getDisplayText()).toBe('sda');
    });

    it('emits (diskOptionsChanged) when user changes disk or disk metric selection', async () => {
      jest.spyOn(spectator.component.diskOptionsChanged, 'emit');

      const { devicesSelect } = await getSelectHarnesses();
      await devicesSelect.selectOption('sdb');

      // Wait for debounce
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1100);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.diskOptionsChanged.emit).toHaveBeenCalledWith({
        devices: ['sda', 'sdb'],
        metrics: ['disk', 'disktemp'],
      });
    });
  });

  describe('Auto Refresh toggle', () => {
    it('shows Auto Refresh toggle with current value based on user preferences', async () => {
      const autoRefreshToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Auto Refresh' }));

      expect(await autoRefreshToggle.isChecked()).toBe(true);
    });

    it('dispatches autoRefreshReportsToggled() action when Auto Refresh is toggled', async () => {
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');

      const autoRefreshToggle = await loader.getHarness(TnSlideToggleHarness.with({ label: 'Auto Refresh' }));
      await autoRefreshToggle.toggle();

      expect(store$.dispatch).toHaveBeenCalledWith(autoRefreshReportsToggled());
    });
  });

  it('shows Exporters button that navigates to the exporters page', async () => {
    const router = spectator.inject(Router);

    const exportersButton = await loader.getHarness(TnButtonHarness.with({ label: 'Exporters' }));
    expect(exportersButton).toBeTruthy();

    await exportersButton.click();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/reportsdashboard', 'exporters'], expect.anything());
    expect(router.navigateByUrl).toHaveBeenCalled();
  });
});
