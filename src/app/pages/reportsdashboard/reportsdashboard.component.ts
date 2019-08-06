import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
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

//import { PageEvent } from '@angular/material';
import { ErdService } from 'app/services/erd.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';

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
  public toolbarConfig: any[] = [];
  protected isEntity: boolean = true;
  public diskDevices = [];
  public diskMetrics = [];
  public categoryDevices = [];
  public categoryMetrics = [];
  public saveSubmitText = "Generate Reports";
  public actionButtonsAlign = "left";
  public fieldConfig:FieldConfig[] = [];
  public fieldSets: FieldSet[];
  public diskReportConfigReady: boolean = false;

  constructor(private erdService: ErdService, 
    public translate: TranslateService, 
    private router:Router, 
    private core:CoreService,
    private rs: ReportsService,
    protected ws: WebSocketService) {

    // EXAMPLE METHOD
    //this.viewport.scrollToIndex(5);
  }

  ngOnInit() { 
    this.scrollContainer = document.querySelector('.rightside-content-hold ');//this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';
    
    this.generateTabs();
    //this.initReportVisbility(this.totalVisibleReports);

    this.core.register({observerClass: this, eventName:"CacheConfigData"}).subscribe((evt:CoreEvent) => {
      // Not sure what this does
    });

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });
 
    this.core.register({observerClass: this, eventName:"ReportingGraphs"}).subscribe((evt:CoreEvent) => { 
      if (evt.data) {
        console.log(evt.data);
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

        this.otherReports = allReports.filter((report) => !report.name.startsWith('disk') /*&& name !== 'df' && report.name !== 'uptime'*/);
       
        this.activateTabFromUrl();
      }
    });

    this.core.emit({name:"ReportingGraphsRequest"});

  }

  ngOnDestroy() {
    this.scrollContainer.style.overflow = 'auto';
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement("dashboardcontainerdiv"); 
    
    this.setupSubscriptions();
  }

  getVisibility(key){
    const test = this.visibleReports.indexOf(key);
    return test == -1 ? false : true;
  }

  getBatch(lastSeen: string){
    // Do Stuff
    console.log("getBatch Method");
    return this.visibleReports;
  }

  nextBatch(evt, offset){
    this.scrolledIndex = evt;
    /*if (this.viewportEnd){
      return;
    }

    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    if(end === total){
      this.viewportOffset.next(offset);//fetch more data;
    }*/
  }

  trackByIndex(i){
    return i;
  }


  generateTabs(){
      let labels = ['CPU', 'Disk', 'Memory', 'Network', 'NFS', 'Partition', 'System', 'Target', 'UPS', 'ZFS'];
      labels.forEach((item) =>{
        this.allTabs.push({label:item, value:item.toLowerCase()});
      })
  }

  /*initReportVisbility(total:number){
    //this.displayList = this.activeReports.map((r) => -1);
    let result = [];
    for(let i = 0; i < total; i++){
      result.push(i);
      //this.displayList[i]
    }
    this.visibleReports = result;
  }*/

  activateTabFromUrl (){ 
    let subpath = this.router.url.split("/reportsdashboard/"); 
    let tabFound = this.allTabs.find((tab) =>{
      //return tab.path === subpath[1];
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
    //console.log(this.activeReports);
    //console.log(this.visibleReports);
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
   
    /*console.log("FLATTENED!");
    console.log(list);
    console.log(result);
    this.fetchReportData(result[0], result[0].identifiers[0]);*/
    return result;
  }

// Disk Report Filtering

diskReportBuilderSetup(){

    this.generateValues();
    
    // Entity-Toolbar Config
    this.toolbarConfig = [
          {
            type: 'multimenu',
            name: 'devices',
            label: 'Devices',
            disabled:false,
            options: this.diskDevices.map((v) => v.value), // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            //tooltip:'Choose a device for your report.',
          },
          {
            type: 'multimenu',
            name: 'metrics',
            label: 'Metrics',
            disabled: false,
            options: this.diskMetrics ? this.diskMetrics.map((v) => v.value) : ['Not Available'], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
            //tooltip:'Choose a metric to display.',
          }
    ]

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
            placeholder: 'Choose a Device',
            options: this.diskDevices, // eg. [{label:'ada0',value:'ada0'},{label:'ada1', value:'ada1'}],
            //value:[this.diskDevices[0]],
            required: true,
            multiple: true,
            tooltip:'Choose a device for your report.',
            class:'inline'
          },
          {
            type: 'select',
            name: 'metrics',
            width:'calc(50% - 16px)',
            placeholder: 'Choose a metric',
            options: this.diskMetrics ? this.diskMetrics : [{label:'None available', value:'negative'}], // eg. [{label:'temperature',value:'temperature'},{label:'operations', value:'disk_ops'}],
            //value:[this.diskMetrics[0]],
            required: true,
            multiple: true,
            tooltip:'Choose a metric to display.',
            class:'inline'
          }
        ]
      }
    ]

    this.generateFieldConfig();
  }

  generateValues(){
    //let tab = this.allTabs.find(item => item.label == 'Disk');
    let devices = [];
    //let deviceNames = [];
    let metrics = [];
    //let metricNames = [];

    this.diskReports[0].identifiers.forEach((item) => {
      devices.push({label: item, value: item});
    });

    this.diskReports.forEach((item) => {
      //if(item.name == 'disk'){ devices = item.identifiers }
      let formatted = item.title.replace(/ \(.*\)/, '');// remove placeholders for identifiers eg. '({identifier})'
      formatted = formatted.replace(/identifier/, '');
      formatted = formatted.replace(/[{][}]/, '');
      formatted = formatted.replace(/requests on /, '');
      metrics.push({label: formatted, value: item.name});
    });

    this.diskDevices = devices;
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

  buildDiskReport(device: string | string[], metric: string | string[]){
    
    // Convert strings to arrays
    if(typeof device == "string"){ device = [device];}
    if(typeof metric == "string"){ metric = [metric];}

    //let clone = Object.assign([], this.activeReports);
    let visible = [];
    this.activeReports.forEach((item, index) => {
      //const condition = item.identifiers[0] == device[0] && item.name == metric[0];
      const deviceMatch = device.indexOf(item.identifiers[0]) !== -1;
      const metricMatch = metric.indexOf(item.name) !== -1;
      const condition = (deviceMatch && metricMatch)
      if(condition){
        visible.push(index);
      }
    });

    this.visibleReports = visible;

  }

}
