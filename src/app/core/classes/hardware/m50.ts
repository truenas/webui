import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class M50 extends Chassis {

  /*public container:Container;
  public model: string;
  public driveTrays: Container;
  public chassis:Sprite;
  public driveTray:DriveTray;

  protected totalDriveTrays
  protected chassisPath: string;*/

  constructor(){
    super();
    this.model = "m50";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/m50/m50_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.totalDriveTrays = 24;
    this.load();
  }

  makeDriveTray(){
    let dt = new DriveTray("m50");
    dt.setup();
    return dt;
  }

  /*load(){
    // LOAD OUR ASSETS
    PIXI.loader
      .add("chassis", chassisPath) //eg. .add("catImage", "assets/res/cat.png")
      .on("progress", this.loadProgressHandler)
      .load(this.onLoaded.bind(this));
  }*/

  /*onLoaded(){
    // Render Chassis
    let sprite = PIXI.Sprite.from(PIXI.loader.resources.chassis.texture.baseTexture);
    sprite.name = this.model + '_chassis';
    this.container.addChild(sprite);

    // Render DriveTrays
  }*/

  /*loadProgressHandler(){
  }*/

}
