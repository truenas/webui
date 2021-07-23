import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class ES24F extends Chassis {
  constructor() {
    super();
    this.model = 'es24f';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es24f/es24f_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es24f/es24f_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es24f/es24f_960w_drivetray_handle.png';

    this.front.driveTraysOffsetX = 20;
    this.front.driveTraysOffsetY = 44;
    this.front.gapX = 2;
    this.front.driveTrays.scale.x = 1.22;
    this.front.driveTrays.scale.y = 1.05;
    this.front.chassisScale = { x: 1.075, y: 1.075 };

    this.front.totalDriveTrays = 24;
    this.front.rows = 1;
    this.front.columns = 24;
  }
}
