import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class M50 extends Chassis {

  constructor(){
    super();
    this.model = "m50";

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/m50/m50_960w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.front.totalDriveTrays = 24;
    this.front.slotRange = { start: 5, end: 28 };

    this.rear = new ChassisView();
    this.rear.driveTrays.scale = {x: 0.88, y: 0.88};
    this.rear.driveTraysOffsetX = -16;
    this.rear.driveTraysOffsetY = -65;
    this.rear.container = new PIXI.Container();
    this.rear.chassisPath = "assets/images/hardware/m50/m50_rear_960w.png";
    this.rear.driveTrayBackgroundPath = "assets/images/hardware/m50/m50_960w_drivetray_bg.png" 
    this.rear.driveTrayHandlePath = "assets/images/hardware/m50/m50_960w_drivetray_handle.png"
    this.rear.columns = 1;
    this.rear.rows = 4;

    this.rear.totalDriveTrays = 4;
    this.rear.slotRange = { start: 1, end: 4 };
  }

}
