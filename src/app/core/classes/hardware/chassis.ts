import { Container, Texture, Sprite } from 'pixi.js';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { DriveTray } from './drivetray';
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

interface Position {
  x: number;
  y: number;
}

export class Chassis {

  /*
   * Don't use this class directly.
   * Instead extend this class for each 
   * hardware unit with your customizations
   * */

   public container:Container;
   public events: Subject<CoreEvent>;
   public model: string;
   public driveTrays: any;
   public driveTrayObjects: DriveTray[] = [];
   public chassis:Sprite;
   public driveTray:DriveTray;

   protected chassisPath: string;
   protected driveTrayBackgroundPath: string;
   protected driveTrayHandlePath: string;
   protected totalDriveTrays: number;
   protected rows: number;
   protected columns: number;

   constructor(){
     this.container = new PIXI.Container();
     //this.driveTrays = new PIXI.Container();
     //this.driveTrays = new PIXI.projection.Container2d();
     this.driveTrays = new PIXI.projection.Sprite2d(PIXI.Texture.WHITE);
     this.events = new Subject<CoreEvent>();

     // defaults
     this.rows = 6;
     this.columns = 4;
   }

   load(){
     // LOAD OUR ASSETS
     PIXI.loader
       .add(this.model + "_chassis", this.chassisPath) //eg. .add("catImage", "assets/res/cat.png")
       .add(this.model + "_drivetray_bg", this.driveTrayBackgroundPath) //eg. .add("catImage", "assets/res/cat.png")
       .add(this.model + "_drivetray_handle", this.driveTrayHandlePath) //eg. .add("catImage", "assets/res/cat.png")
       .on("progress", this.loadProgressHandler)
       .load(this.onLoaded.bind(this));
   }

   onLoaded(){
     //let opacity = 0.5;
     // Render Chassis
     this.chassis = PIXI.Sprite.from(PIXI.loader.resources[this.model + "_chassis"].texture.baseTexture);
     this.chassis.name = this.model + '_chassis';
     this.chassis.alpha = 0;
     this.container.addChild(this.chassis);

     // Render DriveTrays
     for(let i = 0; i < this.totalDriveTrays; i++){
       let dt = this.makeDriveTray();
       //dt.background.tint = 0x666666;
       let position = this.generatePosition(dt.container, i);
       dt.container.x = position.x;
       dt.container.y = position.y;
       dt.background.alpha = 0;
       dt.handle.alpha = 0;
       this.driveTrays.addChild(dt.container);
       this.driveTrayObjects.push(dt);
     }

     this.driveTrays.x = 43;
     this.driveTrays.y = 78;
     this.driveTrays.name = this.model + "_drivetrays";
     this.container.addChild(this.driveTrays);
     //this.generatePerspective();

     this.onEnter();

     // Let the parent know class is ready.
     this.events.next({name: "Ready"});
     //this.events.complete();
   }

   onEnter(){
     const opacity = 0.5;
     const delay = 1000;
     const duration = 1000;
    
     setTimeout(() =>{
       const fade = (v) => this.chassis.alpha = v;
       tween({
         from: 0,//item.container.scale,
         to: opacity, //{ x: 300, rotate: 180 },
         duration:duration,
         //ease: easing.backOut
       }).start(fade);
     },delay)


     this.driveTrayObjects.forEach((item, index) => {
      // Staggered handles fade in  
      setTimeout(() =>{
        const updateAlpha = (v) => item.handle.alpha = v;
        tween({
          from: item.handle.alpha,
          to: 1, 
          duration: 1000,
          ease: easing.backOut,
          //flip: Infinity
        }).start(updateAlpha);
      }, 250 + (index * 15));

      // Staggered tray backgrounds fade in  
      setTimeout(() =>{
        const updateAlpha = (v) => item.background.alpha = v;
        tween({
          from: item.background.alpha,
          to: opacity, 
          duration: duration,
          ease: easing.backOut,
          //flip: Infinity
        }).start(updateAlpha);
      },delay);

     });

   }

   loadProgressHandler(){
     console.log( "PROGRESS: " + PIXI.loader.progress + "%");
   }

   makeDriveTray(){
     // EXAMPLE CODE:
     let dt = new DriveTray("myTnModel");
     dt.setup();
     return dt;
   }

   generatePosition(displayObject, index): Position{
     let gapX = 10;
     let gapY = 2;
     let mod = index % this.columns;
     let nextPositionX = mod * (displayObject.width + gapX);
     let nextPositionY = Math.floor(index / this.columns) * (displayObject.height + gapY);

     return {x: nextPositionX, y: nextPositionY}
   }

   generatePerspective(){
     let dts = this.driveTrays;

    //dts.anchor.set(0.5,0.5); // Set the pivot point to center
    /*dts.proj.setAxisY({
      x: 0, 
      y: dts.height * 0.5
    }, 5);*/
    let x = 0;
    let y = 0;
    let quad = [
      {x: x, y: y},//top left
      {x: x + dts.width, y: y },// top right
      {x: x + dts.width - 25, y: y + dts.height},// bottom right
      {x: x + 25, y: y + dts.height}// bottom left
    ];

    dts.proj.mapSprite(dts, quad);

    console.log(dts);
    console.log("width: " + dts.width + " height: " + dts.height);
   }

}
