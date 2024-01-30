import { Point } from 'pixi.js';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class H10 extends Chassis {
  constructor() {
    super();
    this.model = 'h10';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/h10/h10_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/h10/h10_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/h10/h10_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;
    this.front.columns = 4;
    this.front.rows = 3;

    this.front.driveTraysOffsetX = 5;
    this.front.driveTraysOffsetY = -60;
    const fscale = 1.16;
    this.front.driveTrays.scale = { x: fscale, y: fscale } as Point;
  }
}
