import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild,
} from '@angular/core';
import {
  Router, ActivatedRoute,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject, BehaviorSubject, forkJoin } from 'rxjs';
import { ReportTab } from 'app/enums/report-tab.enum';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import {
  SystemGeneralService,
  WebSocketService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { Report } from './components/report/report.component';
import { ReportsConfigFormComponent } from './components/reports-config-form/reports-config-form.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

interface Tab {
  label: string;
  value: ReportTab;
}

@UntilDestroy()
@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reports-dashboard.scss'],
  templateUrl: './reports-dashboard.component.html',
  providers: [SystemGeneralService],
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  @ViewChild('container', { static: true }) container: ElementRef;
  scrollContainer: HTMLElement;
  scrolledIndex = 0;

  diskReports: Report[];
  otherReports: Report[];
  activeReports: Report[] = [];

  activeTab = { label: this.translate.instant('CPU'), value: ReportTab.Cpu } as Tab;
  activeTabVerified = false;
  allTabs: Tab[] = [];
  loadingReports = false;

  displayList: number[] = [];
  visibleReports: number[] = [];

  totalVisibleReports = 4;
  viewportEnd = false;
  viewportOffset = new BehaviorSubject(null);

  // Report Builder Options (entity-form-embedded)
  target: Subject<CoreEvent> = new Subject();
  values: any[] = [];
  toolbarConfig: ToolbarConfig;
  protected isEntity = true;
  diskDevices: Option[] = [];
  diskMetrics: Option[] = [];
  saveSubmitText = this.translate.instant('Generate Reports');
  actionButtonsAlign = 'left';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[];
  diskReportConfigReady = false;
  actionsConfig: any;

  constructor(
    public modalService: ModalService,
    private router: Router,
    private core: CoreService,
    private route: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
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

  ngOnDestroy(): void {
    this.scrollContainer.style.overflow = 'auto';
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.setupSubscriptions();

    this.actionsConfig = { actionType: ReportsGlobalControlsComponent, actionConfig: this };
    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
  }

  getVisibility(key: number): boolean {
    const test = this.visibleReports.indexOf(key);
    return test !== -1;
  }

  getBatch(): number[] {
    return this.visibleReports;
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

    const pseudoRouteEvent = [
      {
        url: '/reportsdashboard/' + tab.value,
        title: 'Reporting',
        breadcrumb: 'Reporting',
        disabled: true,
      },
      {
        url: '',
        title: tab.label,
        breadcrumb: tab.label,
        disabled: true,
      },
    ];

    this.core.emit({ name: 'PseudoRouteChange', data: pseudoRouteEvent });

    this.activateTab(tab);

    if (tab.value === ReportTab.Disk) {
      const selectedDisks = this.route.snapshot.queryParams.disks;
      this.diskReportBuilderSetup(selectedDisks);
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

  // Disk Report Filtering

  diskReportBuilderSetup(selectedDisks: string[]): void {
    this.generateValues();

    // Entity-Toolbar Config
    this.toolbarConfig = {
      target: this.target,
      controls: [
        {
          // type: 'multimenu',
          type: 'multiselect',
          name: 'devices',
          label: this.translate.instant('Devices'),
          placeholder: this.translate.instant('Devices'),
          disabled: false,
          multiple: true,
          options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
          customTriggerValue: this.translate.instant('Select Disks'),
          value: this.diskDevices?.length && selectedDisks
            ? this.diskDevices.filter((device) => selectedDisks.includes(device.value as string))
            : null,
        },
        {
          type: 'multiselect',
          name: 'metrics',
          label: this.translate.instant('Metrics'),
          placeholder: this.translate.instant('Metrics'),
          customTriggerValue: this.translate.instant('Select Reports'),
          disabled: false,
          multiple: true,
          options: this.diskMetrics ? this.diskMetrics : [this.translate.instant('Not Available')], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
          value: selectedDisks ? this.diskMetrics : undefined,
        },
      ],
    };

    // Entity-Form Config
    this.fieldSets = [
      {
        name: 'Report Options',
        class: 'preferences',
        label: false,
        width: '600px',
        config: [
          {
            type: 'select',
            name: 'devices',
            width: 'calc(50% - 16px)',
            placeholder: this.translate.instant('Choose a Device'),
            options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            required: true,
            multiple: true,
            tooltip: this.translate.instant('Choose a device for your report.'),
            class: 'inline',
          },
          {
            type: 'select',
            name: 'metrics',
            width: 'calc(50% - 16px)',
            placeholder: this.translate.instant('Choose a metric'),

            // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
            options: this.diskMetrics ? this.diskMetrics : [{ label: 'None available', value: 'negative' }],
            required: true,
            multiple: true,
            tooltip: this.translate.instant('Choose a metric to display.'),
            class: 'inline',
          },
        ],
      },
    ];

    this.generateFieldConfig();
  }

  generateValues(): void {
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

  generateFieldConfig(): void {
    this.fieldSets.forEach((fieldSet) => {
      fieldSet.config.forEach((config) => {
        this.fieldConfig.push(config);
      });
    });
    this.diskReportConfigReady = true;
  }

  setupSubscriptions(): void {
    this.target.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'FormSubmitted':
          this.buildDiskReport(evt.data.devices, evt.data.metrics);
          break;
        case 'ToolbarChanged':
          if (evt.data.devices && evt.data.metrics) {
            this.buildDiskReport(evt.data.devices, evt.data.metrics);
          }
          break;
      }
    });

    this.target.next({ name: 'Refresh' });
  }

  buildDiskReport(devices: string | any[], metrics: string | any[]): void {
    // Convert strings to arrays
    if (typeof devices === 'string') {
      devices = [devices];
    } else {
      devices = devices.map((device) => device.value);
    }

    if (typeof metrics === 'string') {
      metrics = [metrics];
    } else {
      metrics = metrics.map((metric) => metric.value);
    }

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
