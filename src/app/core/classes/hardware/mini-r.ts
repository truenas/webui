import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class MINIR extends Chassis {
  constructor() {
    super();
    this.model = 'mini-r';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/mini_r/mini_r_1150w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/mini_r/mini_r_hdd_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/mini_r/mini_r_hdd_drivetray_handle.png';
    this.front.totalDriveTrays = 12;
    this.front.driveTraysOffsetY = -70;

    // Adjustments
    const chassisScale = 0.95;
    this.front.chassisScale = { x: chassisScale, y: chassisScale };
    const driveTrayScale = 0.89;
    this.front.driveTrays.scale = { x: driveTrayScale, y: driveTrayScale };
    this.front.driveTraysOffsetX = 10;
  }
}
