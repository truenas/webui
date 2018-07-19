import { Component, AfterViewInit, Input, ViewChild, OnChanges, OnDestroy } from '@angular/core';
<<<<<<< HEAD
import { CoreServiceInjector } from '../../../services/coreserviceinjector';
import { CoreService, CoreEvent } from '../../../services/core.service';
import { MaterialModule } from '../../../../appMaterial.module';
=======
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Router } from '@angular/router';
import { MaterialModule } from 'app/appMaterial.module';
>>>>>>> master
import { NgForm } from '@angular/forms';
import { ChartData } from '../../viewchart/viewchart.component';
import { ViewChartDonutComponent } from '../../viewchartdonut/viewchartdonut.component';

import { AnimationDirective } from '../../../directives/animation.directive';
import { WidgetComponent } from '../widget/widget.component';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

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

  public title:string = T("ZFS Pool");
  @Input() volumeData:VolumeData;
  public volumeName:string = "";
  public volumeId:number;
  public diskSets:any[][] = [[]];
  public disks: string[] = [];
  public diskDetails:Disk[] = [];
  public selectedDisk:number = -1;
  public gridCols:number = 8;
  public currentDiskSet:number = 0;
  private simulateDiskArray:number;
  @Input() configurable:boolean;

  constructor(public router: Router, public translate: TranslateService){
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
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolDisks"}).subscribe((evt:CoreEvent) => {
      if(evt.data.callArgs[0] == this.volumeData.id){

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
              //console.log("Set " + set);
            let modulo = i % 32;
            this.diskSets[set].push(this.disks[i]);
            if(modulo == 31){
              set++

              if(i < last){this.diskSets.push([]);}
              //console.log("New Set #" + set);
            }

          }
        
        if(evt.data.length > 0){
          this.setSelectedDisk(0);
        }
      }
    });


    this.core.register({observerClass:this,eventName:"StatsDiskTemp"}).subscribe((evt:CoreEvent) => {
      let data = evt.data.data.data;
      let temp: number;
      for(let i = data.length-1; i >= 0; i--){
        if(data[i][0]){
          temp = data[i][0];
          break;
        }
      }
      this.diskDetails[evt.data.callArgs[1]].temp = temp;
    });

    this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      this.dataRcvd = true;
      this.setDisksData(evt);
    });


    this.core.emit({name:"DisksInfoRequest"});
  }

  setDisksData(evt:CoreEvent){
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

  parseVolumeData(){
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

    let percentage = this.volumeData.used_pct.split("%");
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
    this.currentDiskSet = num;
    console.log("Selected Disk Set = " + String(this.currentDiskSet));
  }

}
