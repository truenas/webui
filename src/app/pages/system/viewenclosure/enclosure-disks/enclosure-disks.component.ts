import { Component, Input, OnInit, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture, utils} from 'pixi.js';
import 'pixi-projection';
import { VDevLabelsSVG } from 'app/core/classes/hardware/vdev-labels-svg';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { M50 } from 'app/core/classes/hardware/m50';
import { ES12 } from 'app/core/classes/hardware/es12';
import { E16 } from 'app/core/classes/hardware/e16';
import { E24 } from 'app/core/classes/hardware/e24';
import { ES24 } from 'app/core/classes/hardware/es24';
import { E60 } from 'app/core/classes/hardware/e60';
import { ES60 } from 'app/core/classes/hardware/es60';
import { DiskComponent } from './components/disk.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { tween, easing, styler, value, keyframes } from 'popmotion';
import { Subject } from 'rxjs';
import { ExampleData } from './example-data';
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksComponent implements AfterContentInit, OnChanges, OnDestroy {

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

  protected enclosure: any; // Visualization

  private _expanders: any[] = [];
  get expanders () {
    if(this.system.enclosures){
      let enclosureNumber =  Number(this.selectedEnclosure.disks[0].enclosure.number);
      return this.system.getEnclosureExpanders(enclosureNumber);
    } else {
      return this._expanders;
    }
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
    return Object.keys(this.selectedEnclosure.poolKeys);
  }

  public selectedVdevDisks: string[];
  public selectedDisk: any;

  public theme: any;
  public currentView: string; // pools || status || expanders || details
  public exitingView: string; // pools || status || expanders || details
  private defaultView = 'pools';
  private labels: VDevLabelsSVG;
  private identifyBtnRef: any;
  
  get cardWidth(){
    return this.overview.nativeElement.offsetWidth;
  }
 
  get cardScale(){
    const scale = this.cardWidth / 960;
    return scale > 1 ? 1 : scale;
  }

  public scaleArgs: string;
 

  constructor(public el:ElementRef, private core: CoreService, public sanitizer: DomSanitizer,  public mediaObserver: MediaObserver, public cdr: ChangeDetectorRef){

    //this.mediaObs = mediaObserver.media$.subscribe((evt) =>{
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

    core.register({observerClass: this, eventName: 'EnclosureSlotStatusChanged'}).subscribe((evt:CoreEvent) => {
    });

    core.register({observerClass: this, eventName: 'ThemeData'}).subscribe((evt:CoreEvent) => {
      this.theme = evt.data;
    });

    core.register({observerClass: this, eventName: 'ThemeChanged'}).subscribe((evt:CoreEvent) => {
      this.theme = evt.data;
      this.setCurrentView(this.currentView);
      if(this.labels && this.labels.events){
        this.labels.events.next(evt);
      }
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
      }
    });

    console.log(this.system);
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
      this.destroyEnclosure();

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
          
        this.createEnclosure(); 
      }
      
    }
  }

  ngOnDestroy(){
    this.core.unregister({observerClass: this});
    this.destroyAllEnclosures();
    this.app.stage.destroy(true);
    this.app.destroy(true, true); 
    //this.mediaObs.unsubscribe();
  }

  pixiInit(){
      PIXI.settings.PRECISION_FRAGMENT = 'highp'; //this makes text looks better? Answer = NO
      PIXI.utils.skipHello();
      this.app = new PIXI.Application({
        width: 960 ,
        height:304 ,
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

  createEnclosure(){

    switch(this.selectedEnclosure.model){
      case "M Series":
        this.enclosure = new M50();
        break;
      case "X Series":
      case 'ES12':
        this.enclosure = new ES12();
        break;
      case "Z Series":
      case 'E16':
        this.enclosure = new E16();
      break;
      case "ES24":
        this.enclosure = new ES24();
        break;
      case "E24":
        this.enclosure = new E24();
        break;
      case "ES60":
        this.enclosure = new ES60();
        break;
      case "E60":
        this.enclosure = new E60();
        break;
      default:
        console.warn("DEFAULT ENCLOSURE")
        this.enclosure = new M50();
    }
    //this.enclosure = new ES24();
    
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
          
          
        break;
        case "DriveSelected":
          let dtSlot = parseInt(evt.data.id ) + 1
          if(this.identifyBtnRef){
            this.toggleSlotStatus(true);
            this.radiate(true);
          }

          let disk = this.findDiskBySlotNumber(dtSlot);
          if(disk == this.selectedDisk){break} // Don't trigger any changes if the same disk is selected
          if(this.enclosure.driveTrayObjects[evt.data.id].enabled){
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
    let enclosure;
    switch(profile.model){
      case "M Series":
        enclosure = new M50();
        break;
      case "X Series":
      case 'ES12':
        enclosure = new ES12();
        break;
      case "Z Series":
      case 'E16':
        enclosure = new E16();
        break;
      case "E24":
        enclosure = new E24();
        break;
      case "ES24":
        enclosure = new ES24();
        break;
      case "ES60":
        enclosure = new ES60();
        break;
      case "E60":
        enclosure = new E60();
        break;
      default:
        console.log(profile.model);
        enclosure = new ES24();
    }
    
    enclosure.events.subscribe((evt) => {
      switch(evt.name){
        case "Ready":
          this.container.addChild(enclosure.container);
          enclosure.container.name = enclosure.model + "_for_extraction";
          enclosure.container.width = enclosure.container.width / 2;
          enclosure.container.height = enclosure.container.height / 2;
          enclosure.container.x = 0; //this.app._options.width / 2 - enclosure.container.width / 2;
          enclosure.container.y = 0; //this.app._options.height / 2 - enclosure.container.height / 2;
          enclosure.chassis.alpha = 0.35;

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
        this.setDisksHealthState();
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

  setDisksEnabledState(enclosure?){
    if(!enclosure){enclosure = this.enclosure}
    enclosure.driveTrayObjects.forEach((dt, index) =>{
      let disk = this.findDiskBySlotNumber(index + 1);
      dt.enabled = disk ? true : false;
    });
  }

  setDisksDisabled(){
    this.enclosure.driveTrayObjects.forEach((dt, index) =>{
      let disk = this.selectedEnclosure.disks[index];
      this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: 'none'}});
    });
  }

  setDisksHealthState(disk?: any){ // Give it a disk and it will only change that slot
    if(disk || typeof disk !== 'undefined'){
      this.setDiskHealthState(disk); // Enclosure slot numbers start at 1
      return;
    }

    this.selectedEnclosure.disks.forEach((disk, index) =>{
      this.setDiskHealthState(disk)
    });

  }

  setDiskHealthState(disk: any, enclosure?: any){
      if(!enclosure){
        enclosure = this.enclosure
      }
      
      let index = disk.enclosure.slot - 1;
      if(!enclosure.driveTrayObjects[index]){
        console.warn("There is no driveTray at index " + index + " on model " + enclosure.model + "!");
        return;
      } else {
        enclosure.driveTrayObjects[index].enabled = disk.enclosure.slot ? true : false;
      }

      if(disk && disk.status){
        switch(disk.status){
          case "ONLINE":
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot - 1, color: this.theme.green}});
          break;
          case "FAULT":
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot - 1, color: this.theme.red}});
          break;
          case "AVAILABLE":
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot - 1, color: '#999999'}});
          break;
          default:
            enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot - 1, color: this.theme.yellow}});
          break
        }

      }
  }

  setDisksPoolState(){
    this.setDisksDisabled();
    let keys = Object.keys(this.selectedEnclosure.poolKeys);
    if(keys.length > 0){
      this.selectedEnclosure.disks.forEach((disk, index) => {
        if(!disk.vdev){return};
        let pIndex = disk.vdev.poolIndex;
        this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: disk.enclosure.slot - 1, color: this.theme[this.theme.accentColors[pIndex]]}});
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
    let disk;
    for(let i in this.selectedEnclosure.disks){
      if(this.selectedEnclosure.disks[i].enclosure.slot == slot) {
        disk = this.selectedEnclosure.disks[i];
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
    let enclosure_id = this.system.enclosures[this.selectedEnclosure.enclosureKey].id;
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

}
