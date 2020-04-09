import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class ES12 extends Chassis {

  constructor(){
    super();
    this.model = "es12";

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/es12/es12_960w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/es12/es12_960w_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/es12/es12_960w_drivetray_handle.png"
    this.front.totalDriveTrays = 12;
    this.front.driveTraysOffsetY = -44;
  }

}
