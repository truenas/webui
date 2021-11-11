import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class R20B extends Chassis {
  constructor(rearChassis = false) {
    super();
    this.model = 'r20b';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/r20/r20_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r20/r20_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r20/r20_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;
    this.front.columns = 4;
    this.front.rows = 3;

    this.front.driveTraysOffsetX = 5;
    this.front.driveTraysOffsetY = -60;
    const fscale = 1.16;
    this.front.driveTrays.scale = { x: fscale, y: fscale };

    if (rearChassis) {
      this.rear = new ChassisView();
      this.rear.container = new PIXI.Container();

      const rscale = 1.1;
      this.rear.driveTrays.scale = { x: 1.1, y: 1.12 };
      this.rear.driveTraysOffsetX = 777;
      this.rear.driveTraysOffsetY = -50;

      this.rear.chassisPath = 'assets/images/hardware/r20/r20b_rear_960w.png';
      this.rear.driveTrayBackgroundPath = 'assets/images/hardware/r20/r20_rear_960w_drivetray_handle.png';
      this.rear.driveTrayHandlePath = 'assets/images/hardware/r20/r20_rear_960w_drivetray_handle.png';

      this.rear.slotRange = { start: 13, end: 14 };
      this.rear.totalDriveTrays = 2;
      this.rear.columns = 2;
      this.rear.rows = 1;
      this.rear.gapX = 5;
    }
  }
}
