import { Component, OnInit, AfterViewInit,OnDestroy, Input, ViewChild, Renderer2, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
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
  sent: string;
  sentUnits: string;
  received: string;
  receivedUnits: string;
}

interface Converted {
  value: string;
  units: string;
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
  @ViewChild('carouselparent', {static:false}) carouselParent:ElementRef;
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
  }

  ngAfterViewInit(){
    this.stats.subscribe((evt:CoreEvent) => {
      if(evt.name == "NetTraffic_" + this.nicState.name){
        const sent: Converted = this.convert(evt.data.sent_bytes_last);
        const received: Converted = this.convert(evt.data.received_bytes_last);

        let t = {
          sent: sent.value,
          sentUnits: sent.units,
          received: received.value,
          receivedUnits: received.units
        }

        this.traffic = t; //evt.data;
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
    const carousel = this.carouselParent.nativeElement.querySelector('.carousel');
    const slide = this.carouselParent.nativeElement.querySelector('.slide');

    let el = styler(carousel);
    let slideW = styler(slide).get('width');

    tween({
      from:{ x: (parseInt(this.currentSlide) * 100) * -1 },
      to:{ x: (value * slideW) * -1 },
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

  convert(value): Converted{
    let result;
    let units;

    // uppercase so we handle bits and bytes...
    switch(this.optimizeUnits(value)){
      case 'KB':
        units = 'KiB';
        result = value / 1024;
        break;
      case 'MB':
        units = 'MiB';
        result = value / 1024 / 1024;
        break;
      case 'GB':
        units = 'GiB';
        result = value / 1024 / 1024 / 1024;
        break;
      case 'TB':
        units = 'TiB';
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      case 'PB':
        units = 'PiB';
        result = value / 1024 / 1024 / 1024 / 1024 / 1024;
        break;
      default:
        units = 'KiB';
        result = 0.00;
    }

    return result ? { value: result.toFixed(2), units: units } : { value: '0.00', units: units };
  }

  optimizeUnits(value){
    let units: string = 'B';
    if(value > 1024 && value < (1024 * 1024)){
      units = 'KB';
    } else if (value >= (1024 * 1024) && value < (1024 * 1024 * 1024)){
      units = 'MB'
    } else if (value >= (1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024)){
      units = 'GB'
    } else if (value >= (1024 * 1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024 * 1024)){
      units = 'TB'
    }

    return units;
  }

}
