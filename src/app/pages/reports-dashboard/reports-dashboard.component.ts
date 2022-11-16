import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, Inject,
} from '@angular/core';
import {
  Router, ActivatedRoute,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { filter } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { AppLoaderService, DialogService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { ServerTimeService } from 'app/services/server-time.service';
import { ReportsService } from './reports.service';

@UntilDestroy()
@Component({
  selector: 'ix-reports-dashboard',
  styleUrls: ['./reports-dashboard.scss'],
  templateUrl: './reports-dashboard.component.html',
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  @ViewChild('container', { static: true }) container: ElementRef;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  scrollContainer: HTMLElement;

  allReports: Report[] = [];
  diskReports: Report[] = [];
  otherReports: Report[] = [];
  activeReports: Report[] = [];
  visibleReports: number[] = [];
  allTabs: ReportTab[] = this.reportsService.getReportTabs();
  hasUps = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private layoutService: LayoutService,
    private reportsService: ReportsService,
    private serverTimeService: ServerTimeService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  get timeDiffWarning(): string {
    if (!this.reportsService.showTimeDiffWarning) {
      return '';
    }
    const datetime = format(this.reportsService.serverTime, 'MMM dd, HH:mm:ss, OOOO');
    return this.translate.instant('Your NAS time {datetime} does not match your computer time.', { datetime });
  }

  ngOnInit(): void {
    this.scrollContainer = document.querySelector('.rightside-content-hold');
    this.scrollContainer.style.overflow = 'hidden';

    this.reportsService.getReportGraphs().pipe(untilDestroyed(this)).subscribe((reports) => {
      this.allReports = reports.map((report) => {
        const list = [];
        if (report.identifiers) {
          report.identifiers.forEach(() => list.push(true));
        } else {
          list.push(true);
        }
        return {
          ...report,
          isRendered: list,
        };
      });

      this.hasUps = this.allReports.some((report) => report.title.startsWith('UPS'));
      this.diskReports = this.allReports.filter((report) => report.name.startsWith('disk'));
      this.otherReports = this.allReports.filter((report) => !report.name.startsWith('disk'));

      this.activateTabFromUrl();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.scrollContainer.style.overflow = 'auto';
  }

  activateTabFromUrl(): void {
    const subpath = this.route.snapshot.url[0] && this.route.snapshot.url[0].path;
    const tabFound = this.allTabs.find((tab) => tab.value === subpath);
    this.updateActiveTab(tabFound || this.allTabs[0]);
  }

  updateActiveTab(tab: ReportTab): void {
    // Change the URL without reloading page/component
    // the old fashioned way
    this.window.history.replaceState({}, '', `/reportsdashboard/${tab.value}`);

    this.activateTab(tab);

    if (tab.value === ReportType.Disk) {
      this.buildDiskMetrics();
    }
  }

  navigateToTab(tab: ReportTab): void {
    this.router.navigate(['/reportsdashboard', tab.value]);
  }

  activateTab(activeTab: ReportTab): void {
    const reportCategories = activeTab.value === ReportType.Disk ? this.diskReports : this.otherReports.filter(
      (report) => {
        let condition;
        switch (activeTab.value) {
          case ReportType.Cpu:
            condition = (report.name === 'cpu' || report.name === 'load' || report.name === 'cputemp');
            break;
          case ReportType.Memory:
            condition = (report.name === 'memory' || report.name === 'swap');
            break;
          case ReportType.Network:
            condition = (report.name === 'interface');
            break;
          case ReportType.Nfs:
            condition = (report.name === 'nfsstat' || report.name === 'nfsstatbytes');
            break;
          case ReportType.Partition:
            condition = (report.name === 'df');
            break;
          case ReportType.System:
            condition = (report.name === 'processes' || report.name === 'uptime');
            break;
          case ReportType.Target:
            condition = (report.name === 'ctl');
            break;
          case ReportType.Ups:
            condition = report.name.startsWith('ups');
            break;
          case ReportType.Zfs:
            condition = report.name.startsWith('arc');
            break;
          default:
            condition = true;
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
      if (report.identifiers) {
        report.identifiers.forEach((identifier, index) => {
          const flattenedReport = { ...report };
          flattenedReport.title = flattenedReport.title.replace(/{identifier}/, identifier);

          flattenedReport.identifiers = [identifier];
          if (report.isRendered[index]) {
            flattenedReport.isRendered = [true];
            result.push(flattenedReport);
          }
        });
      } else if (!report.identifiers && report.isRendered[0]) {
        // Without identifiers
        const flattenedReport = { ...report };
        flattenedReport.identifiers = [];
        result.push(flattenedReport);
      }
    });

    return result;
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
      const condition = (deviceMatch && metricMatch);
      if (condition) {
        visible.push(index);
      }
    });

    this.visibleReports = visible;
  }

  isReportReversed(report: Report): boolean {
    return report.name === 'cpu';
  }

  onSynchronizeTime(): void {
    this.serverTimeService.confirmSetSystemTime().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.loader.open();
      const currentTime = Date.now();
      this.serverTimeService.setSystemTime(currentTime).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.loader.close();
          this.window.location.reload();
        },
        error: (err) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      });
    });
  }
}
