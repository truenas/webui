import { Container, Transform } from 'pixi.js';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class Es60 extends Chassis {
  constructor() {
    super();
    this.model = 'es60';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es60/es60_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es60/es60_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es60/es60_960w_drivetray_handle.png';
    this.front.driveTraysOffsetY = -40;
    this.front.totalDriveTrays = 60;
    this.front.rows = 12;
    this.front.columns = 5;

    // Scale drives to chassis
    this.front.driveTrays.scale.y = 1.1;
    this.front.chassisScale = { y: 0.98 };

    this.front.layout = {
      generatePosition: (
        displayObject: Container,
        index: number,
        offsetX: number,
        offsetY: number,
      ) => {
        const mod = index % this.front.rows;
        const nextPositionX = Math.floor(index / this.front.rows) * (displayObject.width + this.front.gapX) + offsetX;
        const nextPositionY = mod * (displayObject.height + this.front.gapY) + offsetY;

        return { x: nextPositionX, y: nextPositionY };
      },
    };

    this.generatePerspectiveOffset();
  }

  generatePerspectiveOffset(): void {
    (this.front.driveTrays.transform as Transform).position.x = 32;
    (this.front.driveTrays.transform as Transform).position.y = 32;
  }
}
