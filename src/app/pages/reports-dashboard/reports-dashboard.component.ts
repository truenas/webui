import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef,
} from '@angular/core';
import {
  Router, ActivatedRoute,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  addSeconds, differenceInDays, differenceInSeconds, format,
} from 'date-fns';
import { forkJoin } from 'rxjs';
import { ReportTab } from 'app/enums/report-tab.enum';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { Timeout } from 'app/interfaces/timeout.interface';
import {
  WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { Report } from './components/report/report.component';
import { ReportsConfigFormComponent } from './components/reports-config-form/reports-config-form.component';

export interface Tab {
  label: string;
  value: ReportTab;
}

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
  scrolledIndex = 0;
  nasDateTime: Date;
  timeDiffInSeconds: number;
  timeDiffInDays: number;
  timeInterval: Timeout;
  showTimeDiffWarning = false;

  diskReports: Report[];
  otherReports: Report[];
  activeReports: Report[] = [];

  activeTab = { label: this.translate.instant('CPU'), value: ReportTab.Cpu } as Tab;
  activeTabVerified = false;
  allTabs: Tab[] = [];

  visibleReports: number[] = [];

  diskDevices: Option[] = [];
  diskMetrics: Option[] = [];
  selectedDisks: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private slideIn: IxSlideInService,
    private layoutService: LayoutService,
  ) {}

  get timeDiffWarning(): string {
    if (!this.nasDateTime) {
      return '';
    }
    const nasTimeFormatted = format(this.nasDateTime, 'MMM dd, HH:mm:ss, OOOO');
    return this.translate.instant('Your NAS time {datetime} does not match your computer time.', { datetime: nasTimeFormatted });
  }

  ngOnInit(): void {
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe(
      (sysInfo) => {
        const now = Date.now();
        const datetime = sysInfo.datetime.$date;
        this.nasDateTime = new Date(datetime);
        this.timeDiffInSeconds = differenceInSeconds(datetime, now);
        this.timeDiffInDays = differenceInDays(datetime, now);
        if (this.timeDiffInSeconds > 300 || this.timeDiffInDays > 0) {
          this.showTimeDiffWarning = true;
        }

        if (this.timeInterval) {
          clearInterval(this.timeInterval);
        }

        this.timeInterval = setInterval(() => {
          this.nasDateTime = addSeconds(this.nasDateTime, 1);
        }, 1000);
      },
    );
    this.scrollContainer = document.querySelector('.rightside-content-hold ');
    this.scrollContainer.style.overflow = 'hidden';

    forkJoin([
      this.ws.call('disk.query'),
      this.ws.call('reporting.graphs'),
    ]).pipe(untilDestroyed(this)).subscribe(([disks, reports]) => {
      this.parseDisks(disks);
      const allReports = reports.map((report) => {
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

      this.diskReports = allReports.filter((report) => report.name.startsWith('disk'));
      this.otherReports = allReports.filter((report) => !report.name.startsWith('disk'));

      this.allTabs = this.getAllTabs();

      this.activateTabFromUrl();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.scrollContainer.style.overflow = 'auto';
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  nextBatch(evt: number): void {
    this.scrolledIndex = evt;
  }

  getAllTabs(): Tab[] {
    const hasUps = this.otherReports.find((report) => report.title.startsWith('UPS'));
    return [
      { label: this.translate.instant('CPU'), value: ReportTab.Cpu },
      { label: this.translate.instant('Disk'), value: ReportTab.Disk },
      { label: this.translate.instant('Memory'), value: ReportTab.Memory },
      { label: this.translate.instant('Network'), value: ReportTab.Network },
      { label: this.translate.instant('NFS'), value: ReportTab.Nfs },
      { label: this.translate.instant('Partition'), value: ReportTab.Partition },
      { label: this.translate.instant('System'), value: ReportTab.System },
      ...(hasUps ? [{ label: this.translate.instant('UPS'), value: ReportTab.Ups }] : []),
      { label: this.translate.instant('Target'), value: ReportTab.Target },
      { label: this.translate.instant('ZFS'), value: ReportTab.Zfs },
    ] as Tab[];
  }

  activateTabFromUrl(): void {
    const subpath = this.route.snapshot.url[0] && this.route.snapshot.url[0].path;
    const tabFound = this.allTabs.find((tab) => tab.value === subpath);
    this.updateActiveTab(tabFound || this.allTabs[0]);
  }

  updateActiveTab(tab: Tab): void {
    // Change the URL without reloading page/component
    // the old fashioned way
    window.history.replaceState({}, '', '/reportsdashboard/' + tab.value);

    this.activateTab(tab);

    if (tab.value === ReportTab.Disk) {
      this.selectedDisks = this.route.snapshot.queryParams.disks;
      this.buildDiskMetrics();
    }
  }

  navigateToTab(tab: Tab): void {
    const link = '/reportsdashboard/' + tab.value;
    this.router.navigate([link]);
  }

  activateTab(activeTab: Tab): void {
    this.activeTab = activeTab;
    this.activeTabVerified = true;

    const reportCategories = activeTab.value === ReportTab.Disk ? this.diskReports : this.otherReports.filter(
      (report) => {
        let condition;
        switch (activeTab.value) {
          case ReportTab.Cpu:
            condition = (report.name === 'cpu' || report.name === 'load' || report.name === 'cputemp');
            break;
          case ReportTab.Memory:
            condition = (report.name === 'memory' || report.name === 'swap');
            break;
          case ReportTab.Network:
            condition = (report.name === 'interface');
            break;
          case ReportTab.Nfs:
            condition = (report.name === 'nfsstat' || report.name === 'nfsstatbytes');
            break;
          case ReportTab.Partition:
            condition = (report.name === 'df');
            break;
          case ReportTab.System:
            condition = (report.name === 'processes' || report.name === 'uptime');
            break;
          case ReportTab.Target:
            condition = (report.name === 'ctl');
            break;
          case ReportTab.Ups:
            condition = report.name.startsWith('ups');
            break;
          case ReportTab.Zfs:
            condition = report.name.startsWith('arc');
            break;
          default:
            condition = true;
        }

        return condition;
      },
    );

    this.activeReports = this.flattenReports(reportCategories);

    if (activeTab.value !== ReportTab.Disk) {
      const keys = Object.keys(this.activeReports);
      this.visibleReports = keys.map((reportIndex) => parseInt(reportIndex));
    }
  }

  flattenReports(list: Report[]): Report[] {
    // Based on identifiers, create a single dimensional array of reports to render
    const result: Report[] = [];
    list.forEach((report) => {
      // Without identifiers

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

    this.diskMetrics = metrics;
  }

  buildDiskReport(event: { devices: Option[]; metrics: Option[] }): void {
    const metrics = event.metrics.map((metric) => metric.value);
    const devices = event.devices.map((device) => device.value);

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

  parseDisks(disks: Disk[]): void {
    const uniqueNames = disks
      .filter((disk) => !disk.devname.includes('multipath'))
      .map((disk) => disk.devname);

    this.diskDevices = uniqueNames.map((devname) => {
      const spl = devname.split(' ');
      return { label: devname, value: spl[0] };
    });
  }

  isReportReversed(report: Report): boolean {
    return report.name === 'cpu';
  }

  showConfigForm(): void {
    this.slideIn.open(ReportsConfigFormComponent);
  }
}
