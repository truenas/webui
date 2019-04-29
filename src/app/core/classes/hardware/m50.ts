import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class M50 extends Chassis {

  constructor(){
    super();
    this.model = "m50";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/m50/m50_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.totalDriveTrays = 24;
    //this.load();
  }

}
