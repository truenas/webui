import { Container, Transform } from 'pixi.js';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';

interface LayoutColumn {
  start: number;
  count: number;
  iomGap: number;
  iomIndex: number;
  reverse: boolean;
}

export class R50 extends Chassis {
  constructor(rearChassis = false) {
    super();
    this.model = 'r50';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/r50/r50_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/r50/r50_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/r50/r50_960w_drivetray_handle.png';

    this.front.totalDriveTrays = 48;
    this.front.rows = 12;
    this.front.columns = 4;
    this.front.orientation = 'columns';

    // Scale
    this.front.chassisScale = { x: 1, y: 1 };
    this.front.driveTrays.scale.x = 1;
    this.front.driveTrays.scale.y = 1;

    // Offsets
    this.front.chassisOffsetY = -35;
    this.front.driveTraysOffsetX = -10;
    this.front.driveTraysOffsetY = 0;

    this.front.layout = {
      generatePosition: (
        displayObject: Container,
        index: number,
        offsetX: number,
        offsetY: number,
      ) => {
        const gapX = 4;
        const gapY = 8;

        const cols: LayoutColumn[] = [
          {
            start: 0, count: 12, iomGap: 8, iomIndex: 6, reverse: true,
          },
          {
            start: 12, count: 12, iomGap: 8, iomIndex: 6, reverse: true,
          },
          {
            start: 24, count: 12, iomGap: 8, iomIndex: 6, reverse: true,
          },
          {
            start: 36, count: 12, iomGap: 8, iomIndex: 6, reverse: true,
          },
          {
            start: 48, count: 12, iomGap: 8, iomIndex: 6, reverse: true,
          },
        ];

        const getCurrentColumn = (): number => {
          const test = cols.map((c, ci) => {
            if (index >= c.start && index <= (c.start + c.count - 1)) {
              return ci;
            }

            return undefined;
          });
          return test.filter((v) => v !== undefined)[0];
        };

        const currentColumn: number = getCurrentColumn();
        const col = cols[currentColumn];

        const mod = (index - col.start) % col.count;
        const iomGapX = currentColumn > 3 ? 30 : 0;
        const iomGapY = (index - col.start) >= col.iomIndex ? col.iomGap : 0;

        const nextPositionX = (displayObject.width + gapX) * currentColumn;
        let nextPositionY = mod * (displayObject.height + gapY);

        const odd: boolean = currentColumn % 2 == 1;
        const altOffset = 12 * currentColumn % 2; // Alternating offset
        nextPositionY += altOffset;

        if (odd) {
          displayObject.children.forEach((child) => {
            child.rotation = this.front.degreesToRadians(180);
            (child as any).anchor.set(1, 1);
          });
        } else {
          nextPositionY += 12;
        }

        return { x: nextPositionX + offsetX + iomGapX, y: nextPositionY + offsetY + iomGapY };
      },
    };

    if (rearChassis) {
      this.rear = new ChassisView();
      const rscale = 0.95;
      (this.rear.driveTrays as any).scale = { x: rscale, y: rscale };
      this.rear.driveTraysOffsetX = -26;
      this.rear.driveTraysOffsetY = -60;
      this.rear.container = new PIXI.Container();
      this.rear.chassisPath = 'assets/images/hardware/r50/r50_rear_960w.png';
      this.rear.driveTrayBackgroundPath = 'assets/images/hardware/r50/r50_rear_960w_drivetray_bg.png';
      this.rear.driveTrayHandlePath = 'assets/images/hardware/r50/r50_rear_960w_drivetray_handle.png';
      this.rear.columns = 1;
      this.rear.rows = 3;
      this.rear.slotRange = { start: 49, end: 51 };

      this.rear.totalDriveTrays = 3;
    }
  }

  generatePerspectiveOffset(): void {
    (this.front.driveTrays.transform as Transform).position.x = 32;
    (this.front.driveTrays.transform as Transform).position.y = 32;
  }
}
