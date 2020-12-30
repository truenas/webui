import { Component, OnInit, AfterViewInit,OnDestroy, Input, ViewChild, Renderer2, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { ActivatedRoute, Router } from '@angular/router';
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
import { InterfacesFormComponent } from 'app/pages/network/forms/interfaces-form.component';
import { DialogService, NetworkService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

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
  public hasPendingChanges = false;
  public checkin_remaining = null;
  checkin_interval;
  public checkinWaiting = false;
  protected interfaceComponent: InterfacesFormComponent;
  
  get currentSlideName(){
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(){
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  public title: string = "Interface";

  path: Slide[] = [
    { name: T("overview")},
    { name: T("empty")},
    { name: T("empty")}
  ];

  get ipAddresses(){
    if(!this.nicState && !this.nicState.aliases){ return [];}

    let result = this.nicState.aliases.filter((item) => {
      return item.type == 'INET' || item.type == 'INET6' ;
    });
    
    return result;
  }

  get vlanAddresses(){
    if(!this.nicState){ return [];}
    if(this.path[2].name == 'empty' || this.nicState.vlans.length == 0 || !this.nicState.vlans[ parseInt(this.path[2].index) ]){ return [];}

    let vlan = this.nicState.vlans[ parseInt(this.path[2].index) ];
    let result = vlan.aliases.filter((item) => {
      return item.type == 'INET' || item.type == 'INET6' ;
    });

    return result;
  }

  get linkState(){
    if(!this.nicState && !this.nicState.aliases){ return [];}
    return this.nicState.link_state.replace(/_/g, ' ');
  }

    constructor(private ws: WebSocketService,public router: Router, public translate: TranslateService, private aroute: ActivatedRoute,
    private modalService: ModalService,
    private networkService: NetworkService,
      private dialog: DialogService){
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
    this.checkInterfacePendingChanges();
    this.core.register({observerClass: this, eventName:"NetworkInterfacesChanged"}).subscribe((evt:CoreEvent) => {
      if (evt && evt.data.checkin) {
        this.checkin_remaining = null;
        this.checkinWaiting = false;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
        this.hasPendingChanges = false;
      }
    });

  }

  ngAfterViewInit(){
    this.stats.subscribe((evt:CoreEvent) => {
      if(evt.name == "NetTraffic_" + this.nicState.name){
        const sent: Converted = this.convert(evt.data.sent_bytes_rate);
        const received: Converted = this.convert(evt.data.received_bytes_rate);

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
      return item.type == 'INET' || item.type == 'INET6';
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
      case 'B':
      case 'KB':
        units = T('KiB');
        result = value / 1024;
        break;
      case 'MB':
        units = T('MiB');
        result = value / 1024 / 1024;
        break;
      case 'GB':
        units = T('GiB');
        result = value / 1024 / 1024 / 1024;
        break;
      case 'TB':
        units = T('TiB');
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      case 'PB':
        units = T('PiB');
        result = value / 1024 / 1024 / 1024 / 1024 / 1024;
        break;
      default:
        units = T('KiB');
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

  checkInterfacePendingChanges() {
    this.checkPendingChanges();
    this.checkWaitingCheckin();
  }

  checkPendingChanges() {
    this.ws.call('interface.has_pending_changes').subscribe(res => {
      this.hasPendingChanges = res;
    });
  }

  configureNetworkInterface() {
    this.modalService.open('slide-in-form', this.interfaceComponent);
  }

  checkWaitingCheckin() {
    this.ws.call('interface.checkin_waiting').subscribe(res => {
      if (res != null) {
        const seconds = res.toFixed(0);
        if (seconds > 0 && this.checkin_remaining == null) {
          this.checkin_remaining = seconds;
          this.checkin_interval = setInterval(() => {
            if (this.checkin_remaining > 0) {
              this.checkin_remaining -= 1;
            } else {
              this.checkin_remaining = null;
              this.checkinWaiting = false;
              clearInterval(this.checkin_interval);
              window.location.reload(); // should just refresh after the timer goes off
            }
          }, 1000);
        }
        this.checkinWaiting = true;
      } else {
        this.checkinWaiting = false;
        this.checkin_remaining = null;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
      }
    });
  }
  
  refreshNetworkForms() {
    this.interfaceComponent = new InterfacesFormComponent(this.router, this.aroute, this.networkService, this.dialog, this.ws);
    this.interfaceComponent.afterModalFormClosed = this.checkInterfacePendingChanges.bind(this);
  }
}
