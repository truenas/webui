import { Component, OnInit, AfterViewInit,OnDestroy, Input, ViewChild, Renderer2, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
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
}


@Component({
  selector: 'widget-nic',
  templateUrl:'./widgetnic.component.html',
  styleUrls: ['./widgetnic.component.css']
})
export class WidgetNicComponent extends WidgetComponent implements OnInit, AfterViewInit,OnDestroy, OnChanges {

  @Input() stats;
  @Input() nicState;
  @ViewChild('carousel', {static:true}) carousel:ElementRef;
  @ViewChild('carouselparent', {static:true}) carouselParent:ElementRef;
  public traffic: NetTraffic;
  public currentSlide:string = "0";
  
  get currentSlideName(){
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(){
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  public title: string = "Interface";

  path: Slide[] = [
    { name: "overview"},
    { name: "empty"},
    { name: "empty"}
  ];

  get ipAddresses(){
    if(!this.nicState && !this.nicState.aliases){ return [];}

    let result = this.nicState.aliases.filter((item) => {
      return item.type == 'INET' ;
    });
    
    return result;
  }

  get vlanAddresses(){
    if(!this.nicState){ return [];}
    if(this.path[2].name == 'empty' || this.nicState.vlans.length == 0 || !this.nicState.vlans[ parseInt(this.path[2].index) ]){ return [];}

    let vlan = this.nicState.vlans[ parseInt(this.path[2].index) ];
    let result = vlan.aliases.filter((item) => {
      return item.type == 'INET' ;
    });
    console.log(vlan);

    return result;
  }

  get linkState(){
    if(!this.nicState && !this.nicState.aliases){ return [];}
    return this.nicState.link_state.replace(/_/g, ' ');
  }

  constructor(public router: Router, public translate: TranslateService){
    super(translate);
    this.configurable = false;
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"NIC", obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes.nicState ){
      this.title = this.currentSlide == "0" ? "Interface" : this.nicState.name;
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

  ngAfterViewInit(){
    this.stats.subscribe((evt:CoreEvent) => {
      if(evt.name == "NetTraffic_" + this.nicState.name){
        this.traffic = evt.data;
      }
    })
  }

  updateSlide(name:string,verified: boolean, slideIndex:number, dataIndex?: number){
    if(name !=="overview" && !verified){ return; }
    let slide: Slide = {
      name: name,
      index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null
    }

    this.path[slideIndex] = slide;
    this.updateSlidePosition(slideIndex);
    
  }

  updateSlidePosition(value){
    if(value.toString() == this.currentSlide){ return; }
    let el = styler(this.carouselParent.nativeElement.querySelector('.carousel'));
    tween({
      from:{ x: (parseInt(this.currentSlide) * 100) * -1 },
      //to:{ x: (value * 100) * -1 },
      to:{ x: (value * 600) * -1 },
      duration: 250
    }).start(el.set);
    
    this.currentSlide = value.toString();
    this.title = this.currentSlide == "0" ? "Interface" : this.nicState.name;
    
  }

  vlanAliases(vlanIndex:string|number){
    if(typeof vlanIndex == 'string'){ vlanIndex = parseInt(vlanIndex); }
    let vlan = this.nicState.vlans[vlanIndex];
    let result = vlan.aliases.filter((item) => {
      return item.type == 'INET' ;
    });
    return result;
  }

  getMbps(arr:number[]){
    // NOTE: Stat is in bytes so we convert
    // no average
    let result = arr[0]/1024/1024;
    if(result > 999){
      return result.toFixed(1)
    } else if(result < 1000 && result > 99){
      return result.toFixed(2);
    } else if(result > 9 && result < 100){
      return result.toFixed(3);
    } else if(result < 10){
      return result.toFixed(4);
    } else {
      return -1;
    }
    
  }

}
