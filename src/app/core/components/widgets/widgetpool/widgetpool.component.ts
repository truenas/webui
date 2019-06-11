import { Component, AfterViewInit, Input, ViewChild, OnChanges, OnDestroy } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Router } from '@angular/router';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { StorageService } from '../../../../services/storage.service'

import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

interface PoolDiagnosis {
  isHealthy: boolean;
  warnings: string[];
  errors: string[];
  selector: string;
  level: string;
}

export interface Disk {
  name: string;
  smart_enabled: boolean;
  size: number;
  model: string;
  description?: string;
  enclosure_slot?: any;
  expiretime?: any;
  hddstandby?: string;
  serial?: string;
  smartoptions?: string;
  temp?: number;
  displaysize?: string;
}

export interface VolumeData {
  avail:number;
  id:number;
  is_decrypted:boolean;
  is_upgraded:boolean;
  mountpoint:string;
  name:string;
  status:string;
  used:number;
  used_pct:string;
  vol_encrypt:number;
  vol_encryptkey:string;
  vol_guid:string;
  vol_name:string;
}

@Component({
  selector: 'widget-pool',
  templateUrl:'./widgetpool.component.html',
  styleUrls: ['./widgetpool.component.css'],
})
export class WidgetPoolComponent extends WidgetComponent implements AfterViewInit, OnChanges, OnDestroy {

  public loader:boolean = false;
  private _dataRcvd:boolean = false;
  get dataRcvd(){
    return this._dataRcvd;
  }
  set dataRcvd(val){
    this._dataRcvd = val;
    if(this.loader){
      this.loader = false;
    }
  }
  public voldataavail = false;

  public title:string = T("ZFS Pool");
  @Input() volumeData:VolumeData;
  public volumeName:string = "";
  public volumeId:number;
  public volumeHealth: PoolDiagnosis = {
    isHealthy: true,
    warnings: [],
    errors: [],
    selector: "fn-theme-green",
    level: "safe"
  };
  public diskSets:any[][] = [[]];
  public disks: string[] = [];
  public diskDetails:Disk[] = [];
  public selectedDisk:number = -1;
  public gridCols:number = 8;
  public currentDiskSet:number = 0;
  private simulateDiskArray:number;
  public displayValue: any;
  public diskSize: any;
  public diskSizeLabel: string;
  @Input() configurable:boolean;

  constructor(public router: Router, public translate: TranslateService, public storage: StorageService){
    super(translate);
    setTimeout(() => {
        if(!this.dataRcvd){
          this.loader = true;
        }
    }, 5000);
  }

  ngOnChanges(changes){
    if(changes.volumeData){
      this.parseVolumeData();
    }
  }

  ngOnDestroy(){
    //this.core.emit({name:"StatsRemoveListener", data:{name:"Pool",obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolDisks" + this.volumeData.id}).subscribe((evt:CoreEvent) => {
      //if(evt.data.callArgs[0] == this.volumeData.id){
        // Simulate massive array
        //this.simulateDiskArray = 600;
        if(this.simulateDiskArray){
          for(let i = 0; i < this.simulateDiskArray; i++){
            this.disks.push("ada" + i);
          }
        } else {
          this.disks = evt.data.data;
        }

          let total = Math.ceil(this.disks.length/32);
          let set = 0;
          let last = 32*total-1
          for(let i = 0; i < (32*total); i++ ){
            let modulo = i % 32;
            this.diskSets[set].push(this.disks[i]);
            if(modulo == 31){
              set++

              if(i < last){this.diskSets.push([]);}
            }

          }

          if(this.disks.length > 0){
            this.storage.diskNameSort(this.disks);
          } 
      //}
    });


    this.core.register({observerClass:this,eventName:"StatsDiskTemp"}).subscribe((evt:CoreEvent) => {
      let data = [];
      let temp = 0;
      if (evt.data && evt.data.data && evt.data.data.data) {
        data = evt.data.data.data;
        for(let i = data.length-1; i >= 0; i--){
          if(data[i][0]){
            temp = data[i][0];
            break;
          }
        }
        this.diskDetails[evt.data.callArgs[1]].temp = temp;
      }
    });

    this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      this.setDisksData(evt);
      this.dataRcvd = true;
    });


    this.core.emit({name:"DisksInfoRequest"});
  }

  setDisksData(evt:CoreEvent){
    for(const i in evt.data){
      const disk:Disk = {
        name:evt.data[i].name,
        smart_enabled:evt.data[i].togglesmart,
        size:Number(evt.data[i].size),
        description: evt.data[i].description,
        model: evt.data[i].model,
        enclosure_slot: evt.data[i].enclosure_slot,
        expiretime: evt.data[i].expiretime,
        hddstandby: evt.data[i].hddstandby,
        serial: evt.data[i].serial,
        smartoptions: evt.data[i].smartoptions,
        temp:0,
        displaysize: (<any>window).filesize(Number(evt.data[i].size), {standard: "iec"})
      }
    
      this.diskDetails.push(disk);
    }

    if (this.diskDetails.length > 0 && this.disks.length > 0) {
      this.setSelectedDisk(this.disks[0]);
    }
    
    /*console.log(evt.data)
    if(evt.data.length > 0){
      this.setSelectedDisk(Number(0));
    }
    //console.log(this.selectedDisk)*/
  }

  parseVolumeData(){
    let usedValue;
    if (isNaN(this.volumeData.used)) {
      usedValue = this.volumeData.used;
    } else {
      let usedObj = (<any>window).filesize(this.volumeData.used, {output: "object", exponent:3});
      usedValue = usedObj.value;
    }
    let used: ChartData = {
      legend: 'Used', 
      data: [usedValue]
    };

    if(usedValue == "Locked"){
      // When Locked, Bail before we try to get details. 
      // (errors start after this...)
      return 0;
    }

    let availableValue;
    if (isNaN(this.volumeData.avail)) {
      availableValue = this.volumeData.avail;
    } else {
      let availableObj = (<any>window).filesize(this.volumeData.avail, {output: "object", exponent:3});
      availableValue = availableObj.value;
      this.voldataavail = true;
    }
    let available: ChartData = {
      legend:'Available', 
      data: [availableValue]
    };

    let percentage = this.volumeData.used_pct.split("%");
    this.core.emit({name:"PoolDisksRequest",data:[this.volumeData.id]});

    this.displayValue = (<any>window).filesize(this.volumeData.avail, {standard: "iec"});
    if (this.displayValue.slice(-2) === ' B') {
      this.diskSizeLabel = this.displayValue.slice(-1);
      this.diskSize = new Intl.NumberFormat().format(parseFloat(this.displayValue.slice(0, -2)))
    } else {
      this.diskSizeLabel = this.displayValue.slice(-3);
      this.diskSize = new Intl.NumberFormat().format(parseFloat(this.displayValue.slice(0, -4)))
    }
    // Adds a zero to numbers with one (and only one) digit after the decimal
    if (this.diskSize.charAt(this.diskSize.length - 2) === '.' || this.diskSize.charAt(this.diskSize.length - 2) === ',') {
      this.diskSize = this.diskSize.concat('0')
    };

    this.checkVolumeHealth();
  };

  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

  setSelectedDisk(disk?: any){
    if(disk){
      for(let i = 0; i < this.diskDetails.length; i++){
        if(this.diskDetails[i].name === disk){
          this.selectedDisk = i;
          this.core.emit({name:"StatsDiskTempRequest", data:[this.diskDetails[i].name, i] });
        } 
      }
    } else {
      this.selectedDisk = -1; 
    }
  }

  setCurrentDiskSet(num:number){
    this.currentDiskSet = num;
  }

  checkVolumeHealth(){
    switch(this.volumeData.status){
      case "HEALTHY":
        break;
      case "LOCKED":
        this.updateVolumeHealth("Pool status is " + this.volumeData.status, false, 'locked');
        break;
      case "UNKNOWN":
      case "OFFLINE":
        this.updateVolumeHealth("Pool status is " + this.volumeData.status, false, 'unknown');
        break;
      case "DEGRADED":
        this.updateVolumeHealth("Pool status is " + this.volumeData.status, false, 'degraded');
        break
      case "FAULTED":
      case "REMOVED":
        this.updateVolumeHealth("Pool status is " + this.volumeData.status, true, 'faulted');
        break;
    }
  }

  updateVolumeHealth(symptom: string, isCritical?: boolean, condition?: string){
    if(isCritical){
      this.volumeHealth.errors.push(symptom);
    } else {
      this.volumeHealth.warnings.push(symptom);
    }
    if(this.volumeHealth.isHealthy){
      this.volumeHealth.isHealthy = false;
    }

    if(this.volumeHealth.errors.length > 0){
      this.volumeHealth.level = "error"
    } else if(this.volumeHealth.warnings.length > 0){
      this.volumeHealth.level = "warn"
    } else {
      this.volumeHealth.level = "safe"
    }

    if (condition === 'locked') {
      this.volumeHealth.selector = "fn-theme-yellow"
    } else if (condition === 'unknown') {
      this.volumeHealth.selector = "fn-theme-blue"
    } else if (condition === 'degraded') {
      this.volumeHealth.selector = "fn-theme-orange"
    } else if (condition === 'faulted') {
      this.volumeHealth.selector = "fn-theme-red"
    } else {
      this.volumeHealth.selector = "fn-theme-green"
    }
  }
  

}
