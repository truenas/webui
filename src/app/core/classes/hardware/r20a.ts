import { Point } from 'pixi.js';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class R20A extends Chassis {
  constructor(rearChassis = false) {
    super();
    this.model = 'r20a';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();

    this.front.chassisPath = 'assets/images/hardware/r20a/r20a_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r20a/r20a_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r20a/r20a_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;

    const frontScale = 0.98;
    this.front.driveTrays.scale = { x: frontScale, y: frontScale } as Point;
    this.front.driveTraysOffsetX = 35;
    this.front.driveTraysOffsetY = -65;

    this.front.disabledOpacity = 0.15;

    if (rearChassis) {
      this.rear = new ChassisView();
      this.rear.totalDriveTrays = 2;

      this.rear.driveTraysOffsetX = 146;
      this.rear.driveTraysOffsetY = -63;
      this.rear.gapX = 5;

      this.rear.container = new PIXI.Container();

      this.rear.chassisPath = 'assets/images/hardware/r20a/r20a_rear_960w.png';
      this.rear.driveTrayBackgroundPath = 'assets/images/hardware/r20a/r20a_rear_960w_drivetray_bg.png';
      this.rear.driveTrayHandlePath = 'assets/images/hardware/r20a/r20a_rear_960w_drivetray_handle.png';

      this.rear.columns = 2;
      this.rear.rows = 1;
      this.rear.slotRange = { start: 13, end: 14 };

      this.rear.totalDriveTrays = 2;
    }
  }
}
