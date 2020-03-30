import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class MINI extends Chassis {

  constructor(){
    super();
    this.model = "mini";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/es12/es12_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/es12/es12_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/es12/es12_960w_drivetray_handle.png" 
    this.driveTraysOffsetY = -44;
    this.vertical = true;
    this.totalDriveTrays = 13;
    this.columns = 13;
    this.rows = 1;
  }

}
