import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

export class R20A extends Chassis {
  constructor(rearChassis = false) {
    super();
    this.model = 'r20a';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();

    this.front.chassisPath = 'assets/images/hardware/r20a/r20a_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r20a/r20a_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r20a/r20a_960w_drivetray_handle.png';

    this.front.slotRange = { start: 1, end: 12 };
    this.front.totalDriveTrays = 12;

    const frontScale = 0.98;
    this.front.driveTrays.scale = { x: frontScale, y: frontScale };
    this.front.driveTraysOffsetX = 35;
    this.front.driveTraysOffsetY = -65;

    this.front.disabledOpacity = 0.15;

    this.front.layout = {
      generatePosition: (displayObject: Container, index: number, offsetX: number, offsetY: number, orientation: string) => {
        const gapX = 8;
        const gapY = 2;
        const rows = 3;

        const currentColumn = Math.floor(index / rows);
        const goingDown: boolean = currentColumn % 2 == 0;
        const currentRow: number = goingDown ? index % 3 : rows - (index % 3 + 1);

        const nextPositionX = offsetX + (displayObject.width + gapX) * currentColumn;
        const nextPositionY = offsetY + currentRow * (displayObject.height + gapY);

        return { x: nextPositionX, y: nextPositionY };
      },
    };

    if (rearChassis) {
      this.rear = new ChassisView();
      this.rear.totalDriveTrays = 2;

      this.rear.driveTraysOffsetX = 146;
      this.rear.driveTraysOffsetY = -63;
      this.rear.gapX = 5;

      this.rear.container = new PIXI.Container();

      this.rear.chassisPath = 'assets/images/hardware/r20a/r20a_rear_960w.png';
      this.rear.driveTrayBackgroundPath = 'assets/images/hardware/r20a/r20a_rear_960w_drivetray_bg.png';
      this.rear.driveTrayHandlePath = 'assets/images/hardware/r20a/r20a_rear_960w_drivetray_handle.png';

      this.rear.columns = 2;
      this.rear.rows = 1;
      this.rear.slotRange = { start: 13, end: 14 };

      this.rear.totalDriveTrays = 2;
    }
  }
}
