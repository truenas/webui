import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class R40 extends Chassis {
  constructor() {
    super();
    this.model = 'r40';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/r40/r40_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r40/r40_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r40/r40_960w_drivetray_handle.png';

    this.front.chassisScale = { x: 1.14, y: 1.04 };
    this.front.chassisOffsetX = -4;
    this.front.chassisOffsetY = 5;

    this.front.driveTraysOffsetX = 20;
    this.front.driveTraysOffsetY = -48;
    this.front.gapX = 2;
    this.front.driveTrays.scale.x = 1.115;
    this.front.driveTrays.scale.y = 1;

    this.front.totalDriveTrays = 48;
    this.front.rows = 1;
    this.front.columns = 48;
  }
}
