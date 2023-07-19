import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class F60 extends Chassis {
  constructor() {
    super();
    this.model = 'f60';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/f60/f60_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/f60/f60_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/f60/f60_960w_drivetray_handle.png';

    const chassisScale = 0.95;
    this.front.chassisScale = { x: chassisScale, y: chassisScale };
    this.front.chassisOffsetX = 5;

    this.front.driveTraysOffsetX = 45;
    this.front.driveTraysOffsetY = -57;
    this.front.gapX = 3;
    const driveTrayScale = 0.87;
    this.front.driveTrays.scale.x = driveTrayScale;
    this.front.driveTrays.scale.y = driveTrayScale;

    this.front.totalDriveTrays = 24;
    this.front.rows = 1;
    this.front.columns = 24;
  }
}
