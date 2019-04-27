import { Component, OnInit, AfterViewInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture} from 'pixi.js';
//import 'pixi-filters';
import 'pixi-projection';
import { VDevLabels } from 'app/core/classes/hardware/vdev-labels';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { M50 } from 'app/core/classes/hardware/m50';
import { DiskComponent } from './disk.component';
import { SystemProfiler } from './system-profiler';
import { ExampleData } from './example-data';
//declare const PIXI: any;

@Component({
  selector: 'enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('disksoverview') overview: ElementRef;
  @ViewChild('disksdetails') details: ElementRef;
  @ViewChild('domLabels') domLabels: ElementRef;
  public app;
  private renderer;
  private loader = PIXI.loader;
  private resources = PIXI.loader.resources;
  public container;
  public system: SystemProfiler;
  protected enclosure: any; // Visualization
  public selectedEnclosure: any;

  private _selectedVdev: any;
  get selectedVdev(){
    return this._selectedVdev;
  }
  set selectedVdev(value) {
    this._selectedVdev = value;
    this.selectedVdevDisks = value ? Object.keys(this.selectedVdev.disks) : null;
  }

  public selectedVdevDisks: string[];
  public selectedDisk: any;

  public theme: any;
  public currentView: string = 'status'; // pools || status || expanders || details
  private labels: VDevLabels;
  
 

  constructor(public el:ElementRef, private core: CoreService /*, private ngZone: NgZone*/) { 

    core.register({observerClass: this, eventName: 'ThemeData'}).subscribe((evt:CoreEvent) => {
      this.theme = evt.data;
    });

    core.register({observerClass: this, eventName: 'ThemeChanged'}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      this.theme = evt.data;
      this.setCurrentView(this.currentView);
    });

    core.register({observerClass: this, eventName: 'PoolData'}).subscribe((evt:CoreEvent) => {
      this.system.pools = evt.data;
      console.log(this.system);
    });


    core.register({observerClass: this, eventName: 'DisksData'}).subscribe((evt:CoreEvent) => {
      //console.log(evt);
      // SIMULATED DATA
      /*let edata = new ExampleData();
      edata.addEnclosure(24); //  M50 24 slots
      edata.addEnclosure(12); // ES12 12 slots
      let data = edata.generateData();*/
      // END SIMULATED DATA

      let data = evt.data;
      this.system = new SystemProfiler('M50', data);
      this.selectedEnclosure = this.system.profile[0];
      //console.log(this.system);
      core.emit({name: 'PoolDataRequest', sender: this});
      this.pixiInit();
    });

    core.register({observerClass: this, eventName: 'SysInfo'}).subscribe((evt:CoreEvent) => {

      core.emit({name: 'DisksRequest', sender: this});
    });

    core.emit({name: 'ThemeDataRequest', sender: this});
    core.emit({name: 'SysInfoRequest', sender: this});

  }

  /* TESTING ONLY */
  clearDisk(){
    this.selectedDisk = null;
    this.setCurrentView('status');
  }

  ngAfterViewInit() {
    //this.pixiInit();
  }

  ngOnChanges(changes:SimpleChanges){
    console.log(changes);
  }

  ngOnDestroy(){
    this.core.unregister({observerClass: this});
    this.destroyEnclosure();
    this.app = null;
    //Object.keys(PIXI.utils.TextureCache).forEach(function(texture) {  PIXI.utils.TextureCache[texture].destroy(true);});
  }

  pixiInit(){
    //this.ngZone.runOutsideAngular(() => {
      PIXI.settings.PRECISION_FRAGMENT = 'highp'; //this makes text looks better? Answer = NO
      this.app = new PIXI.Application({
        width:960,
        height:304,
        forceCanvas:false,
        transparent:true,
        antialias:true,
        autoStart:true
      });
    //});

    this.renderer = this.app.renderer;
    this.app.renderer.backgroundColor = 0x000000;
    this.overview.nativeElement.appendChild(this.app.view);

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.container.width = this.app.stage.width;
    this.container.height = this.app.stage.height;

    this.createEnclosure();
  }

  createEnclosure(){
    this.enclosure = new M50();
    this.enclosure.events.subscribe((evt) => {
      switch(evt.name){
        case "Ready":
          this.container.addChild(this.enclosure.container);
          this.enclosure.container.name = this.enclosure.model;
          this.enclosure.container.width = this.enclosure.container.width / 2;
          this.enclosure.container.height = this.enclosure.container.height / 2;
          this.enclosure.container.x = this.app._options.width / 2 - this.enclosure.container.width / 2;
          this.enclosure.container.y = this.app._options.height / 2 - this.enclosure.container.height / 2;

          //this.setDisksEnabledState();
          //this.setDisksDisabled();
          this.setCurrentView(this.currentView);
        break;
        case "DriveSelected":
          //console.log(evt);
          //console.log(this.enclosure);
          //console.log(this.system.profile);
          //this.currentView = 'details';
          let disk = this.selectedEnclosure.disks[evt.data.id]; // should match slot number
          if(this.enclosure.driveTrayObjects[evt.data.id].enabled){
            this.selectedDisk = disk;
            this.setCurrentView('details');
            //this.setDisksDisabled();
            //this.setDisksHealthState();
            
            //this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: evt.data.id, color: '#0000CC'}}); // Just for testing
            //console.log(disk);
          }
        break;
      }
    });

    if(!this.resources[this.enclosure.model]){
      //this.importAsset('m50','assets/images/hardware/m50/m50_960w.png');
      this.importAsset(this.enclosure.model,this.enclosure.chassisPath);
    } else {
      this.onImport(); 
    }

    //this.simpleImport();
  }

  destroyEnclosure(){
    // Clear out assets
    this.container.destroy(true);
    PIXI.loader.resources = {};
  }

  makeDriveTray():DriveTray{
    //let dt = new DriveTray("m50");
    let dt = this.enclosure.makeDriveTray();
    return dt;
  }

  /*simpleImport(){
    // This method requires more investigation. 
    // Image doesn't show up on stage unless I 
    // navigate away and back again. 
    // Maybe it isn't triggering change detection in Angular?
    // console.log("Simple Import...");
    let texture = PIXI.Texture.fromImage('assets/images/hardware/m50/m50_960w.png');
    let sprite = new PIXI.Sprite(texture);
     sprite.width = 480;
     sprite.height = sprite.height * (480 / 960);
     sprite.x = 0;
     sprite.y = 0;
    sprite.name="m50_sprite"
    // console.log(sprite);
    this.container.addChild(sprite);
    // console.log(this.app.stage.children);
  }*/

  importAsset(alias, path){
    // NOTE: Alias will become the property name in resources
    this.loader
      .add(alias, path) //.add("catImage", "assets/res/cat.png")
      .on("progress", this.loadProgressHandler)
      .load(this.onImport.bind(this));
  }

  onImport(){
    let sprite = PIXI.Sprite.from(this.resources.m50.texture.baseTexture);
    sprite.width = 480;
    sprite.height = sprite.height * (480 / 960);
    sprite.x = 0;
    sprite.y = 0;
    sprite.name=this.enclosure.model + "_sprite"
    sprite.alpha = 0.1;
    this.container.addChild(sprite);

    //let dt = this.makeDriveTray();
    let dt = this.enclosure.makeDriveTray();
    this.container.addChild(dt.container);
    //this.updatePIXI();
    this.setCurrentView('status');
    
  }

  loadProgressHandler(loader, resource) {

    // Display the file `url` currently being loaded
    // console.log("loading: " + resource.url);

    // Display the percentage of files currently loaded

    // console.log("progress: " + loader.progress + "%");

    // If you gave your files names as the first argument
    // of the `add` method, you can access them like this

    // console.log("loading: " + resource.name);

  }



  /*updatePIXI(){
    //this.app.renderer.render(this.app.stage);
    this.renderer.render(this.app.stage);
    requestAnimationFrame(this.updatePIXI.bind(this));
  }*/

  setCurrentView(opt: string){
    // pools || status || expanders || details
    this.currentView = opt;
    if(this.labels){
      // Start exit animation
      this.labels.exit();
      //this.labels = null;
    }
    
    switch(this.currentView){
      case 'pools':
        //this.setDisksDisabled();
        this.setDisksPoolState();
      break
      case 'status':
        this.setDisksDisabled();
        this.setDisksHealthState();
      break
      case 'expanders':
      break
      case 'details':
        this.setDisksDisabled();
        this.setDisksHealthState(this.selectedDisk.enclosure_slot);
        let vdev = this.system.getVdevInfo(this.selectedDisk.devname);
        this.selectedVdev = vdev;

        this.labels = new VDevLabels(this.enclosure, this.app, this.theme.blue/*, dl*/);

        this.labels.events.next({name:"LabelDrives", data: vdev, sender: this});
        let dl;
        //if(!this.domLabels){
          setTimeout(() => {
            dl = this.domLabels//.nativeElement
            this.labels.events.next({name:"OverlayReady", data: {vdev: vdev, overlay:dl}, sender: this});
          }, 100 );
        /*} else {
            dl = this.domLabels.nativeElement
            this.labels.events.next({name:"OverlayReady", data: {vdev: vdev, overlay:dl}, sender: this});
        }*/

        this.labels.events.subscribe((evt:CoreEvent) => {
          // Labels exit animation is complete so we remove the instance
          if(evt.name == "LabelsDestroyed"){
            this.labels = null;
            this.selectedVdev = null;
          }
        });
      break
    }
  }

  setDisksEnabledState(){
    this.enclosure.driveTrayObjects.forEach((dt, index) =>{
      let disk = this.selectedEnclosure.disks[index];
      dt.enabled = disk ? true : false;
      //console.log(dt);
    })
  }

  setDisksDisabled(){
    this.enclosure.driveTrayObjects.forEach((dt, index) =>{
      let disk = this.selectedEnclosure.disks[index];
      //dt.enabled = false;
      //console.log(dt);
      this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: 'none'}});
    });
  }

  setDisksHealthState(slot?: number){ // Give it a slot number and it will only change that slot

    if(slot || typeof slot !== 'undefined'){
      this.setDiskHealthState(slot);
      return;
    }

    this.enclosure.driveTrayObjects.forEach((dt, index) =>{
      this.setDiskHealthState(index)
    });

  }

  setDiskHealthState(index: number){

      let disk = this.selectedEnclosure.disks[index];
      this.enclosure.driveTrayObjects[index].enabled = disk ? true : false;

      if(disk && disk.status){
        switch(disk.status){
          case "ONLINE":
            //dt.color = this.theme.green;
            this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: this.theme.green}});
          break;
          case "FAULT":
            //dt.color = this.theme.red;
            this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: this.theme.red}});
          break;
          default:
            this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: this.theme.yellow}});
          break
        }

      }
  }

  setDisksPoolState(){
    this.setDisksDisabled();

    this.selectedEnclosure.disks.forEach((disk, index) => {
      let pIndex = disk.vdev.poolIndex;
      this.enclosure.events.next({name:"ChangeDriveTrayColor", data:{id: index, color: this.theme[this.theme.accentColors[pIndex]]}});
    });
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

}
