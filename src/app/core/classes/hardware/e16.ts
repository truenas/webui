import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis} from './chassis';
import { ChassisView } from './chassis-view';

export class E16 extends Chassis {

  constructor(){
    super();
    this.model = "e16";

    // Front Drive Bays
    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/e16/e16_960w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/e16/e16_960w_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/e16/e16_960w_drivetray_handle.png"
    this.front.driveTraysOffsetY = 32;
    this.front.driveTraysOffsetX = 14;

    this.front.totalDriveTrays = 16;
    this.front.slotRange = { start: 1, end: 16 };
  }

}
