import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class ES12 extends Chassis {

  constructor(){
    super();
    this.model = "es12";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/es12/es12_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/es12/es12_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/es12/es12_960w_drivetray_handle.png"
    this.totalDriveTrays = 12;
    this.driveTraysOffsetY = -44;
    //this.driveTraysOffsetX = 14;
    //this.load();
  }

}
