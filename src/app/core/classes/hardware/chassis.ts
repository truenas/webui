import { Container, Texture, Sprite } from 'pixi.js';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { DriveTray } from './drivetray';

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
  public driveTrays: Container;
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
    this.driveTrays = new PIXI.Container();
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
    let opacity = 0.5;
    // Render Chassis
    this.chassis = PIXI.Sprite.from(PIXI.loader.resources[this.model + "_chassis"].texture.baseTexture);
    this.chassis.name = this.model + '_chassis';
    this.chassis.alpha = opacity;
    this.container.addChild(this.chassis);

    // Render DriveTrays
    for(let i = 0; i < this.totalDriveTrays; i++){
      let dt = this.makeDriveTray();
      //dt.background.tint = 0x666666;
      let position = this.generatePosition(dt.container, i);
      dt.container.x = position.x;
      dt.container.y = position.y;

      this.driveTrays.addChild(dt.container);
    }

    this.driveTrays.x = 43;
    this.driveTrays.y = 78;
    this.driveTrays.name = this.model + "_drivetrays";
    this.container.addChild(this.driveTrays);

    // Let the parent know class is ready.
    this.events.next({name: "Ready"});
    //this.events.complete();
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
    let gapX = 12;
    let gapY = 2;
    let mod = index % this.columns;
    let nextPositionX = mod * (displayObject.width + gapX);
    let nextPositionY = Math.floor(index / this.columns) * (displayObject.height + gapY);

    return {x: nextPositionX, y: nextPositionY}
  }
}
