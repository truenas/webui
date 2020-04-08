import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class M50Rear extends Chassis {

  constructor(){
    super();
    this.model = "m50";

    this.front = new ChassisView();
    this.front.driveTrays.scale = {x: 0.88, y: 0.88};
    this.front.driveTraysOffsetX = -16;
    this.front.driveTraysOffsetY = -65;
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/m50/m50_rear_960w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.front.totalDriveTrays = 4;
    this.front.columns = 1;
    this.front.rows = 4;
  }

}
