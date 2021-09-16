import { Point } from 'pixi.js';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class R10 extends Chassis {
  constructor() {
    super();
    this.model = 'r10';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/r10/r10_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r10/r10_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r10/r10_960w_drivetray_handle.png';

    this.front.totalDriveTrays = 16;
    this.front.columns = 4;
    this.front.rows = 4;

    this.front.gapX = 5;
    this.front.chassisOffsetX = 0; // -44;
    this.front.driveTraysOffsetX = 22; // -22
    this.front.driveTraysOffsetY = -24;

    const fscale = 1.27;
    this.front.driveTrays.scale = { x: fscale, y: fscale } as Point;
    this.front.chassisScale = { x: 1.15, y: 1.15 };
  }
}
