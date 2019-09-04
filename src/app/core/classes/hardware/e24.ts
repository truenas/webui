import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class E24 extends Chassis {

  constructor(){
    super();
    this.model = "e24";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/e24/e24_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/e24/e24_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/e24/e24_960w_drivetray_handle.png"
    this.totalDriveTrays = 24;
    //this.load();
  }

}
