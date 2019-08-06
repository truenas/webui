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

  /*get topOffset(){
    return (this.visibleReports[0] * 430).toString();
  }*/
  //public lastScrollPosition:number = 0;

  constructor(private erdService: ErdService, 
    public translate: TranslateService, 
    private router:Router, 
    private core:CoreService,
    private rs: ReportsService,
    protected ws: WebSocketService) {

    // EXAMPLE METHOD
    //this.viewport.scrollToIndex(5);
  }

  diskReportBuilderSetup(){
    // Entity-Toolbar Config
    let toolbarConfig = [
          {
            type: 'multimenu',
            name: 'devices',
            label: 'Devices',
            disabled:false,
          },
          {
            type: 'multimenu',
            name: 'metrics',
            label: 'Metrics',
            disabled: false,
          }
    ]
  }


  ngOnInit() { 
    this.scrollContainer = document.querySelector('.rightside-content-hold ');//this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';
    //this.scrollContainer.addEventListener('scroll', this.onScroll.bind(this) );
    
    this.generateTabs();
    this.initReportVisbility(this.totalVisibleReports);

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
    //this.setupSubscriptions();
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

  initReportVisbility(total:number){
    //this.displayList = this.activeReports.map((r) => -1);
    let result = [];
    for(let i = 0; i < total; i++){
      result.push(i);
      //this.displayList[i]
    }
    this.visibleReports = result;
  }

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
    
    console.log("updateActiveTab");
    this.core.emit({name: "PseudoRouteChange", data: pseudoRouteEvent});

    // Simulate tab eventl
    /*let evt = {
      tab: {
        textLabel: tab.value
      }
    }*/

    this.activateTab(tab.label); 
    //this.tabSelectChangeHandler(evt);

    //if(tab.label == 'Disk'){ this.diskReportBuilderSetup() }
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

  /*fetchReportData(report:Report, identifier?: string){
    this.ws.call('reporting.get_data',[[
      {"name": report.name, "identifier":identifier}
    ]] ).subscribe((res)=> {
      if (res) {
        //console.log(res);
      }
    });
  }*/

}
