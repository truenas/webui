import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { Application, Container, Text, DisplayObject, Graphics, Sprite, Texture} from 'pixi.js';
//import 'pixi-filters';
import 'pixi-projection';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { M50 } from 'app/core/classes/hardware/m50';
//declare const PIXI: any;

@Component({
  selector: 'enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksComponent implements AfterViewInit, OnDestroy {

  @ViewChild('disksoverview') overview: ElementRef;
  @ViewChild('disksdetails') details: ElementRef;
  public app;
  private renderer;
  private loader = PIXI.loader;
  private resources = PIXI.loader.resources;
  public container;
  public texture;
  public hardwareGraphic;

  constructor(public el:ElementRef/*, private ngZone: NgZone*/) { }

  ngAfterViewInit() {
    this.pixiInit();
  }

  ngOnDestroy(){
    // Clear out assets
    this.container.destroy(true);
    PIXI.loader.resources = {};
    this.app = null;
    //Object.keys(PIXI.utils.TextureCache).forEach(function(texture) {  PIXI.utils.TextureCache[texture].destroy(true);});
  }

  pixiInit(){
    //this.ngZone.runOutsideAngular(() => {
      this.app = new PIXI.Application({
        width:960,
        height:304,
        forceCanvas:false,
        transparent:false,
        antialias:true,
        autoStart:true
      });
    //});

    this.renderer = this.app.renderer;
    this.app.renderer.backgroundColor = 0x000000;
    //this.el.nativeElement.appendChild(this.app.view);
    this.overview.nativeElement.appendChild(this.app.view);

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.container.width = this.app.stage.width;
    this.container.height = this.app.stage.height;

    let m50 = new M50();
    m50.events.subscribe((evt) => {
      // console.log(evt);
      // console.log(this.app.stage.children);
      this.container.addChild(m50.container);
      m50.container.name = 'm50';
      m50.container.width = m50.container.width / 2;
      m50.container.height = m50.container.height / 2;
      m50.container.x = this.app._options.width / 2 - m50.container.width / 2;
      m50.container.y = this.app._options.height / 2 - m50.container.height / 2;
    });
    //m50.load(); // Sprites don't exist until load method is called

    if(!this.resources.m50){
      // console.log("resources.m50 does not exist");
      this.importAsset('m50','assets/images/hardware/m50/m50_960w.png');
    } else {
      // console.log("resources.m50 exists");
      this.onImport(); 
    }

    //this.simpleImport();

    //let square = this.makeTexture();
    //this.container.addChild(square);
  }

  makeDriveTray():DriveTray{
    let dt = new DriveTray("m50");
    return dt;
  }

  simpleImport(){
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
  }

  makeTexture(){
    let gfx = new PIXI.Graphics();
    gfx.beginFill(0xFFFFFF);
    gfx.drawRect(120,60,100,10);
    gfx.endFill();

    this.texture = this.renderer.generateTexture(gfx);
    let square = new PIXI.Sprite(this.texture);
    square.tint = 0xCC0000;
    // console.log(square);

    return square;
  }

  importAsset(alias, path){
    // console.log("Importing Asset...");
    this.loader
      .add(alias, path) //.add("catImage", "assets/res/cat.png")
      .on("progress", this.loadProgressHandler)
      .load(this.onImport.bind(this));
  }

  onImport(){
     // console.log("Asset loaded. Setting up as Sprite...");
     let sprite = PIXI.Sprite.from(this.resources.m50.texture.baseTexture);
     //let sprite = new PIXI.Sprite(this.resources.m50.texture);
     //let texture = PIXI.Texture.fromImage('assets/images/m50_1080p.png');
     //let sprite = new PIXI.Sprite(texture);
     sprite.width = 480;
     sprite.height = sprite.height * (480 / 960);
     sprite.x = 0;
     sprite.y = 0;
     //sprite.x = (this.container.width / 2) - (sprite.width / 2);
     //sprite.y = (this.container.height / 2) - (sprite.height / 2);
     sprite.name="m50_sprite"
     sprite.alpha = 0.1;
     // console.log(this.resources);
     // console.log(sprite);
     this.container.addChild(sprite);
     // console.log(this.app.stage.children);

     let dt = this.makeDriveTray();
     //dt.handle.tint = 0xCC0000;
     this.container.addChild(dt.container);
     //this.updatePIXI();
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



  updatePIXI(){
    //this.app.renderer.render(this.app.stage);
    this.renderer.render(this.app.stage);
    requestAnimationFrame(this.updatePIXI.bind(this));
  }

}
