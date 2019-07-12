import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, Renderer2, ElementRef,TemplateRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { environment } from 'app/../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

import {
  tween,
  styler,
  listen,
  pointer,
  value,
  decay,
  spring,
  physics,
  easing,
  everyFrame,
  keyframes,
  timeline,
  //velocity,
  multicast,
  action,
  transform,
  //transformMap,
  //clamp
  } from 'popmotion';

interface NetIfInfo {
  name:string;
  primary:string;
  aliases?: string;
}

interface NetTraffic {
  "KB/s in": string;
  "KB/s out": string;
  name: string;
}

interface Slide {
  name: string;
  index?: string;
  dataSource?: any;
  template: TemplateRef<any>;
}

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

@Component({
  selector: 'widget-pool',
  templateUrl:'./widgetpool.component.html',
  styleUrls: ['./widgetpool.component.css']
})
export class WidgetPoolComponent extends WidgetComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy, OnChanges {

  @Input() poolState;
  @ViewChild('carousel', {static:true}) carousel:ElementRef;
  @ViewChild('carouselparent', {static:true}) carouselParent:ElementRef;

  @ViewChild('overview', {static:false}) overview:TemplateRef<any>;
  @ViewChild('topology', {static:false}) topology:TemplateRef<any>;
  @ViewChild('disks', {static:false}) disks:TemplateRef<any>;
  @ViewChild('disk_details', {static:false}) disk_details:TemplateRef<any>;
  @ViewChild('empty', {static:false}) empty:TemplateRef<any>;
  public templates:any;
  public tpl = this.overview;

  // NAVIGATION
  public currentSlide:string = "0";

  get currentSlideIndex(){
    return parseInt(this.currentSlide);
  }
  
  get currentSlideName(){
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(){
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  path: Slide[] = [];

  public title: string = this.poolState ? this.poolState.name : "Pool";

  public poolHealth: PoolDiagnosis = {
    isHealthy: true,
    warnings: [],
    errors: [],
    selector: "fn-theme-green",
    level: "safe"
  };

  public currentMultipathDetails: any;
  public currentDiskDetails:Disk;
  get currentDiskDetailsKeys(){
    return this.currentDiskDetails ? Object.keys(this.currentDiskDetails) : [];
  }
  

  constructor(public router: Router, public translate: TranslateService){
    super(translate);
    this.configurable = false;
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes.nicState){
      this.title = this.poolState.name;
    }
  }

  ngOnInit(){

    this.core.emit({name:"NetInfoRequest"});
    
    //Get Network info and determine Primary interface
    this.core.register({observerClass:this,eventName:"NetInfo"}).subscribe((evt:CoreEvent) => {
    });

    this.core.register({observerClass:this, eventName:"NicInfo"}).subscribe((evt:CoreEvent) => {
    });

  }

  ngAfterViewChecked(){
    
  }

  ngAfterViewInit(){
    this.templates = {
      overview: this.overview,
      topology: this.topology,
      disks: this.disks,
      empty: this.empty,
      'disk details': this.disk_details
    }
      console.log(this.templates);

    this.path = [
      { name: "overview",template: this.overview},
      { name: "empty", template: this.empty},
      { name: "empty", template: this.empty},
      { name: "empty", template: this.empty}
    ];

    this.core.register({observerClass:this,eventName:"MultipathData"}).subscribe((evt:CoreEvent) => {
      this.currentMultipathDetails = evt.data[0];
      console.log(this.currentMultipathDetails);
      const activeDisk = evt.data[0].children.filter(prop => prop.status == "ACTIVE");
      this.core.emit({name:"DisksRequest", data:[[["name", "=", activeDisk[0].name]]]});
    });

    this.core.register({observerClass:this,eventName:"DisksData"}).subscribe((evt:CoreEvent) => {
      delete evt.data[0].enclosure;
      delete evt.data[0].name;
      delete evt.data[0].devname;
      delete evt.data[0].multipath_name;
      delete evt.data[0].multipath_member;
      this.currentDiskDetails = evt.data[0];
    });
  }

  getDiskDetails(key:string, value:string, isMultipath?:boolean){
    if(isMultipath && key == 'name'){
     
      let v = "multipath/" + this.checkMultipathLabel(value);
      this.core.emit({name:"MultipathRequest", data:[[[key, "=", v]]]});
    
    } else if(!isMultipath) {

      delete this.currentMultipathDetails
      this.core.emit({name:"DisksRequest", data:[[[key, "=", value]]]});

    } else {
      console.warn("If this is a multipath disk, you must query by name!")
    }
  }

  checkMultipathLabel(name){
    const truth = this.checkMultipath(name);
    let diskName = name;
    if(truth){

      let str = name.replace("multipath/","");
      let spl = str.split("p");
      diskName = spl[0];
    }
    return diskName;
  }

  checkMultipath(name:string){
    const truth = name.startsWith("multipath/");
    return truth;
  }

  updateSlide(name:string,verified: boolean, slideIndex:number, dataIndex?: number, dataSource?:any){
    if(name !=="overview" && !verified){ return; }
    const direction = parseInt(this.currentSlide) < slideIndex ? 'forward' : 'back';
    if(direction == 'forward'){
      // Setup next path segment
      let slide: Slide = {
        name: name,
        index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null,
        dataSource: typeof dataSource !== 'undefined' ? dataSource : null,
        template: this.templates[name]
      }
  
      this.path[slideIndex] = slide;
    } else if(direction == 'back'){
      // empty the path segment
      this.path[parseInt(this.currentSlide)] = { name: "empty", template: this.empty}
    }

    if(name == 'disks'){
      console.log(this.path);
      console.log('name:' + name + ', verified: ' + verified + ', slideIndex: ' + slideIndex + ', dataIndex: ' + dataIndex + ', dataSource: ' + dataSource);
    }

    this.updateSlidePosition(slideIndex);
  }

  updateSlidePosition(value){
    if(value.toString() == this.currentSlide){ return; }
    let el = styler(this.carouselParent.nativeElement.querySelector('.carousel'));
    const startX = (parseInt(this.currentSlide) * 600) * -1;
    const endX = (value * 600) * -1;
    tween({
      from:{ x: startX },
      to:{ x: endX },
      duration: 250
    }).start(el.set);
    
    this.currentSlide = value.toString();
    //console.log(this.path[this.currentSlideIndex].name);
    
  }

  checkVolumeHealth(){
    switch(this.poolState.status){
      case "HEALTHY":
        break;
      case "LOCKED":
        this.updateVolumeHealth("Pool status is " + this.poolState.status, false, 'locked');
        break;
      case "UNKNOWN":
      case "OFFLINE":
        this.updateVolumeHealth("Pool status is " + this.poolState.status, false, 'unknown');
        break;
      case "DEGRADED":
        this.updateVolumeHealth("Pool status is " + this.poolState.status, false, 'degraded');
        break
      case "FAULTED":
      case "REMOVED":
        this.updateVolumeHealth("Pool status is " + this.poolState.status, true, 'faulted');
        break;
    }
  }

  updateVolumeHealth(symptom: string, isCritical?: boolean, condition?: string){
    if(isCritical){
      this.poolHealth.errors.push(symptom);
    } else {
      this.poolHealth.warnings.push(symptom);
    }
    if(this.poolHealth.isHealthy){
      this.poolHealth.isHealthy = false;
    }

    if(this.poolHealth.errors.length > 0){
      this.poolHealth.level = "error"
    } else if(this.poolHealth.warnings.length > 0){
      this.poolHealth.level = "warn"
    } else {
      this.poolHealth.level = "safe"
    }

    if (condition === 'locked') {
      this.poolHealth.selector = "fn-theme-yellow"
    } else if (condition === 'unknown') {
      this.poolHealth.selector = "fn-theme-blue"
    } else if (condition === 'degraded') {
      this.poolHealth.selector = "fn-theme-orange"
    } else if (condition === 'faulted') {
      this.poolHealth.selector = "fn-theme-red"
    } else {
      this.poolHealth.selector = "fn-theme-green"
    }
  }

  nextPath(obj:any, index:number|string){
    if(typeof index == 'string'){ index = parseInt(index) }
    console.log(obj[index]);
    return obj[index];
  }

}
