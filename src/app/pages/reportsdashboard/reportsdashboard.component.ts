import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import * as _ from 'lodash';
import {LineChartService, ChartConfigData, HandleChartConfigDataFunc} from '../../components/common/lineChart/lineChart.service';
import { Subject } from 'rxjs'; 
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';
import { PageEvent } from '@angular/material';
import { ErdService } from 'app/services/erd.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';

interface TabChartsMappingData {
  keyName: string;
  path: string;
  chartConfigData: ChartConfigData[];
  paginatedChartConfigData: ChartConfigData[]
}

@Component({
  selector: 'reportsdashboard',
  styleUrls: ['./reportsdashboard.scss'],
  templateUrl: './reportsdashboard.html',
  providers: [SystemGeneralService]
})
export class ReportsDashboardComponent implements OnInit, OnDestroy, HandleChartConfigDataFunc, AfterViewInit {


   // MdPaginator Inputs
   paginationLength = 0;
   paginationPageSize = 5;
   paginationPageSizeOptions = [5, 10, 20];
   paginationPageIndex = 0;
   paginationPageEvent: PageEvent;
   
   setPaginationPageSizeOptions(setPaginationPageSizeOptionsInput: string) {
     this.paginationPageSizeOptions = setPaginationPageSizeOptionsInput.split(',').map(str => +str);
   }
  
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

    /*custActions: any[] = [
      {
        id: 'create-theme-link',
        name: 'Create New Theme',
        eventName:"CreateTheme"
      }
    ]*/
  // End Report Builder Options

  public info: any = {};
  public ipAddress: any = [];
  public drawTabs = false;
  public tabChartsMappingDataArray: TabChartsMappingData[] = [];
  public tabChartsMappingDataSelected: TabChartsMappingData;
  public showSpinner: boolean = true;
  public activeTab: string;
  public filteredData: ChartConfigData[] = [];
  public filteredPaginatedData: ChartConfigData[] = [];
  public chartLayout = 'Grid'; // Defaults to grid layout
  //@ViewChild('chartWidth', { static: true}) chartWidth: MatButtonToggleGroup; 
  public isFooterConsoleOpen: boolean;
  @ViewChild('pager', { static: true}) pagerElement;
  
  


  constructor(private _lineChartService: LineChartService, private erdService: ErdService, 
    public translate: TranslateService, private router:Router, private core:CoreService, 
    protected ws: WebSocketService) {
  }

  setupSubscriptions(){
    this.target.subscribe((evt: CoreEvent) => {
      switch(evt.name){
        case 'FormSubmitted':
          console.log(evt);
          this.buildDiskReport(evt.data.devices, evt.data.metrics);
          this.setPaginationInfo(this.tabChartsMappingDataSelected, this.filteredData );
          //console.log(this.pagerElement);
          //this.pagerElement.getNumberOfPages();
          /*let list = Object.assign(this.tabChartsMappingDataSelected);
          list.chartConfigData = this.filteredData;
          this.setPaginationInfo(list);*/
        break;
        case 'ToolbarChanged':
          if(evt.data.devices && evt.data.metrics){
            this.buildDiskReport(evt.data.devices, evt.data.metrics);
            this.setPaginationInfo(this.tabChartsMappingDataSelected, this.filteredData );
          }
        break;
      }
    });

    this.target.next({name:"Refresh"});
  }

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
    let tab = this.tabChartsMappingDataArray.find(item => item.keyName == 'Disk');
    let devices = [];
    let deviceNames = [];
    let metrics = [];
    let metricNames = [];
    tab.chartConfigData.forEach((item) => {
      let obj = item.dataList[0];
      let src;
      if(obj.source.includes('disk-')){
        src = obj.source.replace('disk-', ''); 
      } else if(obj.source.includes('disktemp-')){
        src = obj.source.replace('disktemp-', '');
      }
      let dev = {label:src, value: src};
      if(!deviceNames.includes(src)){ 
        deviceNames.push(src);
        devices.push(dev);
      };

      let metric;
      let metricName;
      if(obj.type == 'temperature'){
        metricName = obj.type;
        metric = {label: obj.type, value: obj.type};
      } else {
        metricName = obj.type.replace('disk_', '');
        metric = {label: metricName, value: obj.type};
      }
      if(!metricNames.includes(metricName)){ 
        metricNames.push(metricName);
        metrics.push(metric);
      };

      //console.log(metric);
      //console.warn(this.diskMetrics)
      //metrics.push(metric);
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

  private setPaginationInfo(tabChartsMappingDataSelected: TabChartsMappingData, filteredConfigData?:ChartConfigData[]) {
    let paginationChartData: ChartConfigData[] = new Array();
    let sourceList = filteredConfigData ? filteredConfigData : tabChartsMappingDataSelected.chartConfigData;
    sourceList.forEach((item)=>{paginationChartData.push(item)});

    const beginIndex = this.paginationPageIndex * this.paginationPageSize;
    const endIndex = beginIndex + this.paginationPageSize ;
    if( beginIndex < paginationChartData.length && endIndex > paginationChartData.length ) {
      paginationChartData = paginationChartData.slice(beginIndex, paginationChartData.length);
    } else if( endIndex < paginationChartData.length ) {
      paginationChartData = paginationChartData.slice(beginIndex, endIndex);
    }

    if(filteredConfigData){
      this.filteredPaginatedData = paginationChartData; 
    } else {
      tabChartsMappingDataSelected.paginatedChartConfigData = paginationChartData; 
    }

    this.paginationLength = this.tabChartsMappingDataSelected.chartConfigData.length;
    
  }

  ngOnInit() { 
    this._lineChartService.getChartConfigData(/*this*/);

    this.core.register({observerClass: this, eventName:"CacheConfigData"}).subscribe((evt:CoreEvent) => {
      this.handleChartConfigDataFunc(evt.data);
    });

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

  }

  ngOnDestroy() {
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement("dashboardcontainerdiv"); 
    this.setupSubscriptions();
  }

  /**
   * The service returns back all sources as a flat list.  What I do in here is
   * Go through the flat list.. And collect the ones I want for each Tab I want to show.
   */
  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]) {
  
    const map: Map<string, TabChartsMappingData> = new Map<string, TabChartsMappingData>();

    // For every one of these map entries.. You see one tab in the UI With the charts collected for that tab
    map.set("CPU", {
      keyName: T("CPU"),
      path:"cpu",
      chartConfigData: [],
      paginatedChartConfigData: []

    });

    map.set("Disk", {
      keyName: T("Disk"),
      path:"disk",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Memory", {
      keyName: T("Memory"),
      path:"memory",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Network", {
      keyName: T("Network"),
      path:"network",
      chartConfigData: [],
      paginatedChartConfigData: []
    });


    map.set("Partition", {
      keyName: T("Partition"),
      path:"partition",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("System", {
      keyName: T("System"),
      path:"system",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Target", {
      keyName: T("Target"),
      path:"target",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("ZFS", {
      keyName: T("ZFS"),
      path:"zfs",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    // Go through all the items.. Sticking each source in the appropraite bucket
    // The non known buckets.. Just get one tab/one chart. (for now).. Will eventually 
    // move towards.. just knowing the ones I want.
    chartConfigData.forEach((chartConfigDataItem: ChartConfigData) => {
      if (chartConfigDataItem.title === "CPU" || chartConfigDataItem.title === "Load" || chartConfigDataItem.title.startsWith("cputemp-")) {
        const tab: TabChartsMappingData = map.get("CPU");
        tab.chartConfigData.push(chartConfigDataItem);
        // Clean up the title
        if(chartConfigDataItem.title.startsWith('cputemp-')){
          let spl = chartConfigDataItem.title.split("cputemp-");
          chartConfigDataItem.title = "CPU Temperature (cpu" + spl[1] + ")";
        } 

        if(chartConfigDataItem.title == "Load"){
          chartConfigDataItem.title = "CPU Load";
        }


      } else if (chartConfigDataItem.title.toLowerCase().startsWith("memory") || chartConfigDataItem.title.toLowerCase().startsWith("swap")) {
        const tab: TabChartsMappingData = map.get("Memory");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.toLowerCase() === "processes") {
        const tab: TabChartsMappingData = map.get("System");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("df-")) {
        const tab: TabChartsMappingData = map.get("Partition");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("disk")) {
        const tab: TabChartsMappingData = map.get("Disk");
        tab.chartConfigData.push(chartConfigDataItem);
        if(chartConfigDataItem.title.startsWith('disktemp-')){
          let spl = chartConfigDataItem.title.split("disktemp-");
          chartConfigDataItem.title = "Disk Temperature " + spl[1];
        } 

      } else if (chartConfigDataItem.title.startsWith("interface-")) {
        const tab: TabChartsMappingData = map.get("Network");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("SCSI ")) {
        const tab: TabChartsMappingData = map.get("Target");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("ZFS ")) {
        const tab: TabChartsMappingData = map.get("ZFS");
        tab.chartConfigData.push(chartConfigDataItem);

      } 
    });

    this.tabChartsMappingDataArray.splice(0, this.tabChartsMappingDataArray.length);
    map.forEach((value: TabChartsMappingData) => {

      if (this.tabChartsMappingDataSelected === undefined) {
        this.tabChartsMappingDataSelected = value;
        this.setPaginationInfo( this.tabChartsMappingDataSelected );
      }
      this.tabChartsMappingDataArray.push(value);
    });
  
        
    // Put CPU and Load charts before the temperature charts
    this.tabChartsMappingDataArray[0].chartConfigData.sort((a,b) => {return a.title > b.title ? 1 : -1;});
    //console.log(this.tabChartsMappingDataArray.length);

    this.drawTabs = true;
    this.showSpinner = false;
    this.activateTabFromUrl();
  }// End handleChartConfigDataFunc Method
  

  activeTabToKeyname(){
    if(this.activeTab){ return "false"}

    let subpath = this.router.url.split("/reportsdashboard/"); 
    let tabFound = this.tabChartsMappingDataArray.find((tab) =>{
      //return tab.keyName.toLowerCase() === subpath[1];
      return tab.path === subpath[1];
    });
    return tabFound.keyName;
  }

  activateTabFromUrl (){ 
    let subpath = this.router.url.split("/reportsdashboard/"); 
    let tabFound = this.tabChartsMappingDataArray.find((tab) =>{
      //return tab.keyName.toLowerCase() === subpath[1];
      return tab.path === subpath[1];
    });
    this.updateActiveTab(tabFound.keyName);
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

  buildDiskReport(device: string | string[], metric: string | string[]){
    // Convert strings to arrays
    if(typeof device == "string"){ device = [device];}
    if(typeof metric == "string"){ metric = [metric];}

    // Find matches
    const checkDevice = (item) => {
      if(device[0] == 'all' || device[0] == '*'){
        return true;
      } else {
        //return (item.dataList[0].source == 'disk-' + device || item.dataList[0].source == 'disktemp-' + device)
        return ( device.includes(item.dataList[0].source.replace('disk-', '')) || device.includes(item.dataList[0].source.replace('disktemp-', '')) );
      }
    }
    const checkMetric = (item) => {
      if(metric[0] == 'all' || metric[0] == '*'){
        return true;
      } else {
        return metric.includes(item.dataList[0].type)//item.dataList[0].type == metric;
      }
    }

    let tab = this.tabChartsMappingDataArray.find(item => item.keyName == 'Disk');
    let tabData = tab.chartConfigData.filter(item => (checkDevice(item) && checkMetric(item)) ); 
    this.filteredData = tabData;

    //TEST
    //this.paginationLength = this.filteredData.length;
  }

  updateActiveTab(tabName:string){
    
    // Change the URL without reloading page/component
    // the old fashioned way 
    window.history.replaceState({}, '','/reportsdashboard/' + tabName.toLowerCase());

    let pseudoRouteEvent = [
      {
        url: "/reportsdashboard/" + tabName.toLowerCase(),
        title:"Reporting",
        breadcrumb:"Reporting",
        disabled:true
      },
      {
        url: "", //"/reportsdashboard/" + tabName.toLowerCase(),
        title: tabName,
        breadcrumb: tabName,
        disabled:true
      }
    ]
    

    this.core.emit({name: "PseudoRouteChange", data: pseudoRouteEvent});

    // Simulate tab eventl
    let evt = {
      tab: {
        textLabel: tabName
      }
    }
    this.activeTab = tabName.toLowerCase(); 
    this.tabSelectChangeHandler(evt);

    if(tabName == 'Disk'){ this.diskReportBuilderSetup() }
  }

  navigateToTab(tabName){
    const link = '/reportsdashboard/' + tabName.toLowerCase()
    this.router.navigate([link]);
  }

  tabSelectChangeHandler($event) {
    const selectedTabName: string = $event.tab.textLabel;
    this.tabChartsMappingDataSelected = this.getTabChartsMappingDataByName(selectedTabName);
    this.paginationPageIndex = 0;
    this.paginationPageSize = 5;
 
    if(this.activeTab == 'disk'){ 
      this.setPaginationInfo(this.tabChartsMappingDataSelected, this.filteredData );
    } else {
      this.setPaginationInfo(this.tabChartsMappingDataSelected );
    }
    
  }
  
  paginationUpdate($pageEvent: PageEvent) {
   
    this.paginationPageEvent = $pageEvent;
    this.paginationPageIndex = this.paginationPageEvent.pageIndex;
    this.paginationPageSize = this.paginationPageEvent.pageSize;
    if(this.activeTab == 'disk'){ 
      this.setPaginationInfo(this.tabChartsMappingDataSelected, this.filteredData );
    } else {
      this.setPaginationInfo(this.tabChartsMappingDataSelected );
    }
    
  }


  private getTabChartsMappingDataByName(name: string): TabChartsMappingData {
    let foundTabChartsMappingData: TabChartsMappingData = null;

    for (const item of this.tabChartsMappingDataArray) {
      //fixme: using keynames for tab values is stupid and doesn't work well with translations
      if (foundTabChartsMappingData !== null) {
        break;
      }
      this.translate.get(item.keyName).subscribe((keyName) => {
        if (name === keyName) {
          foundTabChartsMappingData = item;
        }
      });
    }
    return foundTabChartsMappingData;
  }

  setChartLayout(value:string){
    this.chartLayout = value; 
  }

}
