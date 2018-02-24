import { Component, AfterViewInit, Input, ViewChild, OnChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';

import { AnimationDirective } from 'app/core/directives/animation.directive';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import filesize from 'filesize';

export interface Disk {
  name:string;
  smart_enabled:boolean;
  size:number;
  description?:string;
  enclosure_slot?: any;
  expiretime?: any;
  hddstandby?: string;
  serial?:string;
  smartoptions?:string
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
export class WidgetPoolComponent extends WidgetComponent implements AfterViewInit, OnChanges {

  @ViewChild('zvol') chartZvol:ViewChartDonutComponent;
  public title:string = "Pool";
  //public standalone:boolean = false;
  @Input() volumeData:VolumeData;
  public volumeName:string = "";
  public volumeId:number;
  public disks: string[] = [];
  //public diskDetails:Disk[] = [];
  public selectedDisk:number = -1;
  public gridCols:number = 4;
  @Input() configurable:boolean;

  constructor(){
    super();
  }

  ngOnChanges(changes){
    if(changes.volumeData){
      console.log("**** WidgetVolumeComponent Changes detected ****");
      this.parseVolumeData();
    }
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      //this.parseVolumeData(evt);
    });

    this.core.register({observerClass:this,eventName:"PoolDisks"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      if(evt.sender[0] == this.volumeData.id){
        console.log("**** WidgetVolumeComponent DISKS ****");
        console.log(evt.data);
        // Simulate massive array
        for(let i = 0; i < 90; i++){
          this.disks.push("ada" + i);
        }
        //this.disks = evt.data;

        if(this.disks.length > 16){
          this.gridCols = 8;
        }
      }
    });

    /*this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      //this.setDisksData(evt);
    });*/

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartZvol.refresh();
    });

    //this.core.emit({name:"PoolDataRequest"});
    //this.core.emit({name:"DisksInfoRequest"});
  }

  /*setDisksData(evt:CoreEvent){
    console.log("******** DISKS INFO ********");
    console.log(evt);
    for(let i in evt.data){
      let disk:Disk = {
        name:evt.data[i].name,
        smart_enabled:evt.data[i].togglesmart,
        size:Number(evt.data[i].size),
        description: evt.data[i].description,
        enclosure_slot: evt.data[i].enclosure_slot,
        expiretime: evt.data[i].expiretime,
        hddstandby: evt.data[i].hddstandby,
        serial: evt.data[i].serial,
        smartoptions: evt.data[i].smartoptions
      }

      this.diskDetails.push(disk);
    }
  }*/

  /*get volumeData(){
    return this._volumeData;
  }

  set volumeData(vd:VolumeData){
    this._volumeData = vd;
    this.parseVolumeData();
  }*/

  parseVolumeData(){
    console.log("******** PARSING VOLUME DATA ********");
    console.log(this.volumeData);
    let usedObj = (<any>window).filesize(this.volumeData.used, {output: "object", exponent:3});
    let used: ChartData = {
      legend: 'Used', 
      data: [usedObj.value]
    };

    let  availableObj = (<any>window).filesize(this.volumeData.avail, {output: "object", exponent:3});
    let available: ChartData = {
      legend:'Available', 
      data: [availableObj.value]
    };

    this.chartZvol.units = '%';
    this.chartZvol.title = this.volumeData.name;
    this.chartZvol.data = [used,available];
    let percentage = this.volumeData.used_pct.split("%");
    /*this.chartZvol.data = [{ 
      legend: this.volumeData.vol_name,
      data:[Number(percentage[0])]
    }];*/
    console.log(this.chartZvol.data);
    this.chartZvol.width = this.chartSize;
    this.chartZvol.height = this.chartSize;

    this.core.emit({name:"PoolDisksRequest",data:[this.volumeData.id]});
  };

  setPreferences(form:NgForm){
    let filtered: string[] = [];
    for(let i in form.value){
      if(form.value[i]){
        filtered.push(i);
      }
    }
  }

  setSelectedDisk(index?:number){
    if(index >= 0){
      this.selectedDisk = index;
    } else {
      this.selectedDisk = -1;
    }
  }

}
