import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import * as _ from 'lodash';
//import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from '../../components/common/lineChart/lineChart.service';
import { Subject } from 'rxjs'; 
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';

//import { PageEvent } from '@angular/material';
import { ErdService } from 'app/services/erd.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';

export interface Report {
  identifiers?: string[];
  name: string;
  title: string;
  vertical_label: string;
  isRendered?: boolean[];
}

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

  public isFooterConsoleOpen;

  public diskReports: Report[];
  public otherReports: Report[];
  public activeReports: Report[] = [];

  public activeTab: string = "CPU"; // Tabs (lower case only): CPU, Disk, Memory, Network, NFS, Partition?, System, Target, UPS, ZFS
  public allTabs: Tab[] = [];

  public visibleReports:number[] = [];
  public totalVisibleReports:number = 5;

  constructor(private erdService: ErdService, 
    public translate: TranslateService, private router:Router, private core:CoreService, 
    protected ws: WebSocketService) {
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

    this.ws.call('reporting.graphs').subscribe((res)=> {
      if (res) {
        let allReports = res.map((report) => {
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

        this.fetchReportData(this.otherReports[0]);
      }
    });

  }

  ngOnDestroy() {
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

  generateTabs(){
      let labels = ['CPU', 'Disk', 'Memory', 'Network', 'NFS', 'Partition', 'System', 'Target', 'UPS', 'ZFS'];
      labels.forEach((item) =>{
        this.allTabs.push({label:item, value:item.toLowerCase()});
      })
  }

  initReportVisbility(total:number){
    let result = [];
    for(let i = 0; i < total; i++){
      result.push(i);
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
    console.log(this.activeReports);
    console.log(this.visibleReports);
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
   
    console.log("FLATTENED!");
    console.log(list);
    console.log(result);
    this.fetchReportData(result[0], result[0].identifiers[0]);
    return result;
  }

  fetchReportData(report:Report, identifier?: string){
    console.warn(identifier);
    this.ws.call('reporting.get_data',[[
      {"name": report.name, "identifier":identifier}
    ]] ).subscribe((res)=> {
      if (res) {
        console.log(res);
      }
    });
  }

}
