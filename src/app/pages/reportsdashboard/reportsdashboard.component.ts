import {
  Component, ElementRef, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, ViewChild,
} from '@angular/core';
import {
  Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot,
} from '@angular/router';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import * as _ from 'lodash';
import { Subject, BehaviorSubject } from 'rxjs';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { ReportComponent, Report } from './components/report/report.component';
import { ReportsService } from './reports.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { ErdService } from 'app/services/erd.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';
import {
  RestService,
  SystemGeneralService,
  WebSocketService,
} from '../../services';

interface Tab {
  label: string;
  value: string;
}

@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reportsdashboard.scss'],
  templateUrl: './reportsdashboard.html',
  providers: [SystemGeneralService],
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, /* HandleChartConfigDataFunc, */ AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport, { static: false }) viewport: CdkVirtualScrollViewport;
  @ViewChild('container', { static: true }) container: ElementRef;
  scrollContainer: HTMLElement;
  scrolledIndex = 0;
  isFooterConsoleOpen;

  product_type: string = window.localStorage['product_type'];
  retroLogo: string;

  multipathTitles: any = {};
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
  values = [];
  toolbarConfig: any[] = [];
  protected isEntity = true;
  diskDevices = [];
  diskMetrics = [];
  categoryDevices = [];
  categoryMetrics = [];
  saveSubmitText = T('Generate Reports');
  actionButtonsAlign = 'left';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[];
  disksWithNoTempGraphs: { [disk: string]: Report };
  diskReportConfigReady = false;

  constructor(
    private erdService: ErdService,
    public translate: TranslateService,
    private router: Router,
    private core: CoreService,
    protected ws: WebSocketService,
    private route: ActivatedRoute,
  ) {

    // EXAMPLE METHOD
    // this.viewport.scrollToIndex(5);
  }

  ngOnInit() {
    this.scrollContainer = document.querySelector('.rightside-content-hold ');// this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';

    this.ws.call('system.advanced.config').subscribe((res) => {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).subscribe((evt: CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).subscribe((evt: CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.register({ observerClass: this, eventName: 'UserPreferences' }).subscribe((evt: CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? '1' : '0';
    });

    this.core.emit({ name: 'UserPreferencesRequest' });

    this.core.register({ observerClass: this, eventName: 'ReportingGraphs' }).subscribe((evt: CoreEvent) => {
      if (evt.data) {
        const allReports = evt.data.map((report) => {
          const list = [];
          if (report.identifiers) {
            for (let i = 0; i < report.identifiers.length; i++) {
              list.push(true);
            }
          } else {
            list.push(true);
          }
          report.isRendered = list;
          return report;
        });

        this.diskReports = allReports.filter((report) => report.name.startsWith('disk'));

        this.otherReports = allReports.filter((report) => !report.name.startsWith('disk'));

        this.generateTabs();

        this.activateTabFromUrl();
      }
    });

    this.diskQueries();
  }

  diskQueries() {
    this.ws.call('multipath.query').subscribe((multipath_res) => {
      let multipathDisks = [];
      multipath_res.forEach((m) => {
        const children = m.children.map((child) => ({ disk: m.name.replace('multipath/', ''), name: child.name, status: child.status }));
        multipathDisks = multipathDisks.concat(children);
      });

      this.ws.call('disk.query').subscribe((res) => {
        const noTempDisks = res.filter((disk) => disk.hddstandby !== 'ALWAYS ON' && !disk.hddstandby_force);
        if (!this.disksWithNoTempGraphs) {
          this.disksWithNoTempGraphs = {};
        }
        for (const disk of noTempDisks) {
          this.disksWithNoTempGraphs[disk.name] = {
            identifiers: [disk.identifier],
            name: disk.name + '-temp',
            title: 'Disk Temperatur ' + disk.name,
            empty: {
              title: T('Disk Temperatures Not Available'),
              message: T('This disk cannot collect temperature data the way it is currently configured. Please either enable ‘Force HDD Standby’ or set ‘HDD Standby’ to ‘Never’ in order to enable temperature data collection.'),
              button: {
                text: T('Edit Disk'),
                click: () => {
                  this.router.navigate(new Array('/').concat([
                    'storage', 'disks', 'edit', disk.identifier,
                  ]));
                },
              },
            },
          };
        }

        this.parseDisks(res, multipathDisks);
        this.core.emit({ name: 'ReportingGraphsRequest', sender: this });
      });
    });
  }

  ngOnDestroy() {
    this.scrollContainer.style.overflow = 'auto';
    this.core.unregister({ observerClass: this });
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement('dashboardcontainerdiv');

    this.setupSubscriptions();
  }

  getVisibility(key) {
    const test = this.visibleReports.indexOf(key);
    return test != -1;
  }

  getBatch(lastSeen: string) {
    return this.visibleReports;
  }

  nextBatch(evt, offset) {
    this.scrolledIndex = evt;
  }

  trackByIndex(i) {
    return i;
  }

  generateTabs() {
    const labels = [T('CPU'), T('Disk'), T('Memory'), T('Network'), T('NFS'), T('Partition'), T('System'), T('Target'), T('ZFS')];
    const UPS = this.otherReports.find((report) => report.title.startsWith('UPS'));

    if (UPS) {
      labels.splice(8, 0, 'UPS');
    }

    labels.forEach((item) => {
      this.allTabs.push({ label: item, value: item.toLowerCase() });
    });
  }

  activateTabFromUrl() {
    const subpath = this.route.snapshot.url[0] && this.route.snapshot.url[0].path;
    const tabFound = this.allTabs.find((tab) => tab.value === subpath);
    this.updateActiveTab(tabFound || this.allTabs[0]);
  }

  isActiveTab(str: string) {
    let test: boolean;
    if (!this.activeTab) {
      test = ('/reportsdashboard/' + str.toLowerCase()) == this.router.url;
    } else {
      test = (this.activeTab == str.toLowerCase());
    }
    return test;
  }

  updateActiveTab(tab: Tab) {
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

  navigateToTab(tabName) {
    const link = '/reportsdashboard/' + tabName.toLowerCase();
    this.router.navigate([link]);
  }

  activateTab(name: string) {
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

  flattenReports(list: Report[]) {
    // Based on identifiers, create a single dimensional array of reports to render
    const result = [];
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

  diskReportBuilderSetup(selectedDisks: string[]) {
    this.generateValues();

    // Entity-Toolbar Config
    this.toolbarConfig = [
      {
        type: 'multimenu',
        name: 'devices',
        label: T('Devices'),
        disabled: false,
        options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
        value: this.diskDevices && selectedDisks ? this.diskDevices.filter((device) => selectedDisks.includes(device.value)) : null,
      },
      {
        type: 'multimenu',
        name: 'metrics',
        label: T('Metrics'),
        disabled: false,
        options: this.diskMetrics ? this.diskMetrics : [T('Not Available')], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
      },
    ];

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
            options: this.diskMetrics ? this.diskMetrics : [{ label: 'None available', value: 'negative' }], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
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

  generateValues() {
    const metrics = [];

    this.diskReports.forEach((item) => {
      let formatted = item.title.replace(/ \(.*\)/, '');// remove placeholders for identifiers eg. '({identifier})'
      formatted = formatted.replace(/identifier/, '');
      formatted = formatted.replace(/[{][}]/, '');
      formatted = formatted.replace(/requests on/, '');
      metrics.push({ label: formatted, value: item.name });
    });

    this.diskMetrics = metrics;
  }

  generateFieldConfig() {
    for (const i in this.fieldSets) {
      for (const ii in this.fieldSets[i].config) {
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
    this.diskReportConfigReady = true;
  }

  setupSubscriptions() {
    this.target.subscribe((evt: CoreEvent) => {
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

  buildDiskReport(device: string | any[], metric: string | any[]) {
    let metricValue: string;
    if (Array.isArray(metric)) {
      metricValue = metric[0].value;
    } else {
      metricValue = metric;
    }
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

    const visible = [];
    this.activeReports.forEach((item, index) => {
      const deviceMatch = device.indexOf(item.identifiers[0]) !== -1;
      const metricMatch = metric.indexOf(item.name) !== -1;
      const condition = (deviceMatch && metricMatch);
      if (condition) {
        visible.push(index);
      }
    });

    const visibleNoTempDisks = device.filter((dev) => Object.keys(this.disksWithNoTempGraphs).includes(dev));

    if (metric.indexOf('disktemp') !== -1 && visibleNoTempDisks.length) {
      for (const disk of visibleNoTempDisks) {
        this.activeReports.push(this.disksWithNoTempGraphs[disk]);
        visible.push(this.activeReports.length - 1);
      }
    }

    this.visibleReports = visible;
  }

  parseDisks(res, multipathDisks) {
    const uniqueNames = res.filter((disk) => !disk.devname.includes('multipath'))
      .map((d) => d.devname);

    const activeDisks = multipathDisks.filter((disk) => disk.status == 'ACTIVE');

    const multipathTitles = {};

    const multipathNames = activeDisks.map((disk) => {
      const label = disk.disk; // disk.name + ' (multipath : ' + disk.disk  + ')';
      // Update activeReports with multipathTitles
      multipathTitles[disk.name] = label;
      return {
        label: disk.disk, value: disk.name, labelIcon: 'multipath', labelIconType: 'custom',
      };
    });

    this.multipathTitles = multipathTitles;

    // uniqueNames = uniqueNames.concat(multipathNames);

    const diskDevices = uniqueNames.map((devname) => {
      const spl = devname.split(' ');
      const obj = { label: devname, value: spl[0] };
      return obj;
    });

    this.diskDevices = diskDevices.concat(multipathNames);
  }
}
