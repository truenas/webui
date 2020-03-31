import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';

export class MINI extends Chassis {

  constructor(){
    super();
    this.model = "mini";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/mini/mini_673w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/mini/mini_hdd_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/mini/mini_hdddrivetray_handle.png" 
    this.driveTraysOffsetX = 104;
    this.driveTraysOffsetY = 38;
    this.vertical = false;
    this.chassisOpacity = 0.65;
    this.totalDriveTrays = 4;
    this.columns = 1;
    this.rows = 4;
  }

}
