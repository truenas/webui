import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class M50Rear extends Chassis {

  constructor(){
    super();
    this.model = "m50";
    this.driveTrays.scale = {x: 0.88, y: 0.88};
    this.driveTraysOffsetX = -16;
    this.driveTraysOffsetY = -65;
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/m50/m50_rear_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.totalDriveTrays = 4;
    this.columns = 1;
    this.rows = 4;
    //this.load();
  }

}
