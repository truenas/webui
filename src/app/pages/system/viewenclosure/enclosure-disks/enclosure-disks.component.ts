import { Component, Input, OnInit, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ThemeUtils } from 'app/core/classes/theme-utils';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture, utils} from 'pixi.js';
import 'pixi-projection';
import { VDevLabelsSVG } from 'app/core/classes/hardware/vdev-labels-svg';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { Chassis } from 'app/core/classes/hardware/chassis';
import { ChassisView } from 'app/core/classes/hardware/chassis-view';
import { M50 } from 'app/core/classes/hardware/m50';
import { M50Rear } from 'app/core/classes/hardware/m50_rear';
import { ES12 } from 'app/core/classes/hardware/es12';
import { E16 } from 'app/core/classes/hardware/e16';
import { E24 } from 'app/core/classes/hardware/e24';
import { ES24 } from 'app/core/classes/hardware/es24';
import { E60 } from 'app/core/classes/hardware/e60';
import { ES60 } from 'app/core/classes/hardware/es60';
import { DiskComponent } from './components/disk.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { ErrorMessage } from 'app/core/classes/ix-interfaces';
import { tween, easing, styler, value, keyframes } from 'popmotion';
import { Subject } from 'rxjs';
import { ExampleData } from './example-data';
import { DomSanitizer } from "@angular/platform-browser";
import { Temperature } from 'app/core/services/disk-temperature.service';
import { DialogService } from 'app/services/dialog.service';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { T } from '../../../../translate-marker';

export interface DiskFailure {
  disk: string;
  enclosure: number;
  slot: number;
  location: string; // front || rear || internal;
  reasons?: string[];
}

@Component({
  selector: 'enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksComponent implements AfterContentInit, OnChanges, OnDestroy {

  protected pendingDialog:any;
  protected aborted: boolean = false;
  private mediaObs;
  public mqAlias: string;
  @ViewChild('visualizer', { static: true}) visualizer: ElementRef;
  @ViewChild('disksoverview', { static: true}) overview: ElementRef;
  @ViewChild('diskdetails', { static: false}) details: ElementRef;
  @ViewChild('domLabels', { static: false}) domLabels: ElementRef;
  @Input('system-profiler') system: SystemProfiler;
  @Input('selected-enclosure') selectedEnclosure: any;
  @Input('current-tab') currentTab: any;
  @Input('controller-events') controllerEvents:Subject<CoreEvent>;
  public app;
  private renderer;
  private loader = PIXI.loader;
  private resources = PIXI.loader.resources;
  public container;
  public system_product: string = 'unknown';
  public failedDisks: DiskFailure[] = [];
  public subenclosure: any; // Declare rear and internal enclosure visualizations here

  public chassis: Chassis;
  public view: string = "front"; // front || rear || internal
  protected _enclosure: ChassisView; // Visualization
  get enclosure(){
    return this.chassis ? this.chassis[this.view] : null;
  }

  private _expanders: any[] = [];
  get expanders () {
    if(!this.system.platform.includes('MINI') && this.system.enclosures && this.selectedEnclosure.disks[0]){
      let enclosureNumber =  Number(this.selectedEnclosure.disks[0].enclosure.number);
      return this.system.getEnclosureExpanders(enclosureNumber);
    } else {
      return this._expanders;
    }
  }

  private _unhealthyPools: string[] = [];
  get unhealthyPools(){
    const sickPools = this.getUnhealthyPools();
    return sickPools;
  }

  private _selectedVdev: any;
  get selectedVdev(){
    return this._selectedVdev;
  }
  set selectedVdev(value) {
    this._selectedVdev = value;
    let disks = value && value.disks ? Object.keys(this.selectedVdev.disks) : null;

    // Sort the disks by slot number
    if(disks && disks.length > 1) {
      disks.sort((a,b) => {
        return value.slots[a] - value.slots[b];
      })
    } 
    this.selectedVdevDisks = disks;
    
  }

  get enclosurePools(){
    return Object.keys(this.subenclosure ? this.subenclosure.poolKeys : this.selectedEnclosure.poolKeys);
  }

  public selectedVdevDisks: string[];
  public selectedDisk: any;

  public theme: any;
  protected themeUtils: ThemeUtils;
  public currentView: string; // pools || status || expanders || details
  public exitingView: string; // pools || status || expanders || details
  private defaultView = 'pools';
  private labels: VDevLabelsSVG;
  private identifyBtnRef: any;
  protected maxCardWidth:number = 960;
  protected pixiWidth: number = 960;
  protected pixiHeight: number = 304;
  protected temperatures?:Temperature;
  
  get cardWidth(){
    return this.overview.nativeElement.offsetWidth;
  }
 
  get cardScale(){
    const scale = this.cardWidth / this.maxCardWidth;
    return scale > 1 ? 1 : scale;
  }

  public scaleArgs: string;
 

  constructor(
    public el:ElementRef, 
    protected core: CoreService, 
    public sanitizer: DomSanitizer,  
    public mediaObserver: MediaObserver, 
    public cdr: ChangeDetectorRef,
    public dialogService: DialogService,
  ){
    
    this.themeUtils = new ThemeUtils();

    core.register({observerClass: this, eventName: 'DiskTemperatures'}).subscribe((evt:CoreEvent) => {
      if(!this.chassis || !this.chassis[this.view] || !this.chassis[this.view].driveTrayObjects){ return; }

      let clone: Temperature = Object.assign({}, evt.data);
      clone.values = {};
      clone.keys = [];

      this.chassis[this.view].driveTrayObjects.forEach((dt, index) => {
        const disk = this.findDiskBySlotNumber(parseInt(dt.id));
        if(disk){
          clone.keys.push(disk.name);
          clone.values[disk.name] = evt.data.values[disk.name];
        }
      });

      this.temperatures = clone;
    });
    core.emit({name:"DiskTemperaturesSubscribe", sender:this});

    core.register({observerClass: this, eventName: 'DisksChanged'}).subscribe((evt:CoreEvent) => {
      // REACT TO EVENT PROVIDED BY DISK.QUERY
    });

    core.register({observerClass: this, eventName: 'MediaChange'}).subscribe((evt:CoreEvent) => {
      this.mqAlias = evt.data.mqAlias;
     
      if(evt.data.mqAlias == 'xs' || evt.data.mqAlias == 'sm' || evt.data.mqAlias == 'md'){
        core.emit({name: 'ForceSidenav', data: 'close', sender: this});
        this.resizeView();
      } else {
        core.emit({name: 'ForceSidenav', data: 'open', sender: this});
      }

      this.resizeView();

    });

    core.register({observerClass: this, eventName: 'ThemeData'}).subscribe((evt:CoreEvent) => {
      this.theme = evt.data;
    });

    core.register({observerClass: this, eventName: 'ThemeChanged'}).subscribe((evt:CoreEvent) => {
      if(this.theme == evt.data){ return; }
      this.theme = evt.data;
      this.setCurrentView(this.currentView);
      if(this.labels && this.labels.events){
        this.labels.events.next(evt);
      }
      this.optimizeChassisOpacity();
    });

    core.emit({name: 'ThemeDataRequest', sender: this});

  }

  clearDisk(){
    this.setCurrentView(this.defaultView);
  }

  ngAfterContentInit() {

    this.controllerEvents.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "CanvasExtract":
          this.createExtractedEnclosure(evt.data);
          break;
        case "EnclosureLabelChanged":
          if(this.pendingDialog !== undefined){
            this.pendingDialog.loader.close();
            this.pendingDialog.dialogRef.close();
          }
          break;
      }
    });

    this.pixiInit();

    // Listen for DOM changes to avoid race conditions with animations
    let callback = (mutationList, observer) => {
      mutationList.forEach((mutation) => {

        switch(mutation.type) {
          case 'childList':
            /* One or more children have been added to and/or removed
               from the tree; see mutation.addedNodes and
               mutation.removedNodes */
            if(!mutation.addedNodes[0] || !mutation.addedNodes[0].classList || mutation.addedNodes.length == 0 || mutation.addedNodes[0].classList.length == 0){
              break;
            }
            const fullStage: boolean = mutation.addedNodes[0].classList.contains('full-stage');
            const stageLeft: boolean = mutation.addedNodes[0].classList.contains('stage-left');
            const stageRight: boolean = mutation.addedNodes[0].classList.contains('stage-right');
            const vdevLabels: boolean = mutation.addedNodes[0].classList.contains('vdev-disk');
            const canvasClickpad: boolean = mutation.addedNodes[0].classList.contains('clickpad');
            if(stageLeft){
              this.enter('stage-left'); // View has changed so we launch transition animations
            } else if(stageRight){
              this.enter('stage-right'); // View has changed so we launch transition animations
            }  else if(fullStage){
              this.enter('full-stage'); // View has changed so we launch transition animations
            }
            break;
          case 'attributes':
            /* An attribute value changed on the element in
               mutation.target; the attribute name is in
               mutation.attributeName and its previous value is in
               mutation.oldValue */

            const diskName: boolean = mutation.target.classList.contains('disk-name');
        
            if(diskName && this.currentView == 'details' && this.exitingView == 'details'){
              this.update('stage-right'); // View has changed so we launch transition animations
              this.update('stage-left'); // View has changed so we launch transition animations
              this.labels.events.next({name:"OverlayReady", data: {vdev: this.selectedVdev, overlay:this.domLabels}, sender: this});
            }
            break;
        }
      });
      
    }

    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true //Omit or set to false to observe only changes to the parent node.
    }
    
    const domChanges = new MutationObserver(callback);
    domChanges.observe(this.overview.nativeElement, observerOptions);

  }

  ngOnChanges(changes:SimpleChanges){
    if(changes.selectedEnclosure){
      // Enabled subenclosure functionality
      this.subenclosure = changes.selectedEnclosure.currentValue.enclosureKey == this.system.headIndex && this.system.rearIndex ? changes.selectedEnclosure.currentValue : undefined;
      this.loadEnclosure(changes.selectedEnclosure.currentValue, 'front');
    }
  }

  ngOnDestroy(){
    this.core.emit({name:"DiskTemperaturesUnsubscribe", sender:this})
    this.core.unregister({observerClass: this});
    this.destroyAllEnclosures();
    this.app.stage.destroy(true);
    this.app.destroy(true, true); 
    //this.mediaObs.unsubscribe();
  }

  loadEnclosure(enclosure, view?:string){
      this.destroyEnclosure();

      if(view){
        this.view = view;
      }

      if(this.system && this.selectedEnclosure){
        this.getDiskFailures();
      }

      if(this.enclosure){ 
        
        this.exitingView = this.currentView;
        this.currentView = this.defaultView;
        if(this.exitingView == 'details'){
          this.labels.exit();
          if(this.identifyBtnRef){
            this.toggleSlotStatus(true);
            this.radiate(true);
          }
          this.exit('stage-left');
          this.exit('stage-right');
        } else if (this.exitingView == 'expanders'){
          this.exit('full-stage');
        } 
          
        this.createEnclosure(enclosure); 
      }
  }

  pixiInit(){
      PIXI.settings.PRECISION_FRAGMENT = 'highp'; //this makes text looks better? Answer = NO
      PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES , 16);// Fixes FireFox gl errors
      PIXI.utils.skipHello();
      this.app = new PIXI.Application({
        width: this.pixiWidth,  //960 ,
        height: this.pixiHeight, //304 ,
        forceCanvas:false,
        transparent:true,
        antialias:true,
        autoStart:true,
      });

    this.renderer = this.app.renderer;

    this.app.renderer.backgroundColor = 0x000000;
    this.visualizer.nativeElement.appendChild(this.app.view);

    this.container = new PIXI.Container();
    this.container.name = "top_level_container";
    this.app.stage.name = "stage_container";
    this.app.stage.addChild(this.container);
    this.container.width = this.app.stage.width;
    this.container.height = this.app.stage.height;

    this.createEnclosure();
    this.controllerEvents.next({name:"VisualizerReady", sender:this});
  }

  createEnclosure(profile:any = this.selectedEnclosure){
    const enclosure = this.system.enclosures[profile.enclosureKey];
    switch(enclosure.model){
      case "M Series":
        this.chassis = new M50();
        break;
      case "M Series Rear Bays":
        this.chassis = new M50Rear();
        break;
      case "X Series":
      case 'ES12':
        this.chassis = new ES12();
        break;
      case "Z Series":
      case "TRUENAS-Z20-HA-D":
      case 'E16':
        this.chassis = new E16();
      break;
      case "ES24":
        this.chassis = new ES24();
        break;
      case "E24":
        this.chassis = new E24();
        break;
      case "ES60":
        this.chassis = new ES60();
        break;
      case "E60":
        this.chassis = new E60();
        break;
      default:
        this.controllerEvents.next({
          name: 'Error', 
          data: { 
            name: 'Unsupported Hardware', 
            message: 'This chassis has an unknown or missing model value. (METHOD: createEnclosure)'
          }
        });
        this.aborted = true;
    }
    if(this.aborted){
      return;
    }

    this.setupEnclosureEvents(enclosure);
  }
  
  setupEnclosureEvents(enclosure){
    this.enclosure.events.subscribe((evt) => {
      switch(evt.name){
        case "Ready":
          this.container.addChild(this.enclosure.container);
          this.enclosure.container.name = this.enclosure.model;
          this.enclosure.container.width = this.enclosure.container.width / 2;
          this.enclosure.container.height = this.enclosure.container.height / 2;
          this.enclosure.container.x = this.app._options.width / 2 - this.enclosure.container.width / 2;
          this.enclosure.container.y = this.app._options.height / 2 - this.enclosure.container.height / 2;
          
          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);
          
          this.optimizeChassisOpacity();
          
        break;
        case "DriveSelected":
          if(this.identifyBtnRef){
            this.toggleSlotStatus(true);
            this.radiate(true);
          }

          let disk = this.findDiskBySlotNumber( parseInt(evt.data.id) );
          if(disk == this.selectedDisk){break} // Don't trigger any changes if the same disk is selected

          if(evt.data.enabled){
            this.selectedDisk = disk;
            this.setCurrentView('details');
          }
        break;
      }
    });

    if(!this.resources[this.enclosure.model]){
      this.enclosure.load();
    } else {
      this.onImport(); 
    }
  }

  createExtractedEnclosure(profile){
    const raw_enclosure = this.system.enclosures[profile.enclosureKey];
    let chassis;
    let enclosure;
    switch(raw_enclosure.model){
      case "M Series":
        chassis = new M50();
        break;
      case "X Series":
      case 'ES12':
        chassis = new ES12();
        break;
      case "Z Series":
      case "TRUENAS-Z20-HA-D":
      case 'E16':
        chassis = new E16();
        break;
      case "E24":
        chassis = new E24();
        break;
      case "ES24":
        chassis = new ES24();
        break;
      case "ES60":
        chassis = new ES60();
        break;
      case "E60":
        chassis = new E60();
        break;
      default:
          this.controllerEvents.next({
            name: 'Error', 
            data: { 
              name: 'Unsupported Hardware', 
              message: 'This chassis has an unknown or missing model value. (METHOD: createExtractedEnclosure)'
            }
          });
          this.aborted = true;
      }

    if(this.aborted){
      return;
    }
    
    enclosure = chassis.front;
    
    enclosure.events.subscribe((evt) => {
      switch(evt.name){
        case "Ready":
          this.container.addChild(enclosure.container);
          enclosure.container.name = enclosure.model + "_for_extraction";
          enclosure.container.width = enclosure.container.width / 2;
          enclosure.container.height = enclosure.container.height / 2;
          enclosure.container.x = 0; //this.app._options.width / 2 - enclosure.container.width / 2;
          enclosure.container.y = 0; //this.app._options.height / 2 - enclosure.container.height / 2;
          //enclosure.chassis.alpha = 0.75;
          //enclosure.chassis.alpha = 0.35;
          this.optimizeChassisOpacity(enclosure);

          profile.disks.forEach((disk, index) =>{
            this.setDiskHealthState(disk, enclosure);
          });
          this.extractEnclosure(enclosure, profile);
          
        break;
      }
    });

    enclosure.load();
  }

  extractEnclosure(enclosure, profile){
    //let extractor = new PIXI.extract.CanvasExtract(this.renderer);
    let canvas = this.app.renderer.plugins.extract.canvas(enclosure.container)
    this.controllerEvents.next({name:"EnclosureCanvas", data:{canvas:canvas, profile: profile}, sender:this});
    this.container.removeChild(enclosure.container);
    //delete enclosure;
  }

  destroyEnclosure(){
    if(!this.enclosure){return; }
    this.enclosure.events.unsubscribe()
    this.container.removeChild(this.enclosure.container);
    this.enclosure.destroy();
  }

  destroyAllEnclosures(){
    if(this.enclosure){
      // Clear out assets
      this.enclosure.destroy();
    }
    this.container.destroy(true);
    PIXI.loader.resources = {};
  }

  makeDriveTray():DriveTray{
    let dt = this.enclosure.makeDriveTray();
    return dt;
  }

  onImport(){
    let sprite = PIXI.Sprite.from(this.enclosure.loader.resources.m50.texture.baseTexture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.name=this.enclosure.model + "_sprite"
    sprite.alpha = 0.1;
    this.container.addChild(sprite);

    let dt = this.enclosure.makeDriveTray();
    this.container.addChild(dt.container);
    this.setCurrentView(this.defaultView);
    
  }

  setCurrentView(opt: string){
    if(this.currentView){ this.exitingView = this.currentView; }
    // pools || status || expanders || details

    if(this.labels){
      // Start exit animation
      this.labels.exit();
    }

    if(this.exitingView && this.exitingView == 'details' && this.identifyBtnRef){
      this.toggleSlotStatus(true);
      this.radiate(true);
    }
    
    switch(opt){
      case 'pools':
        this.container.alpha = 1;
        this.setDisksPoolState();
      break
      case 'status':
        this.container.alpha = 1;
        this.setDisksDisabled();
        this.setDisksHealthState();
      break
      case 'expanders':
        this.container.alpha = 0;
      break
      case 'details':
        this.container.alpha = 1;
        this.setDisksDisabled();
        //this.setDisksHealthState();
        this.setDisksPoolState();
        let vdev = this.system.getVdevInfo(this.selectedDisk.devname);
        this.selectedVdev = vdev;

        this.labels = new VDevLabelsSVG(this.enclosure, this.app, this.theme, this.selectedDisk);

        this.labels.events.next({name:"LabelDrives", data: vdev, sender: this});
        let dl;

      break
    }

    this.currentView = opt;
    this.resizeView();
    
  }

  update(className:string){ // stage-left or stage-right or expanders
 
    let sideStage = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className);
    let html = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className + ' .content')
    let el = styler(html, {});

    let x = (sideStage.offsetWidth * 0.5) - (el.get('width') * 0.5);
    let y = sideStage.offsetTop + (sideStage.offsetHeight * 0.5) - (el.get('height') * 0.5);
    html.style.left = x.toString() + 'px';
    html.style.top = y.toString() + 'px';
  }

  enter(className:string){ // stage-left or stage-right or expanders
    if(this.exitingView){ 
      if(className == 'full-stage'){
        this.exit('stage-left'); 
        this.exit('stage-right'); 
      } else if(this.exitingView == 'expanders'){
        this.exit('full-stage'); 
      } else {
        this.exit(className);
      }
    }
    
 
    let sideStage = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className);
    let html = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className + ' .content')
    let el = styler(html, {});

    let x = (sideStage.offsetWidth * 0.5) - (el.get('width') * 0.5);
    let y = sideStage.offsetTop + (sideStage.offsetHeight * 0.5) - (el.get('height') * 0.5);
    html.style.left = x.toString() + 'px';
    html.style.top = y.toString() + 'px';
    
    tween({
      from:{ scale: 0, opacity: 0},
      to:{scale: 1, opacity: 1},
      duration: 360
    }).start({
      update: v => { el.set(v); },
      complete: () => {
        if(this.currentView == 'details'){
          this.labels.events.next({name:"OverlayReady", data: {vdev: this.selectedVdev, overlay:this.domLabels}, sender: this});
        }
      }
    });
  }

  exit(className){ // stage-left or stage-right or full-stage
    let html = this.overview.nativeElement.querySelector('.' + className + '.' + this.exitingView);
    let el = styler(html, {});
    let duration = 360;

    // x is the position relative to it's starting point.
    const w = el.get('width');
    const startX = 0;
    let endX = className == 'stage-left' ? w * -1 : w;
    if(className == 'full-stage'){ 
      endX = startX;
      duration = 10;
    }

    // Move stage left
    tween({
      from:{opacity:1, x:0},
      to:{
        opacity:0,
        x: endX
      },
      duration: duration
    }).start({
      update: v => { el.set(v) },
      complete: () => {
        if(this.exitingView == 'details' && this.currentView !== 'details'){
          this.selectedDisk = null;
          this.labels = null;
          this.selectedVdev = null;
        }
        this.exitingView = null;
        el.set({x: 0})
      }
    });

  }

  optimizeChassisOpacity(extractedEnclosure?){
    const css = (<any>document).documentElement.style.getPropertyValue('--contrast-darkest');
    const hsl = this.themeUtils.hslToArray(css);
    
    let opacity;
    if(extractedEnclosure){
      opacity = hsl[2] < 60 ? 0.35 : 0.75;
      extractedEnclosure.chassis.alpha = opacity;
    } else {
      opacity = hsl[2] < 60 ? 0.25 : 0.75;
      this.chassis.front.setChassisOpacity(opacity);

      if(this.chassis.rear){
        this.chassis.rear.setChassisOpacity(opacity);
      }
    }
  }

  setDisksEnabledState(enclosure?){
    if(!enclosure){enclosure = this.enclosure}
    enclosure.driveTrayObjects.forEach((dt, index) =>{
      //let disk = this.findDiskBySlotNumber(index + 1);
      let disk = this.findDiskBySlotNumber(dt.id);
      dt.enabled = disk ? true : false;
    });
  }

  setDisksDisabled(){
    this.enclosure.driveTrayObjects.forEach((dt, index) =>{
      let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;
      let disk = selectedEnclosure.disks[index];
      this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: dt.id, color: 'none'}});
    });
  }

  setDisksHealthState(disk?: any){ // Give it a disk and it will only change that slot
    let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;
    if(disk || typeof disk !== 'undefined'){
      this.setDiskHealthState(disk);
      return;
    }

    selectedEnclosure.disks.forEach((disk, index) =>{
      this.setDiskHealthState(disk);
    });

  }

  setDiskHealthState(disk: any, enclosure: any = this.enclosure, updateGL: boolean = false){
      let index;
      const dt = enclosure.driveTrayObjects.filter( (dto,i) => {
        const result = (dto.id == disk.enclosure.slot.toString());
        if(result){
          index = i;
        }
        return result;
      })[0];
      if(!dt){
        return;
      } else {
        enclosure.driveTrayObjects[index].enabled = disk.enclosure.slot ? true : false;
      }

      let failed: boolean = false;

      // Health based on disk.status
      if(disk && disk.status){
        switch(disk.status){
          case "ONLINE":
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot, color: this.theme.green}});
          break;
          case "FAULT":
            failed = true;
          break;
          case "AVAILABLE":
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot, color: '#999999'}});
          break;
          default:
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot, color: this.theme.yellow}});
          break;
        }
      }

      // Also check slot status
      const elements = this.system.rearIndex && disk.enclosure.number == this.system.rearIndex ?  this.system.enclosures[disk.enclosure.number].elements : this.system.enclosures[disk.enclosure.number].elements[0].elements
      const slot = elements.filter(s => s.slot == disk.enclosure.slot)
      
      if(!failed && slot.fault){
        failed = true;
      }

      if(failed){
        enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot, color: this.theme.red}});
      } 

  }

  getUnhealthyPools(){
    let sickPools = [];
    const pools = this.system.pools.forEach((pool, index) => {
      const healthy = pool.healthy;
      const inCurrentEnclosure = index == this.selectedEnclosure.poolKeys[pool.name];
      if(!healthy && inCurrentEnclosure){
        sickPools.push(pool);
      }
    });
    return sickPools;
  }

  getDiskFailures(enclosure: any = this.enclosure){
    let failedDisks = [];
    let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;

    let analyze = (disk, index) => {
      let failed: boolean = false;
      let reasons = [];

      // Health based on disk.status
      if(disk && disk.status && disk.status == 'FAULT'){
            failed = true;
            reasons.push("Disk Status is 'FAULT'");
      }

      // Also check slot status
      const elements = this.system.rearIndex && disk.enclosure.number == this.system.rearIndex ?  this.system.enclosures[disk.enclosure.number].elements : this.system.enclosures[disk.enclosure.number].elements[0].elements
      const slot = elements.filter(s => s.slot == disk.enclosure.slot)
      
      if(!failed && slot.fault){
        failed = true;
      }

      if(failed){
        const location = this.subenclosure && disk.enclosure.number == this.system.rearIndex ? 'rear' : 'front';
        const failure: DiskFailure = { disk: disk.name, enclosure: disk.enclosure.number, slot: disk.enclosure.slot, location: location} 
        failedDisks.push(failure);
      }
    }


    if(this.subenclosure){
      // If this is a head unit with rear bays, treat both enclosures as single unit
      this.system.profile[this.system.headIndex].disks.forEach((disk, index) =>{
        analyze(disk, index);
      });

      this.system.profile[this.system.rearIndex].disks.forEach((disk, index) =>{
        analyze(disk, index);
      });
    } else {
      selectedEnclosure.disks.forEach((disk, index) =>{
        analyze(disk, index);
      });
    }

    this.failedDisks = failedDisks;
  }

  setDisksPoolState(){
    let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;
    this.setDisksDisabled();
    let keys = Object.keys(selectedEnclosure.poolKeys);
    if(keys.length > 0){
      selectedEnclosure.disks.forEach((disk, index) => {
        if(disk.enclosure.slot < this.enclosure.slotRange.start || disk.enclosure.slot > this.enclosure.slotRange.end){return};
        if(!disk.vdev){return};
        let pIndex = disk.vdev.poolIndex;
        this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot , color: this.theme[this.theme.accentColors[pIndex]]} });
      });
    } else {
      return;
    }
  }

  converter(size: number){
    let gb = size / 1024 / 1024/ 1024;
    if(gb > 1000){
      let tb = gb / 1024;
      return tb.toFixed(2) + " TB";
    } else {
      return gb.toFixed(2) + " GB";
    }
  }

  findDiskBySlotNumber(slot:number){
    let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;
    let disk;
    for(let i in selectedEnclosure.disks){
      if(selectedEnclosure.disks[i].enclosure.slot == slot) {
        disk = selectedEnclosure.disks[i];
        return disk;
      }
    }

  }

  toggleHighlightMode(mode:string){
    if(this.selectedDisk.status == 'AVAILABLE'){ return; }

    this.labels.events.next({
      name: mode == 'on' ? 'EnableHighlightMode' : 'DisableHighlightMode',
      sender:this
    })
  }

  showPath(devname){
    // show the svg path
    this.labels.events.next({
      name:'ShowPath', 
      data:{ devname:devname, overlay: this.domLabels}, 
      sender: this
    });
  }

  hidePath(devname){
    this.labels.events.next({
      name:'HidePath',
      data:{devname: devname, overlay: this.domLabels},
      sender: this
    });
  }

  highlightPath(devname){
    // show the svg path
    this.labels.events.next({
      name:'HighlightDisk', 
      data:{ devname:devname, overlay: this.domLabels}, 
      sender: this
    });
  }

  unhighlightPath(devname){
    // show the svg path
    this.labels.events.next({
      name:'UnhighlightDisk', 
      data:{ devname:devname, overlay: this.domLabels}, 
      sender: this
    });
  }
  

  toggleSlotStatus(kill?: boolean){
    let selectedEnclosure = this.subenclosure ? this.subenclosure : this.selectedEnclosure;
    let enclosure_id = this.system.enclosures[selectedEnclosure.enclosureKey].id;
    let slot = this.selectedDisk.enclosure.slot;
    let status = !this.identifyBtnRef && !kill ? "IDENTIFY" : "CLEAR";
    let args = [enclosure_id, slot, status];

    // Arguments are Str("enclosure_id"), Int("slot"), Str("status", enum=["CLEAR", "FAULT", "IDENTIFY"])
    this.core.emit({name: 'SetEnclosureSlotStatus',data: args, sender: this}); 
    
    this.radiate();
  }
  
  radiate(kill?:boolean){ 
    // Animation
    if(this.identifyBtnRef){

      // kill the animation
      this.identifyBtnRef.animation.seek(0);
      this.identifyBtnRef.animation.stop(this.identifyBtnRef.styler);
      this.identifyBtnRef = null;
      return ;

    } else if(!this.identifyBtnRef && !kill) {

      let btn = styler(this.details.nativeElement.querySelector('#identify-btn'), {});
      let startShadow = btn.get('box-shadow');

      const elementBorder = value({borderColor: '', borderWidth: 0 }, ({ borderColor, borderWidth }) => btn.set({
        boxShadow: `0 0 0 ${borderWidth}px ${borderColor}` 
      }));

      // Convert color to rgb value
      let cc = this.hexToRGB(this.theme.cyan);
      const animation = keyframes({
        values: [
          { borderWidth: 0, borderColor: 'rgb(' + cc.rgb[0] +', ' + cc.rgb[1] +', ' + cc.rgb[2] +')' },
          { borderWidth: 30, borderColor: 'rgb(' + cc.rgb[0] +', ' + cc.rgb[1] + ', ' + cc.rgb[2] + ', 0)' } 
        ],
        duration:1000,
        loop: Infinity
      }).start(elementBorder);

      this.identifyBtnRef = { animation: animation, originalState: startShadow, styler: elementBorder};

    }
  }

  hexToRGB(str) {
    var spl = str.split('#');
    var hex = spl[1];
    if(hex.length == 3){
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    var value = '';
    var rgb = [];
    for(let i = 0; i < 6; i++){
      let mod = i % 2;
      let even = 0;
      value += hex[i];
      if(mod !== even){
        rgb.push(parseInt(value, 16))
        value = '';
      }
    }
    return {
      hex:hex,
      rgb:rgb
    }
  }

  onResize(evt){
    this.resizeView();
  }

  resizeView(override?: string){
    const visualizer = this.overview.nativeElement.querySelector('#visualizer');
    const left = this.cardWidth < 960 ? ((960 - this.cardWidth) / 2 * -1) : 0;

    setTimeout(() => {
      visualizer.style.left = left.toString() + 'px';
      this.cdr.detectChanges(); // Force change detection
    }, 50);
  }

  enclosureOverride(view: string){
    if(view !== this.view){
      this.loadEnclosure(this.selectedEnclosure, view);
    }
  }

  setEnclosureLabel(value?: string){
    let enclosure = this.system.enclosures[this.selectedEnclosure.enclosureKey];
    if(!value){
      value = enclosure.name;
    }

    let args = {index: this.selectedEnclosure.enclosureKey, id: enclosure.id, label: value};
    this.controllerEvents.next({name: "SetEnclosureLabel", data: args, sender: this});
  }

  labelForm(){
    let self = this;

    const obj = self.system.enclosures[self.selectedEnclosure.enclosureKey];
    const currentLabel = obj.label !== obj.name ? obj.label : self.selectedEnclosure.model;
    let conf = {
      title: T("Change Enclosure Label"),
      fieldConfig: [
        {
          type : 'input',
          inputType: 'text',
          value: currentLabel,
          name : 'label',
          required: false,
          placeholder: "Enclosure Label",
          relation : [
            {
              action : 'DISABLE',
              when : [{
                name : 'reset',
                value : true,
              }],
            }
          ],
        },
        {
          type : 'checkbox',
          value: false,
          name : 'reset',
          placeholder: "Reset to default",
        },
      ],
      saveButtonText: T('SAVE'),
      customSubmit: function (entityDialog) {
        self.pendingDialog = entityDialog;
        entityDialog.loader.open();
        self.setEnclosureLabel(entityDialog.formValue.label);
      },
    }

    this.dialogService.dialogForm(conf);

  }

}
