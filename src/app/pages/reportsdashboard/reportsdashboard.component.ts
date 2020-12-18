import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import * as _ from 'lodash';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { ReportComponent, Report } from './components/report/report.component';
import { ReportsGlobalControlsComponent } from './components/reports-global-controls/reports-global-controls.component';
import { ReportsService } from './reports.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { ErdService } from 'app/services/erd.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';
import {
  SystemGeneralService,
  WebSocketService,
} from '../../services/';

import { ReportsConfigComponent } from './components/reports-config/reports-config.component';

interface Tab {
  label: string;
  value: string;
}

@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reportsdashboard.scss'],
  templateUrl: './reportsdashboard.html',
  providers: [SystemGeneralService]
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, /*HandleChartConfigDataFunc,*/ AfterViewInit {

  @ViewChild(CdkVirtualScrollViewport, {static:false}) viewport:CdkVirtualScrollViewport;
  @ViewChild('container', {static:true}) container:ElementRef;
  public scrollContainer:HTMLElement;
  public scrolledIndex: number = 0;
  public isFooterConsoleOpen;

  public product_type: string = window.localStorage['product_type'];
  public retroLogo: string;

  public multipathTitles: any = {};
  public diskReports: Report[];
  public otherReports: Report[];
  public activeReports: Report[] = [];

  public activeTab: string = "CPU"; // Tabs (lower case only): CPU, Disk, Memory, Network, NFS, Partition?, System, Target, UPS, ZFS
  public activeTabVerified: boolean = false;
  public allTabs: Tab[] = [];
  public loadingReports: boolean = false;

  public displayList: number[] = [];
  public visibleReports:number[] = [];

  public totalVisibleReports:number = 4;
  public viewportEnd: boolean = false;
  public viewportOffset = new BehaviorSubject(null);

  // Report Builder Options (entity-form-embedded)
  public target: Subject<CoreEvent> = new Subject();
  public values = [];
  public toolbarConfig: ToolbarConfig;
  protected isEntity: boolean = true;
  public diskDevices = [];
  public diskMetrics = [];
  public categoryDevices = [];
  public categoryMetrics = [];
  public saveSubmitText = T("Generate Reports");
  public actionButtonsAlign = "left";
  public fieldConfig:FieldConfig[] = [];
  public fieldSets: FieldSet[];
  public diskReportConfigReady: boolean = false;
  private getAdvancedConfig: Subscription;
  public actionsConfig;
  public formComponent: ReportsConfigComponent;

  constructor(private erdService: ErdService,
    public translate: TranslateService,
    public modalService: ModalService,
    public dialogService: DialogService,
    private router:Router,
    private core:CoreService,
    private rs: ReportsService,
    protected ws: WebSocketService, private sysGeneralService: SystemGeneralService) {

    // EXAMPLE METHOD
    //this.viewport.scrollToIndex(5);
  }

  ngOnInit() {

    this.scrollContainer = document.querySelector('.rightside-content-hold ');//this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';

    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

    this.core.register({observerClass: this, eventName:"UserPreferencesReady"}).subscribe((evt:CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? "1" : "0";
    });

    this.core.register({observerClass: this, eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? "1" : "0";
    });

    this.core.register({observerClass: this, eventName:"UserPreferences"}).subscribe((evt:CoreEvent) => {
      this.retroLogo = evt.data.retroLogo ? "1" : "0";
    });

    this.core.emit({name:"UserPreferencesRequest"});

    this.core.register({observerClass: this, eventName:"ReportingGraphs"}).subscribe((evt:CoreEvent) => {
      if (evt.data) {
        let allReports = evt.data.map((report) => {
          let list = [];
          if(report.identifiers){
            for(let i = 0; i < report.identifiers.length; i++){
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

  diskQueries(){

    this.ws.call('multipath.query').subscribe((multipath_res) => {
      let multipathDisks = [];
      multipath_res.forEach((m) => {
        const children = m.children.map((child) => {
          return {disk:m.name.replace('multipath/', ''), name: child.name, status: child.status};
        });
        multipathDisks = multipathDisks.concat(children);
      });

      this.ws.call('disk.query').subscribe((res) => {
        this.parseDisks(res, multipathDisks);
        this.core.emit({name:"ReportingGraphsRequest", sender: this});
      });
    });

  }

  ngOnDestroy() {
    this.scrollContainer.style.overflow = 'auto';
    this.core.unregister({observerClass:this});
    this.getAdvancedConfig.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement("dashboardcontainerdiv");

    this.setupSubscriptions();

    this.actionsConfig = { actionType: ReportsGlobalControlsComponent, actionConfig: this };
    this.core.emit({ name:"GlobalActions", data: this.actionsConfig, sender: this });
  }

  getVisibility(key){
    const test = this.visibleReports.indexOf(key);
    return test == -1 ? false : true;
  }

  getBatch(lastSeen: string){
    return this.visibleReports;
  }

  nextBatch(evt, offset){
    this.scrolledIndex = evt;
  }

  trackByIndex(i){
    return i;
  }


  generateTabs(){
      let labels = [T('CPU'), T('Disk'), T('Memory'), T('Network'), T('NFS'), T('Partition'), T('System'), T('Target'), T('ZFS')];
      let UPS = this.otherReports.find((report) => {
        return report.title.startsWith('UPS');
      });

      if(UPS){
        labels.splice(8,0,'UPS');
      }

      labels.forEach((item) =>{
        this.allTabs.push({label:item, value:item.toLowerCase()});
      })
  }


  activateTabFromUrl (){
    let subpath = this.router.url.split("/reportsdashboard/");
    let tabFound = this.allTabs.find((tab) =>{
      return tab.value === subpath[1];
    });
    this.updateActiveTab(tabFound);
  }

  isActiveTab(str:string){
    let test: boolean;
    if(!this.activeTab){
      test = ('/reportsdashboard/' + str.toLowerCase()) == this.router.url;
    } else {
      test = (this.activeTab == str.toLowerCase());
    }
     return test;
  }

  updateActiveTab(tab:Tab){

    // Change the URL without reloading page/component
    // the old fashioned way
    window.history.replaceState({}, '','/reportsdashboard/' + tab.value);

    let pseudoRouteEvent = [
      {
        url: "/reportsdashboard/" + tab.value,
        title:"Reporting",
        breadcrumb:"Reporting",
        disabled:true
      },
      {
        url: "",
        title: tab.label,
        breadcrumb: tab.label,
        disabled:true
      }
    ]

    this.core.emit({name: "PseudoRouteChange", data: pseudoRouteEvent});

    this.activateTab(tab.label);

    if(tab.label == 'Disk'){ this.diskReportBuilderSetup() }
  }

  navigateToTab(tabName){
    const link = '/reportsdashboard/' + tabName.toLowerCase();
    this.router.navigate([link]);
  }


  activateTab(name:string){
    this.activeTab = name;
    this.activeTabVerified = true;

    let reportCategories = name == 'Disk' ? this.diskReports : this.otherReports.filter((report) => {
      // Tabs: CPU, Disk, Memory, Network, NFS, Partition, System, Target, UPS, ZFS
      let condition;
      switch(name){
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
          condition = (report.name == 'nfsstat');
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

    if(name !== 'Disk'){
      const keys = Object.keys(this.activeReports);
      this.visibleReports = keys.map((v) => parseInt(v));
    }
  }

  flattenReports(list:Report[]){
    // Based on identifiers, create a single dimensional array of reports to render
    let result = [];
    list.forEach((report) => {
      // Without identifiers

      // With identifiers
      if(report.identifiers){
        report.identifiers.forEach((item,index) => {
          let r = Object.assign({}, report);
          r.title = r.title.replace(/{identifier}/, item );

          r.identifiers = [item];
          if(report.isRendered[index]){
            r.isRendered = [true];
            result.push(r);
          }
        });
      } else if(!report.identifiers && report.isRendered[0]) {
        let r = Object.assign({}, report);
        r.identifiers = [];
        result.push(r);
      }
    });

    return result;
  }

// Disk Report Filtering

diskReportBuilderSetup(){

    this.generateValues();

    // Entity-Toolbar Config
    this.toolbarConfig = {
      target: this.target,
      controls: [
          {
            //type: 'multimenu',
            type: 'multiselect',
            name: 'devices',
            label: T('Devices'),
            placeholder: T('Devices'),
            disabled:false,
            multiple: true,
            options: this.diskDevices.map((v) => v), // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            customTriggerValue: 'Select Disks',
          },
          {
            type: 'multiselect',
            name: 'metrics',
            label: T('Metrics'),
            placeholder: T('Metrics'),
            customTriggerValue: T('Select Reports'),
            disabled: false,
            multiple: true,
            options: this.diskMetrics ? this.diskMetrics.map((v) => v) : [T('Not Available')], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
          }
      ]
    }

    // Entity-Form Config
    this.fieldSets = [
      {
        name:'Report Options',
        class:'preferences',
        label:false,
        width:'600px',
        config:[
          {
            type: 'select',
            name: 'devices',
            width:'calc(50% - 16px)',
            placeholder: T('Choose a Device'),
            options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            required: true,
            multiple: true,
            tooltip:T('Choose a device for your report.'),
            class:'inline'
          },
          {
            type: 'select',
            name: 'metrics',
            width:'calc(50% - 16px)',
            placeholder: T('Choose a metric'),
            options: this.diskMetrics ? this.diskMetrics : [{label:'None available', value:'negative'}], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
            required: true,
            multiple: true,
            tooltip:T('Choose a metric to display.'),
            class:'inline'
          }
        ]
      }
    ]

    this.generateFieldConfig();
  }

  generateValues(){
    let metrics = [];

    this.diskReports.forEach((item) => {
      let formatted = item.title.replace(/ \(.*\)/, '');// remove placeholders for identifiers eg. '({identifier})'
      formatted = formatted.replace(/identifier/, '');
      formatted = formatted.replace(/[{][}]/, '');
      formatted = formatted.replace(/requests on/, '');
      metrics.push({label: formatted, value: item.name});
    });

    this.diskMetrics = metrics;
  }

  generateFieldConfig(){
    for(let i in this.fieldSets){
      for(let ii in this.fieldSets[i].config){
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
    this.diskReportConfigReady = true;
  }

  setupSubscriptions(){
    this.target.subscribe((evt: CoreEvent) => {
      switch(evt.name){
        case 'FormSubmitted':
          this.buildDiskReport(evt.data.devices, evt.data.metrics);
        break;
        case 'ToolbarChanged':
          if(evt.data.devices && evt.data.metrics){
            this.buildDiskReport(evt.data.devices, evt.data.metrics);
          }
        break;
      }
    });

    this.target.next({name:"Refresh"});
  }

  buildDiskReport(device: string | any[], metric: string | any[]){
    // Convert strings to arrays
    if(typeof device == "string"){
      device = [device];
    } else {
      device = device.map((v) => v.value);
    }

    if(typeof metric == "string"){
      metric = [metric];
    } else {
      metric = metric.map((v) => v.value);
    }

    let visible = [];
    this.activeReports.forEach((item, index) => {
      const deviceMatch = device.indexOf(item.identifiers[0]) !== -1;
      const metricMatch = metric.indexOf(item.name) !== -1;
      const condition = (deviceMatch && metricMatch)
      if(condition){
        visible.push(index);
      }

    });

    this.visibleReports = visible;
  }

  parseDisks(res,multipathDisks){
    let uniqueNames = res.filter((disk) => !disk.devname.includes('multipath'))
      .map(d => d.devname);

    let activeDisks = multipathDisks.filter((disk) => disk.status == 'ACTIVE');

    let multipathTitles = {};

    let multipathNames = activeDisks.map((disk) => {
      let label = disk.disk; //disk.name + ' (multipath : ' + disk.disk  + ')';
      // Update activeReports with multipathTitles
      multipathTitles[disk.name] = label;
      return { label: disk.disk, value: disk.name, labelIcon: 'multipath', labelIconType: 'custom' };
    });

    this.multipathTitles = multipathTitles;

    //uniqueNames = uniqueNames.concat(multipathNames);

    let diskDevices = uniqueNames.map((devname) => {
      let spl = devname.split(' ');
      let obj = {label: devname, value: spl[0]};
      return obj;
    });

    this.diskDevices = diskDevices.concat(multipathNames);

  }

  showConfigForm() {
    if (this.formComponent) {
      delete this.formComponent
    }
    this.generateFormComponent()
    this.modalService.open('slide-in-form', this.formComponent)
  }

  generateFormComponent() {
    this.formComponent = new ReportsConfigComponent(this.ws, this.dialogService)
    this.formComponent.title = T('Reports Configuration');
    this.formComponent.isOneColumnForm = true;
    this.formComponent.afterModalFormSaved = () => {
      this.modalService.close('slide-in-form')
    }
  }
}
