import { Component, AfterViewInit, Input, ViewChild, OnChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
//import { MaterialModule } from 'app/appMaterial.module';
//import { NgForm } from '@angular/forms';
//import { ChartData } from 'app/core/components/viewchart/viewchart.component';
//import { AnimationDirective } from 'app/core/directives/animation.directive';
import { WidgetPoolComponent, Disk, VolumeData } from 'app/core/components/widgets/widgetpool/widgetpool.component';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

/*
interface Disk {
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
*/
@Component({
  selector: 'widget-storage-collection',
  templateUrl:'./widgetstoragecollection.component.html',
  styleUrls: ['./widgetstoragecollection.component.css'],
})
export class WidgetStorageCollectionComponent extends WidgetComponent implements AfterViewInit, OnChanges {

  public title:string = "Storage";
  @Input() widgetFlex:string;
  @Input() collectionLayout:string;
  public volumes: VolumeData[] = [];
  public disks:Disk[] = [];

  constructor(public translate: TranslateService){
    super(translate);
  }

  ngOnChanges(changes){
    console.log(changes);
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"PoolData"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setPoolData(evt);
    });

    this.core.register({observerClass:this,eventName:"DisksInfo"}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.setDisksData(evt);
    });

    this.core.emit({name:"PoolDataRequest"});
    this.core.emit({name:"DisksInfoRequest"});
  }

  setDisksData(evt:CoreEvent){
    console.log("******** DISKS INFO ********");
    console.log(evt);
    for(let i in evt.data){
      let disk:Disk = {
        name:evt.data[i].name,
        smart_enabled:evt.data[i].togglesmart,
        size:Number(evt.data[i].size),
        model: evt.data[i].model,
        description: evt.data[i].description,
        enclosure_slot: evt.data[i].enclosure_slot,
        expiretime: evt.data[i].expiretime,
        hddstandby: evt.data[i].hddstandby,
        serial: evt.data[i].serial,
        smartoptions: evt.data[i].smartoptions
      }

      this.disks.push(disk);
    }
  }

  setPoolData(evt:CoreEvent){
    console.log("******** ZPOOL DATA ********");
    console.log(evt.data);
    for(let i in evt.data){
      let zvol = {
        avail: evt.data[i].avail,
        id:evt.data[i].id,
        is_decrypted:evt.data[i].is_decrypted,
        is_upgraded:evt.data[i].is_upgraded,
        mountpoint:evt.data[i].mountpoint,
        name:evt.data[i].name,
        status:evt.data[i].status,
        used:evt.data[i].used,
        used_pct:evt.data[i].used_pct,
        vol_encrypt:evt.data[i].vol_encrypted,
        vol_encryptkey:evt.data[i].vol_encryptkey,
        vol_guid:evt.data[i].vol_guid,
        vol_name:evt.data[i].vol_name
      }

      this.volumes.push(zvol);
    }
  }

}
