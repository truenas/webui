import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Display } from 'app/core/components/display/display.component';
import { ViewControllerComponent, ViewConfig, ViewControllerMetadata } from 'app/core/components/viewcontroller/viewcontroller.component';
//import { CardComponentMetadata } from 'app/core/components/card/card.component';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';

//import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import {CardComponent, CardComponentMetadata} from 'app/core/components/card/card.component';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

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

@Component({
  selector: 'widget-storage',
  //templateUrl:'./widgetstorage.component.html',
  template:ViewControllerMetadata.template,
  styleUrls: ['./widgetstorage.component.css'],
})
export class WidgetStorageComponent extends ViewControllerComponent implements AfterViewInit {

  //@ViewChild('zpool', { static: true}) chartZpool:ViewChartDonutComponent;
  private chartZpool;
  public chartSize:number;
  public title:string = T("Storage");
  public disks:Disk[] = [];
  public selectedDisk:number = -1

  constructor(public translate: TranslateService){
    super();
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

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe(() => {
      this.chartZpool.refresh();
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

    let card = this.create(CardComponent);
    this.chartZpool = card.create(ViewChartDonutComponent);

    let usedObj = (<any>window).filesize(evt.data[0].used, {output: "object", exponent:3});
    let used: ChartData = {
      legend: 'Used',
      data: [usedObj.value]
    };

    let  availableObj = (<any>window).filesize(evt.data[0].avail, {output: "object", exponent:3});
    let available: ChartData = {
      legend:'Available',
      data: [availableObj.value]
    };

    this.chartZpool.units = 'GiB';
    this.chartZpool.title = 'Zpool';
    this.chartZpool.data = [used,available];
    console.log(this.chartZpool.data);
    this.chartZpool.width = this.chartSize;
    this.chartZpool.height = this.chartSize;

    card.addChild(this.chartZpool);
    card.header = true;
    card.headerTitle = this.title;
    this.addChild(card);
    this.chartZpool.render();
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
