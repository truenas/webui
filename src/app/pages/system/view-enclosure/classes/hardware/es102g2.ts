import { Container, Transform } from 'pixi.js';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

interface LayoutColumn {
  start: number;
  count: number;
  iomGap: number;
  iomIndex: number;
}

export class Es102G2 extends Chassis {
  constructor() {
    super();
    this.model = 'es102g2';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es102g2/es102g2_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es102g2/es102g2_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es102g2/es102g2_960w_drivetray_handle.png';

    this.front.totalDriveTrays = 102;
    this.front.rows = 12;
    this.front.columns = 8;
    this.front.orientation = 'columns';

    // Scale
    this.front.chassisScale = { x: 1.025, y: 1.1 };
    this.front.driveTrays.scale.x = 1;
    this.front.driveTrays.scale.y = 1;

    // Offsets
    this.front.driveTraysOffsetX = 0;
    this.front.driveTraysOffsetY = -47;

    this.front.layout = {
      generatePosition: (
        displayObject: Container,
        index: number,
        offsetX: number,
        offsetY: number,
      ) => {
        const gapX = 4;
        const gapY = 4;

        const cols: LayoutColumn[] = [
          {
            start: 0, count: 15, iomGap: 0, iomIndex: 7,
          },
          {
            start: 15, count: 15, iomGap: 0, iomIndex: 7,
          },
          {
            start: 30, count: 13, iomGap: 64, iomIndex: 6,
          },
          {
            start: 43, count: 13, iomGap: 64, iomIndex: 6,
          },
          {
            start: 56, count: 13, iomGap: 70, iomIndex: 6,
          },
          {
            start: 69, count: 11, iomGap: 70, iomIndex: 6,
          },
          {
            start: 80, count: 11, iomGap: 70, iomIndex: 6,
          },
          {
            start: 91, count: 11, iomGap: 70, iomIndex: 6,
          },
        ];

        const getCurrentColumn = (): number => {
          const test = cols.map((column, i) => {
            if (index >= column.start && index <= (column.start + column.count - 1)) {
              return i;
            }

            return undefined;
          });
          return test.find((columnNumber) => columnNumber !== undefined);
        };

        const currentColumn: number = getCurrentColumn();
        const col = cols[currentColumn];

        const mod = (index - col.start) % col.count;
        const iomGapX = currentColumn > 3 ? 30 : 0;
        const iomGapY = (index - col.start) >= col.iomIndex ? col.iomGap : 0;

        const nextPositionX = (displayObject.width + gapX) * currentColumn;
        let nextPositionY = mod * (displayObject.height + gapY);

        if (currentColumn > 3) {
          nextPositionY += -5;
        }

        return { x: nextPositionX + offsetX + iomGapX, y: nextPositionY + offsetY + iomGapY };
      },
    };
  }

  generatePerspectiveOffset(): void {
    (this.front.driveTrays.transform as Transform).position.x = 32;
    (this.front.driveTrays.transform as Transform).position.y = 32;
  }
}
