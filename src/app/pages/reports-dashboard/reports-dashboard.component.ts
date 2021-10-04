import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild,
} from '@angular/core';
import {
  Router, ActivatedRoute,
} from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, BehaviorSubject } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { ReportingGraphsEvent } from 'app/interfaces/events/reporting-graphs-event.interface';
import {
  UserPreferencesChangedEvent, UserPreferencesEvent,
  UserPreferencesReadyEvent,
} from 'app/interfaces/events/user-preferences-event.interface';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { MultipathDisk } from 'app/pages/reports-dashboard/multipath-disk.interface';
import {
  SystemGeneralService,
  WebSocketService,
} from 'app/services';
import { ErdService } from 'app/services/erd.service';
import { ModalService } from 'app/services/modal.service';
import { Report } from './components/report/report.component';
import { ReportsConfigComponent } from './components/reports-config/reports-config.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';

interface Tab {
  label: string;
  value: string;
}

@UntilDestroy()
@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reports-dashboard.scss'],
  templateUrl: './reports-dashboard.component.html',
  providers: [SystemGeneralService],
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, /* HandleChartConfigDataFunc, */ AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  @ViewChild('container', { static: true }) container: ElementRef;
  scrollContainer: HTMLElement;
  scrolledIndex = 0;

  retroLogo: string;

  multipathTitles: { [disk: string]: string } = {};
  diskReports: Report[];
  otherReports: Report[];
  activeReports: Report[] = [];

  activeTab = 'CPU'; // Tabs (lower case only): CPU, Disk, Memory, Network, NFS, Partition?, System, Target, UPS, ZFS
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
  saveSubmitText = T('Generate Reports');
  actionButtonsAlign = 'left';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[];
  diskReportConfigReady = false;
  actionsConfig: any;

  constructor(
    private erdService: ErdService,
    public modalService: ModalService,
    private router: Router,
    private core: CoreService,
    private route: ActivatedRoute,
    protected ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.scrollContainer = document.querySelector('.rightside-content-hold ');// this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';

    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesReadyEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferences' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.emit({ name: 'UserPreferencesRequest' });

    this.core.register({ observerClass: this, eventName: 'ReportingGraphs' }).pipe(untilDestroyed(this)).subscribe((evt: ReportingGraphsEvent) => {
      if (evt.data) {
        const allReports: any[] = evt.data.map((report) => {
          const list = [];
          if ((report as any).identifiers) {
            for (let i = 0; i < (report as any).identifiers.length; i++) {
              list.push(true);
            }
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

        this.generateTabs();

        this.activateTabFromUrl();
      }
    });

    this.diskQueries();
  }

  diskQueries(): void {
    this.ws.call('multipath.query').pipe(untilDestroyed(this)).subscribe((multipath_res) => {
      let multipathDisks: MultipathDisk[] = [];
      multipath_res.forEach((m) => {
        const children = m.children.map((child) => {
          return {
            disk: m.name.replace('multipath/', ''),
            name: child.name,
            status: child.status,
          };
        });
        multipathDisks = multipathDisks.concat(children);
      });

      this.ws.call('disk.query').pipe(untilDestroyed(this)).subscribe((res) => {
        this.parseDisks(res, multipathDisks);
        this.core.emit({ name: 'ReportingGraphsRequest', sender: this });
      });
    });
  }

  ngOnDestroy(): void {
    this.scrollContainer.style.overflow = 'auto';
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement('dashboardcontainerdiv');

    this.setupSubscriptions();

    this.actionsConfig = { actionType: ReportsGlobalControlsComponent, actionConfig: this };
    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
  }

  getVisibility(key: number): boolean {
    const test = this.visibleReports.indexOf(key);
    return test != -1;
  }

  getBatch(): number[] {
    return this.visibleReports;
  }

  nextBatch(evt: number): void {
    this.scrolledIndex = evt;
  }

  generateTabs(): void {
    const labels: string[] = [
      T('CPU'),
      T('Disk'),
      T('Memory'),
      T('Network'),
      T('NFS'),
      T('Partition'),
      T('System'),
      T('Target'),
      T('ZFS'),
    ];
    const UPS = this.otherReports.find((report) => report.title.startsWith('UPS'));

    if (UPS) {
      labels.splice(8, 0, 'UPS');
    }

    labels.forEach((item) => {
      this.allTabs.push({ label: item, value: item.toLowerCase() });
    });
  }

  activateTabFromUrl(): void {
    const subpath = this.route.snapshot.url[0] && this.route.snapshot.url[0].path;
    const tabFound = this.allTabs.find((tab) => tab.value === subpath);
    this.updateActiveTab(tabFound || this.allTabs[0]);
  }

  isActiveTab(str: string): boolean {
    let test: boolean;
    if (!this.activeTab) {
      test = ('/reportsdashboard/' + str.toLowerCase()) == this.router.url;
    } else {
      test = (this.activeTab == str.toLowerCase());
    }
    return test;
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

    this.activateTab(tab.label);

    if (tab.label == 'Disk') {
      const selectedDisks = this.route.snapshot.queryParams.disks;
      this.diskReportBuilderSetup(selectedDisks);
    }
  }

  navigateToTab(tabName: string): void {
    const link = '/reportsdashboard/' + tabName.toLowerCase();
    this.router.navigate([link]);
  }

  activateTab(name: string): void {
    this.activeTab = name;
    this.activeTabVerified = true;

    const reportCategories = name == 'Disk' ? this.diskReports : this.otherReports.filter((report) => {
      // Tabs: CPU, Disk, Memory, Network, NFS, Partition, System, Target, UPS, ZFS
      let condition;
      switch (name) {
        case 'CPU':
          condition = (report.name == 'cpu' || report.name == 'load' || report.name == 'cputemp');
          break;
        case 'Memory':
          condition = (report.name == 'memory' || report.name == 'swap');
          break;
        case 'Network':
          condition = (report.name == 'interface');
          break;
        case 'NFS':
          condition = (report.name == 'nfsstat' || report.name == 'nfsstatbytes');
          break;
        case 'Partition':
          condition = (report.name == 'df');
          break;
        case 'System':
          condition = (report.name == 'processes' || report.name == 'uptime');
          break;
        case 'Target':
          condition = (report.name == 'ctl');
          break;
        case 'UPS':
          condition = report.name.startsWith('ups');
          break;
        case 'ZFS':
          condition = report.name.startsWith('arc');
          break;
        default:
          condition = true;
      }

      return condition;
    });

    this.activeReports = this.flattenReports(reportCategories);

    if (name !== 'Disk') {
      const keys = Object.keys(this.activeReports);
      this.visibleReports = keys.map((v) => parseInt(v));
    }
  }

  flattenReports(list: Report[]): any[] {
    // Based on identifiers, create a single dimensional array of reports to render
    const result: any[] = [];
    list.forEach((report) => {
      // Without identifiers

      // With identifiers
      if (report.identifiers) {
        report.identifiers.forEach((item, index) => {
          const r = { ...report };
          r.title = r.title.replace(/{identifier}/, item);

          r.identifiers = [item];
          if (report.isRendered[index]) {
            r.isRendered = [true];
            result.push(r);
          }
        });
      } else if (!report.identifiers && report.isRendered[0]) {
        const r = { ...report };
        r.identifiers = [];
        result.push(r);
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
          label: T('Devices'),
          placeholder: T('Devices'),
          disabled: false,
          multiple: true,
          options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
          customTriggerValue: 'Select Disks',
          value: this.diskDevices?.length && selectedDisks
            ? this.diskDevices.filter((device) => selectedDisks.includes(device.value as string))
            : null,
        },
        {
          type: 'multiselect',
          name: 'metrics',
          label: T('Metrics'),
          placeholder: T('Metrics'),
          customTriggerValue: T('Select Reports'),
          disabled: false,
          multiple: true,
          options: this.diskMetrics ? this.diskMetrics : [T('Not Available')], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
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
            placeholder: T('Choose a Device'),
            options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            required: true,
            multiple: true,
            tooltip: T('Choose a device for your report.'),
            class: 'inline',
          },
          {
            type: 'select',
            name: 'metrics',
            width: 'calc(50% - 16px)',
            placeholder: T('Choose a metric'),

            // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
            options: this.diskMetrics ? this.diskMetrics : [{ label: 'None available', value: 'negative' }],
            required: true,
            multiple: true,
            tooltip: T('Choose a metric to display.'),
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

  buildDiskReport(device: string | any[], metric: string | any[]): void {
    // Convert strings to arrays
    if (typeof device == 'string') {
      device = [device];
    } else {
      device = device.map((v) => v.value);
    }

    if (typeof metric == 'string') {
      metric = [metric];
    } else {
      metric = metric.map((v) => v.value);
    }

    const visible: number[] = [];
    this.activeReports.forEach((item, index) => {
      const deviceMatch = device.indexOf(item.identifiers[0]) !== -1;
      const metricMatch = metric.indexOf(item.name) !== -1;
      const condition = (deviceMatch && metricMatch);
      if (condition) {
        visible.push(index);
      }
    });

    this.visibleReports = visible;
  }

  parseDisks(disks: Disk[], multipathDisks: MultipathDisk[]): void {
    const uniqueNames = disks
      .filter((disk) => !disk.devname.includes('multipath'))
      .map((disk) => disk.devname);

    const activeDisks = multipathDisks.filter((disk) => disk.status == 'ACTIVE');

    const multipathTitles: { [disk: string]: string } = {};

    const multipathNames = activeDisks.map((disk) => {
      const label = disk.disk; // disk.name + ' (multipath : ' + disk.disk  + ')';
      // Update activeReports with multipathTitles
      multipathTitles[disk.name] = label;
      return {
        label: disk.disk, value: disk.name, labelIcon: 'multipath', labelIconType: 'custom',
      };
    });

    this.multipathTitles = multipathTitles;

    const diskDevices = uniqueNames.map((devname) => {
      const spl = devname.split(' ');
      return { label: devname, value: spl[0] };
    });

    this.diskDevices = diskDevices.concat(multipathNames);
  }

  showConfigForm(): void {
    const formComponent = this.modalService.openInSlideIn(ReportsConfigComponent);
    formComponent.title = T('Reports Configuration');
    formComponent.isOneColumnForm = true;
    formComponent.afterModalFormSaved = () => {
      this.modalService.close('slide-in-form');
    };
  }
}
