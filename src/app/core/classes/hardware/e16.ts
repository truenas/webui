import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class E16 extends Chassis {

  constructor(){
    super();
    this.model = "e16";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/e16/e16_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/e16/e16_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/e16/e16_960w_drivetray_handle.png"
    this.totalDriveTrays = 16;
    //this.load();
  }

}
