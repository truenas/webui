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
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r30/r30_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;
    this.front.columns = 6;
    this.front.rows = 2;

    this.front.gapX = 1;
    this.front.gapY = 3;
    this.front.chassisOffsetX = 0;
    this.front.driveTraysOffsetX = 45;
    this.front.driveTraysOffsetY = 130;

    const fscale = 1.4;
    this.front.driveTrays.scale = { x: fscale, y: fscale } as Point;
    this.front.chassisScale = { x: fscale, y: fscale };
    this.front.disabledOpacity = 0.2;

    // Rear (Actually internal)
    this.rear = new ChassisView();
    this.rear.totalDriveTrays = 4;

    this.rear.driveTraysOffsetX = 360;
    this.rear.driveTraysOffsetY = 30;
    this.rear.gapX = 5;

    const rscale = 1.2;
    this.rear.driveTrays.scale = { x: rscale, y: rscale } as Point;
    this.rear.chassisScale = { x: 1.4, y: 1.4 };
    this.rear.disabledOpacity = 0.3;

    this.rear.container = new PIXI.Container();

    this.rear.chassisPath = 'assets/images/hardware/r30/r30_rear_960w.png';
    this.rear.driveTrayBackgroundPath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';
    this.rear.driveTrayHandlePath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';

    this.rear.columns = 2;
    this.rear.rows = 2;
    this.rear.slotRange = { start: 13, end: 16 };

    this.rear.totalDriveTrays = 4;
  }
}
