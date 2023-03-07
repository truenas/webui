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
    this.internal = new ChassisView();
    this.internal.totalDriveTrays = 4;

    this.internal.driveTraysOffsetX = 360;
    this.internal.driveTraysOffsetY = 30;
    this.internal.gapX = 5;

    const iscale = 1.2;
    this.internal.driveTrays.scale = { x: iscale, y: iscale } as Point;
    this.internal.chassisScale = { x: 1.4, y: 1.4 };
    this.internal.disabledOpacity = 0.3;
    this.internal.chassisOpacity = 0.6;

    this.internal.container = new PIXI.Container();

    this.internal.chassisPath = 'assets/images/hardware/r30/r30_internal_960w.png';
    this.internal.driveTrayBackgroundPath = 'assets/images/hardware/r30/r30_960w_drivetray_bg.png';
    this.internal.driveTrayHandlePath = 'assets/images/hardware/r30/r30_960w_drivetray_handle.png';

    this.internal.columns = 2;
    this.internal.rows = 2;
    this.internal.slotRange = { start: 13, end: 16 };

    this.internal.totalDriveTrays = 4;
  }
}
