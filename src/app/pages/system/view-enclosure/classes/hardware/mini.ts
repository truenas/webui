import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class Mini extends Chassis {
  constructor() {
    super();
    this.model = 'mini';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/mini/mini_673w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/mini/mini_hdd_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/mini/mini_hdd_drivetray_bg.png';
    this.front.driveTraysOffsetX = 104;
    this.front.driveTraysOffsetY = 38;
    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 4;
    this.front.columns = 1;
    this.front.rows = 4;
  }
}
