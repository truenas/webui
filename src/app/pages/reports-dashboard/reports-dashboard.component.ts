import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatCard } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Option } from 'app/interfaces/option.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { reportingElements } from 'app/pages/reports-dashboard/reports-dashboard.elements';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';
import { SmoothPlotterService } from 'app/pages/reports-dashboard/services/smooth-plotter.service';
import { LayoutService } from 'app/services/layout.service';
import { ReportComponent } from './components/report/report.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';
import { ReportsService } from './reports.service';

@UntilDestroy()
@Component({
  selector: 'ix-reports-dashboard',
  styleUrls: ['./reports-dashboard.component.scss'],
  templateUrl: './reports-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    ReportsGlobalControlsComponent,
    UiSearchDirective,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    ReportComponent,
    MatCard,
  ],
  providers: [
    {
      provide: PlotterService,
      useClass: SmoothPlotterService,
    },
  ],
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {
  readonly searchableElements = reportingElements;

  scrollContainer: HTMLElement;

  allReports: Report[] = [];
  diskReports: Report[] = [];
  otherReports: Report[] = [];
  activeReports: Report[] = [];
  visibleReports: number[] = [];
  allTabs: ReportTab[];

  constructor(
    private route: ActivatedRoute,
    private layoutService: LayoutService,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.scrollContainer = this.layoutService.getContentContainer();
    this.scrollContainer.style.overflow = 'hidden';

    this.reportsService.getReportGraphs()
      .pipe(untilDestroyed(this))
      .subscribe((reports) => {
        this.allTabs = this.reportsService.getReportTabs();
        this.allReports = reports.map((report) => {
          const list = [];
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

        this.diskReports = this.allReports.filter((report) => report.name.startsWith('disk'));
        this.otherReports = this.allReports.filter((report) => !report.name.startsWith('disk'));

        this.activateTabFromUrl();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.scrollContainer.style.overflow = 'auto';
  }

  activateTabFromUrl(): void {
    const subpath = this.route.snapshot?.url[0]?.path;
    const tabFound = this.allTabs.find((tab) => (tab.value as string) === subpath);
    this.updateActiveTab(tabFound || this.allTabs[0]);
  }

  updateActiveTab(tab: ReportTab): void {
    this.activateTab(tab);

    if (tab.value === ReportType.Disk) {
      this.buildDiskMetrics();
    }
  }

  activateTab(activeTab: ReportTab): void {
    const reportCategories = activeTab.value === ReportType.Disk
      ? this.diskReports
      : this.otherReports.filter(
        (report) => {
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
              condition = graphName.startsWith(ReportingGraphName.Ups);
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
        },
      );

    this.activeReports = this.flattenReports(reportCategories);

    if (activeTab.value !== ReportType.Disk) {
      this.visibleReports = Object.keys(this.activeReports).map((reportIndex) => parseInt(reportIndex));
    }
  }

  /**
   * Based on identifiers, create a single dimensional array of reports to render
   * @param list Report[]
   * @returns Report[]
   */
  flattenReports(list: Report[]): Report[] {
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
          if (report.isRendered[index]) {
            flattenedReport.isRendered = [true];
            result.push(flattenedReport);
          }
        });
      } else if (!report.identifiers?.length && report.isRendered[0]) {
        // Without identifiers
        const flattenedReport = { ...report };
        flattenedReport.identifiers = [];
        result.push(flattenedReport);
      }
    });

    return result.sort((a, b) => a.identifiers?.[0]?.localeCompare(b.identifiers?.[0]));
  }

  buildDiskMetrics(): void {
    const metrics: Option[] = [];

    this.diskReports.forEach((item) => {
      let formatted = item.title.replace(/ \(.*\)/, '');// remove placeholders for identifiers eg. '({identifier})'
      formatted = formatted.replace(/identifier/, '');
      formatted = formatted.replace(/[{][}]/, '');
      formatted = formatted.replace(/requests on/, '');
      metrics.push({ label: formatted, value: item.name });
    });
    this.reportsService.setDiskMetrics(metrics);
  }

  buildDiskReport(event: { devices: string[]; metrics: string[] }): void {
    const { devices, metrics } = event;

    const visible: number[] = [];
    this.activeReports.forEach((item, index) => {
      const deviceMatch = devices.includes(item.identifiers[0]);
      const metricMatch = metrics.includes(item.name);
      const condition = deviceMatch && metricMatch;
      if (condition) {
        visible.push(index);
      }
    });

    this.visibleReports = visible;
  }
}
