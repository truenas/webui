import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { SystemProfiler } from 'app/core/classes/system-profiler';

import { Subject } from 'rxjs';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component'; // POC
import { WidgetControllerComponent } from 'app/core/components/widgets/widgetcontroller/widgetcontroller.component'; // POC
import { WidgetPoolComponent } from 'app/core/components/widgets/widgetpool/widgetpool.component';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';

import { RestService, WebSocketService } from '../../services/';
import { ModalService } from 'app/services/modal.service';
import { DashConfigItem } from 'app/core/components/widgets/widgetcontroller/widgetcontroller.component';
import { tween, styler } from 'popmotion';
import { EntityFormConfigurationComponent } from 'app/pages/common/entity/entity-form/entity-form-configuration.component';
import { EntityFormEmbeddedComponent } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityEmptyComponent, EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import {UUID} from 'angular2-uuid';
import { T } from 'app/translate-marker';

@Component({
  selector: 'dashboard',
  templateUrl:'./dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  public formComponent: EntityFormConfigurationComponent;
  public formEvents: Subject<CoreEvent>;
  public actionsConfig;

  public screenType: string = 'Desktop'; // Desktop || Mobile
  public optimalDesktopWidth: string = '100%';
  public widgetWidth: number = 540; // in pixels (Desktop only)

  public dashStateReady: boolean = false;
  public dashState: DashConfigItem[]; // Saved State
  public activeMobileWidget: DashConfigItem[] = [];
  public availableWidgets: DashConfigItem[] = [];

  get renderedWidgets(){
        return this.dashState.filter((widget) => widget.rendered);
  }

  public large: string = "lg";
  public medium: string = "md";
  public small: string = "sm";
  public zPoolFlex:string = "100";
  public noteFlex:string = "23";

  public statsDataEvents:Subject<CoreEvent>;
  private statsEvents: any;
  public tcStats: any;

  // For empty state
  get empty () {
        const rendered = this.dashState.filter((widget) => widget.rendered);
        return rendered.length == 0;
      }
  public emptyDashConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    large: true,
    title: T('Dashboard is Empty!'),
    message: T('You have hidden all of your available widgets. Use the dashboard configuration form to add widgets.'),
    button: {
      label: 'Configure Dashboard',
      action: () => {
        this.showConfigForm();
      }
    }
  }

  // For widgetsysinfo
  public isHA: boolean; // = false;
  public product_type = window.localStorage['product_type'];
  public sysinfoReady: boolean = false;

  // For CPU widget
  public systemInformation: any;

  // For widgetpool
  public system: any;
  public system_product: string = "Generic";
  public pools: any[]; // = [];
  public volumeData:any; //= {};

  public nics: any[]; // = [];

  public animation = "stop";
  public shake = false;

  public showSpinner: boolean = true;

  constructor(protected core:CoreService, protected ws: WebSocketService, 
    public mediaObserver: MediaObserver, private el: ElementRef, public modalService: ModalService){

    core.register({observerClass: this, eventName: "SidenavStatus"}).subscribe((evt: CoreEvent) => {
      setTimeout(() => {
        this.checkScreenSize();      
      }, 100);
    });

    this.statsDataEvents = new Subject<CoreEvent>();
    
    this.checkScreenSize();
    
    window.onresize = () => {
      this.checkScreenSize();     
    }
  }

  ngAfterViewInit(){
    this.checkScreenSize();
  }

  checkScreenSize() {
    let st = window.innerWidth < 600 ? 'Mobile' : 'Desktop';

    // If leaving .xs screen then reset mobile position
    if(st == 'Desktop' && this.screenType == 'Mobile'){
      this.onMobileBack();
    }

    this.screenType = st;

    // Eliminate top level scrolling 
    let wrapper = (<any>document).querySelector('.fn-maincontent');
    wrapper.style.overflow = this.screenType == 'Mobile' ? 'hidden' : 'auto';
    this.optimizeWidgetContainer();
  }

  optimizeWidgetContainer(){
    let wrapper = (<any>document).querySelector('.rightside-content-hold');
    
    const withMargin = this.widgetWidth + 8;
    const max = Math.floor(wrapper.offsetWidth / withMargin);
    const odw = max * withMargin;
    this.optimalDesktopWidth = odw.toString() + 'px';
  }

  onMobileLaunch(evt: DashConfigItem) {
    this.activeMobileWidget = [evt];

    // Transition 
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    let viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    let carousel = styler(c);
    const vpw = viewport.get('width'); //600;

    const startX = 0;
    const endX = vpw * -1;

    tween({
      from:{ x: startX },
      to:{ x: endX },
      duration: 250
    }).start(carousel.set);
  }

  onMobileBack() {
    // Transition 
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    let viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    let carousel = styler(c);
    const vpw = viewport.get('width'); //600;

    const startX = vpw * -1;
    const endX = 0;

    tween({
      from:{ x: startX },
      to:{ x: endX },
      duration: 250
    }).start({
      update: (v) => { 
        carousel.set(v);
      },
      complete: () => {
        this.activeMobileWidget = [];
      }
    });

  }

  onMobileResize(evt){
    if(this.screenType == 'Desktop'){ return; }
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    let viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    let carousel = styler(c);

    const startX = viewport.get('x');
    const endX = this.activeMobileWidget.length > 0 ? evt.target.innerWidth * -1 : 0;

    if(startX !== endX){
      carousel.set('x', endX);
    }
  }

  ngOnInit(){
    this.modalService.refreshForm$.subscribe(() => {
    });

    this.init();

    this.ws.call('failover.licensed').subscribe((res)=> {
      if (res) {
        this.isHA = true;
      }
    });
    this.sysinfoReady = true;

  }

  ngOnDestroy(){
    
    this.stopListeners();
    this.core.unregister({observerClass:this});

    // Restore top level scrolling 
    let wrapper = (<any>document).querySelector('.fn-maincontent');
    wrapper.style.overflow = 'auto';
  }

  init(){
    this.startListeners();

    this.core.register({observerClass:this,eventName:"NicInfo"}).subscribe((evt:CoreEvent) => {
      let clone = Object.assign([],evt.data);
      let removeNics = {};

      // Store keys for fast lookup
      let nicKeys = {};
      evt.data.forEach((item, index) => {
        nicKeys[item.name] = index.toString();
      });
        
      // Process Vlans (attach vlans to their parent)
      evt.data.forEach((item, index) => {
        if(item.type !== "VLAN" && !clone[index].state.vlans){
          clone[index].state.vlans = [];
        }

        if(item.type == "VLAN"){
          let parentIndex = parseInt(nicKeys[item.state.parent]);
          if(!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(item.state);
          removeNics[item.name] = index;
        }
      })

      // Process LAGGs
      evt.data.forEach((item, index) => {
        if(item.type == "LINK_AGGREGATION" ){
          clone[index].state.lagg_ports = item.lag_ports;
          item.lag_ports.forEach((nic) => {
            // Consolidate addresses 
            clone[index].state.aliases.forEach((item) => { item.interface = nic});
            clone[index].state.aliases = clone[index].state.aliases.concat(clone[nicKeys[nic]].state.aliases);

            // Consolidate vlans
            clone[index].state.vlans.forEach((item) => { item.interface = nic});
            clone[index].state.vlans = clone[index].state.vlans.concat(clone[nicKeys[nic]].state.vlans);
            
            // Mark interface for removal
            removeNics[nic] = nicKeys[nic];
          });
        }
      });

      // Remove NICs from list
      for(let i = clone.length - 1; i >= 0; i--){
        if(removeNics[clone[i].name]){ 
          // Remove
          clone.splice(i, 1)
        } else {
          // Only keep INET addresses
          clone[i].state.aliases = clone[i].state.aliases.filter(address => address.type == "INET" || address.type == 'INET6');
        }
      }
      
      // Update NICs array
      this.nics = clone;

      this.isDataReady();
    });

    this.core.emit({name:"VolumeDataRequest"});
    this.core.emit({name:"NicInfoRequest"});
    this.getDisksData();
  }

  startListeners(){
    this.core.register({observerClass:this,eventName:"UserAttributes"}).subscribe((evt:CoreEvent) => {
      if(evt.data.dashState){
        this.applyState(evt.data.dashState);
      }
      this.dashStateReady = true;
    });

    this.statsEvents = this.ws.sub("reporting.realtime").subscribe((evt) => {
      if(evt.cpu){
        this.statsDataEvents.next({name:"CpuStats", data:evt.cpu});
      }

      if(evt.virtual_memory){
        let keys = Object.keys(evt.virtual_memory);
        let memStats: any = {};

        keys.forEach((key, index) => {
          memStats[key] = evt.virtual_memory[key];
        });

        if(evt.zfs && evt.zfs.arc_size != null){
          memStats.arc_size = evt.zfs.arc_size;
        }
        this.statsDataEvents.next({name:"MemoryStats", data: memStats});
      }

      if(evt.interfaces){
        const keys = Object.keys(evt.interfaces);
        keys.forEach((key, index) => {
          const data = evt.interfaces[key];
          this.statsDataEvents.next({name:"NetTraffic_" + key, data: data});
        });
      }

    });

  }

  stopListeners(){
    // unsubscribe from middleware
    if(this.statsEvents){ 
      this.statsEvents.complete();
    }

    // unsubsribe from global actions
    if(this.formEvents){ 
      this.formEvents.complete();
    }
  }

  setVolumeData(evt:CoreEvent){
    let vd = {};

    for(let i in evt.data){
      if(typeof evt.data[i] == undefined || !evt.data[i]){ continue; }

      let avail = null;
      const used_pct = evt.data[i].used.parsed / (evt.data[i].used.parsed + evt.data[i].available.parsed);
      avail = evt.data[i].available.parsed;

      let zvol = {
        avail: avail,
        id:evt.data[i].id,
        name:evt.data[i].name,
        used:evt.data[i].used.parsed,
        used_pct: (used_pct * 100).toFixed(0) + '%'
      }
      
      vd[zvol.id] = zvol;
    }
    this.volumeData = vd;
  }

  getDisksData(){
    const uuid = UUID.UUID();

    this.core.register({observerClass: this, eventName: 'PoolData'}).subscribe((evt:CoreEvent) => {
      this.pools = evt.data;

      if(this.pools.length > 0){
        this.ws.call('pool.dataset.query', [[], {"extra": {"retrieve_children": false}}] ).subscribe((res) => {
          this.setVolumeData({
            name: "RootDatasets",
            data: res
          });
          this.isDataReady();
        });
      } else {
        const clone = Object.assign({}, evt);
        clone.data = [];
        this.setVolumeData(clone);
        this.isDataReady();
      }
    });

    this.core.register({observerClass: this, eventName: 'SysInfo'}).subscribe((evt:CoreEvent) => {
      if(typeof this.systemInformation == 'undefined'){
        this.systemInformation = evt.data;
        if(!this.pools || this.pools.length == 0){
          this.core.emit({name: 'PoolDataRequest', sender: this});
        }
      }
    });

    this.core.emit({name: 'SysInfoRequest', sender: this});
  }

  isDataReady(){
    const isReady = this.statsDataEvents && typeof this.pools !== undefined && this.volumeData && this.nics ? true : false;

    if(isReady){
      this.availableWidgets = this.generateDefaultConfig();
      if(!this.dashState){
        this.dashState = this.availableWidgets;
      }

      this.formEvents = new Subject();
      this.formEvents.subscribe((evt: CoreEvent) => {
        switch(evt.name){
          case 'FormSubmit':
            this.formHandler(evt);
          break;
          case 'ToolbarChanged':
            this.showConfigForm();
          break;
        }
      });

      // Setup Global Actions
      const actionsConfig = {
        actionType: EntityToolbarComponent,
        actionConfig: {
          target: this.formEvents,
          controls: [
            {
              name: 'dashConfig',
              label: 'Configure',
              type: 'button',
              value: 'click',
              color: 'primary'
            }
          ]
        }
      };

      this.actionsConfig = actionsConfig;

      this.core.emit({name:"GlobalActions", data: actionsConfig, sender: this});
      this.core.emit({name:"UserAttributesRequest"}); // Fetch saved dashboard state
    }
  }

  generateDefaultConfig(){
    let conf: DashConfigItem[] = [
      {name:'System Information', rendered: true, id: '0' },
    ];

    if(this.isHA){
      conf.push({name:'System Information(Standby)', identifier: 'passive,true', rendered: true , id: conf.length.toString()})
    }

    conf.push({name:'CPU', rendered: true, id: conf.length.toString() });
    conf.push({name:'Memory', rendered: true, id: conf.length.toString() });

    this.pools.forEach((pool, index) => {
      conf.push({name:'Pool', identifier: 'name,' + pool.name, rendered: true, id: conf.length.toString() });
    });

    this.nics.forEach((nic, index) => {
      conf.push({name:'Interface', identifier: 'name,' + nic.name, rendered: true, id: conf.length.toString() })
    });

    return conf;
  }

  volumeDataFromConfig(item:DashConfigItem){
    const spl = item.identifier.split(',');
    const key = spl[0];
    const value = spl[1];
    
    const pool = this.pools.filter(pool => pool[key] == value);
    return this.volumeData && this.volumeData[pool[0].name] ? this.volumeData[pool[0].name] : ''; 
  }

  dataFromConfig(item:DashConfigItem){
    let spl;
    let key;
    let value;
    if(item.identifier){
      spl = item.identifier.split(',');
      key = spl[0];
      value = spl[1];
    }

    let data: any;

    switch(item.name.toLowerCase()){
      case 'cpu':
        data = this.statsDataEvents;
      break;
      case 'memory':
        data = this.statsDataEvents;
      break;
      case 'pool':
        data = spl ? this.pools.filter(pool => pool[key] == value) : console.warn("DashConfigItem has no identifier!");
        if(data){ data = data[0];}
      break;
      case 'interface':
        data = spl ? this.nics.filter(nic => nic[key] == value) : console.warn("DashConfigItem has no identifier!");
        if(data){ data = data[0].state;}
      break;
    }

    return data ? data : console.warn('Data for this widget is not available!') ;
  }

  toggleShake(){
    if(this.shake){
      this.shake = false;
    } else if(!this.shake){
      this.shake= true;
    }
  }

  showConfigForm(){
    //this.modalService.open('slide-in-form', this.addComponent);
    if(this.formComponent){
      delete this.formComponent;
    } 
    this.generateFormComponent();
    this.modalService.open('slide-in-form', this.formComponent);
   
  }

  generateFormComponent(){
    let widgetTypes = [];
    this.dashState.forEach((item) => {
      if(widgetTypes.indexOf(item.name) == -1){
        widgetTypes.push(item.name);
      }
    });

   /* let fieldSets = widgetTypes.map((widgetType) => {
      return {
        name: widgetType,
        width: '100%',
        label: true,
        config: this.dashState.filter((w) => w.name == widgetType).map((widget) => {
          let ph;
          if(widget.identifier){
            let spl = widget.identifier.split(',');
            ph = spl[1];
          } else {
            ph = widget.name;
          }

          return {
            type: 'checkbox',
            name: ph,
            value: widget.rendered,
            placeholder: ph,
          }
        })
      }
    });*/

   let fieldSets = [
     {
        name: "Toggle Widget Visibility",
        width: '100%',
        label: true,
        config: this.dashState.map((widget) => {
          let ph;
          if(widget.identifier){
            let spl = widget.identifier.split(',');
            ph = spl[1];
          } else {
            ph = widget.name;
          }

          return {
            type: 'checkbox',
            name: ph,
            value: widget.rendered,
            placeholder: ph,
          }
        })
      }
   ];
    
    this.formComponent = new EntityFormConfigurationComponent();
    this.formComponent.fieldSets = new FieldSets(fieldSets);
    this.formComponent.title = 'Dashboard Configuration';
    this.formComponent.isOneColumnForm = true;
    this.formComponent.formType = 'EntityFormComponent';
    this.formComponent.target = this.formEvents;

  }

  formHandler(evt: CoreEvent){
    // This method handles the form data

    let clone = Object.assign([], this.dashState);
    const keys = Object.keys(evt.data);

    // Apply
    keys.forEach((key) => {
      const value = evt.data[key];
      const dashItem = clone.filter((w) => {
        if(w.identifier){
          const spl = w.identifier.split(',');
          const name = spl[1];
          return key == name;
        } else {
          return key == w.name;
        }
      });

      dashItem[0].rendered = value;
    });

    this.dashState = clone;
    this.modalService.close('slide-in-form')/*.then( closed => {
    });*/

    // Save
    this.ws.call('user.set_attribute', [1, 'dashState', clone]).subscribe((res) => {
      if(!res){
        throw "Unable to save Dashboard State"
      }
    });
  }

  applyState(state){
    // This reconciles current state with saved dashState

    if(!this.dashState){
      console.warn( "Cannot apply saved state to dashboard. Property dashState does not exist!");
      return;
    }

    let clone = Object.assign([], this.dashState);
    clone.forEach((widget, index) => {
      let matches = state.filter((w) => {
        let key = widget.identifier ? 'identifier' : 'name';

        return widget[key] == w[key];
      }); 

      if(matches.length == 1){
        clone[index] = matches[0];
      }

    });
  
    this.dashState = clone;
  
  }

}
