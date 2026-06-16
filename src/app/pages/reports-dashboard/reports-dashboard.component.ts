import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, signal, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TnCardComponent } from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Option } from 'app/interfaces/option.interface';
import { LayoutService } from 'app/modules/layout/layout.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { reportingElements } from 'app/pages/reports-dashboard/reports-dashboard.elements';
import { ReportComponent } from './components/report/report.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';
import { ReportsService } from './reports.service';

@Component({
  selector: 'ix-reports-dashboard',
  styleUrls: ['./reports-dashboard.component.scss'],
  templateUrl: './reports-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ReportsGlobalControlsComponent,
    UiSearchDirective,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    ReportComponent,
    TnCardComponent,
  ],
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private layoutService = inject(LayoutService);
  private reportsService = inject(ReportsService);

  readonly searchableElements = reportingElements;

  scrollContainer: HTMLElement | null;

  private readonly reports = toSignal(this.reportsService.getReportGraphs(), { initialValue: [] as Report[] });

  protected readonly allTabs = computed<ReportTab[]>(() => {
    if (!this.reports().length) {
      return [];
    }
    return this.reportsService.getReportTabs();
  });

  readonly allReports = computed<Report[]>(() => {
    return this.reports().map((report) => {
      const list: boolean[] = [];
      if (report.identifiers?.length) {
        report.identifiers.forEach(() => list.push(true));
      } else {
        list.push(true);
      }
      return {
        ...report,
        isRendered: list,
      };
    });
  });

  readonly diskReports = computed<Report[]>(() => {
    return this.allReports().filter((report) => {
      return [ReportingGraphName.Disk, ReportingGraphName.DiskTemp].includes(report.name);
    });
  });

  readonly otherReports = computed<Report[]>(() => {
    return this.allReports().filter((report) => {
      return ![ReportingGraphName.Disk, ReportingGraphName.DiskTemp].includes(report.name);
    });
  });

  private readonly userSelectedTab = signal<ReportTab | undefined>(undefined);
  private readonly diskOptions = signal<{ devices: string[]; metrics: string[] } | null>(null);

  private readonly defaultTab = computed<ReportTab | undefined>(() => {
    const tabs = this.allTabs();
    if (!tabs.length) {
      return undefined;
    }
    const subpath = this.route.snapshot?.url[0]?.path;
    return tabs.find((tab) => (tab.value as string) === subpath) || tabs[0];
  });

  protected readonly activeTab = computed<ReportTab | undefined>(() => {
    return this.userSelectedTab() ?? this.defaultTab();
  });

  readonly activeReports = computed<Report[]>(() => {
    const tab = this.activeTab();
    if (!tab) {
      return [];
    }
    return this.flattenReports(this.getReportsForTab(tab));
  });

  readonly visibleReports = computed<number[]>(() => {
    const tab = this.activeTab();
    const reports = this.activeReports();
    if (tab?.value !== ReportType.Disk) {
      return Object.keys(reports).map((reportIndex) => parseInt(reportIndex));
    }

    const options = this.diskOptions();
    if (!options) {
      return [];
    }

    const visible: number[] = [];
    reports.forEach((item, index) => {
      if (item.identifiers[0]) {
        const [diskName] = item.identifiers[0].split(' | ');
        const deviceMatch = options.devices.includes(diskName);
        const metricMatch = options.metrics.includes(item.name);
        if (deviceMatch && metricMatch) {
          visible.push(index);
        }
      }
    });
    return visible;
  });

  constructor() {
    // Rebuild disk metrics whenever the disk report tab becomes active.
    effect(() => {
      if (this.activeTab()?.value === ReportType.Disk) {
        this.buildDiskMetrics();
      }
    });
  }

  ngOnInit(): void {
    this.scrollContainer = this.layoutService.getContentContainer();
    if (this.scrollContainer) {
      this.scrollContainer.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    if (this.scrollContainer) {
      this.scrollContainer.style.overflow = 'auto';
    }
  }

  updateActiveTab(tab: ReportTab): void {
    this.userSelectedTab.set(tab);
  }

  private getReportsForTab(activeTab: ReportTab): Report[] {
    if (activeTab.value === ReportType.Disk) {
      return this.diskReports();
    }

    return this.otherReports().filter((report) => {
      const graphName = report.name;
      let condition;
      switch (activeTab.value) {
        case ReportType.Cpu:
          condition = [
            ReportingGraphName.Cpu,
            ReportingGraphName.CpuTemp,
            ReportingGraphName.SystemLoad,
            ReportingGraphName.Processes,
          ].includes(graphName);
          break;
        case ReportType.Memory:
          condition = [ReportingGraphName.Memory].includes(graphName);
          break;
        case ReportType.Network:
          condition = ReportingGraphName.NetworkInterface === graphName;
          break;
        case ReportType.Nfs:
          condition = [
            ReportingGraphName.NfsStat,
            ReportingGraphName.NfsStatBytes,
          ].includes(graphName);
          break;
        case ReportType.Partition:
          condition = ReportingGraphName.Partition === graphName;
          break;
        case ReportType.System:
          condition = [
            ReportingGraphName.Processes,
            ReportingGraphName.Uptime,
          ].includes(graphName);
          break;
        case ReportType.Target:
          condition = ReportingGraphName.Target === graphName;
          break;
        case ReportType.Ups:
          condition = [
            ReportingGraphName.UpsCharge,
            ReportingGraphName.UpsCurrent,
            ReportingGraphName.UpsFrequency,
            ReportingGraphName.UpsLoad,
            ReportingGraphName.UpsRuntime,
            ReportingGraphName.UpsTemp,
            ReportingGraphName.UpsVoltage,
          ].includes(graphName);
          break;
        case ReportType.Zfs:
          condition = [
            ReportingGraphName.ZfsArcSize,
            ReportingGraphName.ZfsArcRatio,
            ReportingGraphName.ZfsArcResult,
            ReportingGraphName.ZfsArcActualRate,
            ReportingGraphName.ZfsArcRate,
          ].includes(graphName);
          break;
        default:
          condition = true;
          break;
      }

      return condition;
    });
  }

  /**
   * Based on identifiers, create a single dimensional array of reports to render
   * @param list Report[]
   * @returns Report[]
   */
  private flattenReports(list: Report[]): Report[] {
    const result: Report[] = [];
    list.forEach((report) => {
      // With identifiers
      if (report.identifiers?.length) {
        report.identifiers.forEach((identifier, index) => {
          const flattenedReport = { ...report };

          if (flattenedReport.title.includes('{identifier}')) {
            flattenedReport.title = flattenedReport.title.replace(/{identifier}/, identifier);
          } else {
            flattenedReport.title = `${flattenedReport.title} - ${stringToTitleCase(identifier)}`;
          }

          flattenedReport.identifiers = [identifier];
          if (report.isRendered?.[index]) {
            flattenedReport.isRendered = [true];
            result.push(flattenedReport);
          }
        });
      } else if (!report.identifiers?.length && report.isRendered?.[0]) {
        // Without identifiers
        const flattenedReport = { ...report };
        flattenedReport.identifiers = [];
        result.push(flattenedReport);
      }
    });

    return result.sort((a, b) => a.identifiers?.[0]?.localeCompare(b.identifiers?.[0]));
  }

  private buildDiskMetrics(): void {
    const metrics: Option[] = [];

    this.diskReports().forEach((item) => {
      let formatted = item.title.replace(/ \(.*\)/, '');// remove placeholders for identifiers eg. '({identifier})'
      formatted = formatted.replace(/identifier/, '');
      formatted = formatted.replace(/[{][}]/, '');
      formatted = formatted.replace(/requests on/, '');
      metrics.push({ label: formatted, value: item.name });
    });
    this.reportsService.setDiskMetrics(metrics);
  }

  buildDiskReport(event: { devices: string[]; metrics: string[] }): void {
    this.diskOptions.set(event);
  }
}
