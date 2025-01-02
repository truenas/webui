import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { LayoutService } from 'app/modules/layout/layout.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ReportsGlobalControlsComponent } from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';

const fakeTabs: ReportTab[] = [
  { label: 'CPU', value: ReportType.Cpu },
  { label: 'Memory', value: ReportType.Memory },
  { label: 'Disk', value: ReportType.Disk },
];

describe('ReportsDashboardComponent', () => {
  let spectator: Spectator<ReportsDashboardComponent>;

  const createComponent = createComponentFactory({
    component: ReportsDashboardComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      MockComponent(ReportsGlobalControlsComponent),
    ],
    providers: [
      mockProvider(LayoutService, {
        getContentContainer: jest.fn(() => document.createElement('div')),
      }),

      mockProvider(ReportsService, {
        getReportGraphs: jest.fn(() => of([
          { name: ReportingGraphName.Cpu, title: 'CPU', identifiers: [] },
          { name: ReportingGraphName.Memory, title: 'Memory', identifiers: [] },
          {
            name: ReportingGraphName.Disk,
            title: 'Disks',
            identifiers: ['HDD | Model | test-sda-uuid', 'HDD | Model | test-sdb-uuid'],
          },
        ] as ReportingGraph[])),
        getReportTabs: jest.fn(() => fakeTabs),
      }),
      mockApi([]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('separates disk and other reports', () => {
    const fakeReports = [
      {
        identifiers: [],
        name: ReportingGraphName.Cpu,
        title: 'CPU',
        isRendered: [true],
      },
      {
        identifiers: [],
        name: ReportingGraphName.Memory,
        title: 'Memory',
        isRendered: [true],
      },
      {
        identifiers: ['HDD | Model | test-sda-uuid', 'HDD | Model | test-sdb-uuid'],
        name: ReportingGraphName.Disk,
        title: 'Disks',
        isRendered: [true, true],
      },
    ] as Report[];

    expect(spectator.component.allReports).toEqual(fakeReports);
    expect(spectator.component.diskReports).toEqual([fakeReports[2]]);
    expect(spectator.component.otherReports).toEqual([fakeReports[0], fakeReports[1]]);
  });

  describe('buildDiskReport', () => {
    it('rebuilds disk reports', () => {
      spectator.component.updateActiveTab(fakeTabs[2]);
      expect(spectator.component.activeReports).toHaveLength(2);

      spectator.component.buildDiskReport({
        devices: ['test-sdb-uuid'],
        metrics: [ReportingGraphName.Disk],
      });
      expect(spectator.component.visibleReports).toEqual([1]);

      spectator.component.buildDiskReport({
        devices: ['test-sda-uuid'],
        metrics: [ReportingGraphName.Disk],
      });
      expect(spectator.component.visibleReports).toEqual([0]);
    });
  });
});
