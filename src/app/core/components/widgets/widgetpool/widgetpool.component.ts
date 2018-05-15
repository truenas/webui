import { Component, AfterViewInit, Input, ViewChild, OnChanges, OnDestroy } from '@angular/core';
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
  name: string;
  smart_enabled: boolean;
  size: number;
  description?: string;
  enclosure_slot?: any;
  expiretime?: any;
  hddstandby?: string;
  serial?: string;
  smartoptions?: string;
  temp?: number;
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

  @ViewChild('zvol') chartZvol:ViewChartDonutComponent;
  public title:string = "Pool";
  //public standalone:boolean = false;
  @Input() volumeData:VolumeData;
  public volumeName:string = "";
  public volumeId:number;
  public diskSets:any[][] = [[]];
  public disks: string[] = [];
  public diskDetails:Disk[] = [];
  public selectedDisk:number = -1;
  public gridCols:number = 4;
  public currentDiskSet:number = 0;
  //public _slideProps:any = {x:0,y:0};
  @Input() configurable:boolean;

  constructor(){
    super();
  }

  ngOnChanges(changes){
    if(changes.volumeData){
      //DEBUG: console.log("**** WidgetVolumeComponent Changes detected ****");
      this.parseVolumeData();
    }
  }

  ngOnDestroy(){
    //this.core.emit({name:"StatsRemoveListener", data:{name:"DiskTemp",obj:this}});
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      //this.parseVolumeData(evt);
    });

    this.core.register({observerClass:this,eventName:"PoolDisks"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      if(evt.data.callArgs[0] == this.volumeData.id){
        //DEBUG: console.log("**** WidgetVolumeComponent DISKS ****");
        //DEBUG: console.log(evt.data);
        // Simulate massive array
        for(let i = 0; i < 1; i++){
          //this.disks.push("ada" + i);
        }
        this.disks = evt.data.data;

        if(this.disks.length > 16){
          this.gridCols = 8;
        }
        
        if(this.disks.length > 32){
          let total = Math.ceil(this.disks.length/32);
          let set = 0;
          let last = 32*total-1
          for(let i = 0; i < (32*total); i++ ){
              //console.log("Set " + set);
            let modulo = i % 32;
            this.diskSets[set].push(this.disks[i]);
            if(modulo == 31){
              set++

              if(i < last){this.diskSets.push([]);}
              //console.log("New Set #" + set);
            }

          }
        } else {
          this.diskSets[0] = this.disks;
        }
        //DEBUG: console.log(this.diskSets);
        
        if(evt.data.length > 0){
          this.setSelectedDisk(0);
        }
      }
    });

    /*this.core.register({observerClass:this,eventName:"StatsDiskTemp"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      let data = evt.data.data.data;
      let temp: number;
      for(let i = data.length-1; i >= 0; i--){
        if(data[i][0]){
          temp = data[i][0];
          break;
        }
      }
      // Test hot temps
      //temp = 64;
      this.diskDetails[evt.data.callArgs[1]].temp = temp;
    });*/

    this.core.register({observerClass:this,eventName:"StatsDiskTemp"}).subscribe((evt:CoreEvent) => {
      let data = evt.data.data.data;
      let temp: number;
      for(let i = data.length-1; i >= 0; i--){
        if(data[i][0]){
          temp = data[i][0];
          break;
        }
      }
      // Test hot temps
      //temp = 64;
      this.diskDetails[evt.data.callArgs[1]].temp = temp;
    });

    this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      this.setDisksData(evt);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartZvol.refresh();
    });

    //this.core.emit({name:"PoolDataRequest"});
    this.core.emit({name:"DisksInfoRequest"});
    //this.core.emit({ name:"StatsAddListener", data:{ name:"DiskTemp", obj:this} });
  }

  setDisksData(evt:CoreEvent){
    //DEBUG: console.log("******** DISKS INFO ********");
    //DEBUG: console.log(evt);
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
        smartoptions: evt.data[i].smartoptions,
        temp:0
      }
    
      this.diskDetails.push(disk);
    }
  }

  /*get slideProps(){
    return this._slideProps;
  }

  set slideProps(num){
    let slideW = 100/this.diskSets.length;
    let origin = this.currentDiskSet;
    let destination = num;
    //DEBUG: console.log("Origin = " + origin + " && destination = " + destination);
    this._slideProps = {x:String((origin-destination)*slideW) + '%'}
    //this._slideProps = {x:String(destination*-1) + '%'}
    //DEBUG: console.warn(this._slideProps);
  }*/

  parseVolumeData(){
    //DEBUG: console.log("******** PARSING VOLUME DATA ********");
    //DEBUG: console.log(this.volumeData);
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

    this.chartZvol.units = 'GB';
    this.chartZvol.title = this.volumeData.name;
    this.chartZvol.data = [used,available];
    let percentage = this.volumeData.used_pct.split("%");
    /*this.chartZvol.data = [{ 
      legend: this.volumeData.vol_name,
      data:[Number(percentage[0])]
    }];*/
    //DEBUG: console.log(this.chartZvol.data);
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
      //this.selectedDisk = index;
      for(let i = 0; i < this.diskDetails.length; i++){
        if(this.diskDetails[i].name == this.disks[index]){
          this.selectedDisk = i;
          this.core.emit({name:"StatsDiskTempRequest", data:[this.diskDetails[i].name, i] });
        }
      }
    } else {
      this.selectedDisk = -1;
    }

  }

  setCurrentDiskSet(num:number){
    //this.slideProps = num;
    this.currentDiskSet = num;
    //console.log("Selected Disk Set = " + String(this.currentDiskSet));
  }

}
