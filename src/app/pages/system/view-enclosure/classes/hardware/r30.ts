import { Point } from 'pixi.js';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class R30 extends Chassis {
  constructor() {
    super();
    this.model = 'r30';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/r30/r30_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;
    this.front.columns = 6;
    this.front.rows = 2;

    this.front.gapX = 1;
    this.front.chassisOffsetX = 0; // -44;
    this.front.driveTraysOffsetX = 45; // -22
    this.front.driveTraysOffsetY = 128;

    const fscale = 1.4;
    this.front.driveTrays.scale = { x: fscale, y: fscale } as Point;
    this.front.chassisScale = { x: fscale, y: fscale };
    this.front.disabledOpacity = 0.3;

    // Rear (Actually internal)
    /*
    this.rear = new ChassisView();
    this.rear.totalDriveTrays = 4;

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
    */
  }
}
