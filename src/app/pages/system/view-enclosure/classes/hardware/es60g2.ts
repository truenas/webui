import { Container, Transform } from 'pixi.js';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

interface LayoutColumn {
  start: number;
  count: number;
  iomGap: number;
  iomIndex: number;
}

export class Es60G2 extends Chassis {
  constructor() {
    super();
    this.model = 'es60g2';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es60g2/es60g2_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es60g2/es60g2_960w_drivetray.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es60g2/es60g2_960w_drivetray_handle.png';

    this.front.totalDriveTrays = 60;
    this.front.rows = 12;
    this.front.columns = 5;
    this.front.orientation = 'columns';

    // Scale
    this.front.chassisScale = { x: 1.22, y: 1.22 };
    this.front.driveTrays.scale.x = 1.21;
    this.front.driveTrays.scale.y = 1.21;

    // Offsets
    this.front.driveTraysOffsetX = 115;
    this.front.driveTraysOffsetY = -43;

    this.front.layout = {
      generatePosition: (
        displayObject: Container,
        index: number,
        offsetX: number,
        offsetY: number,
      ) => {
        const gapX = 4;
        const gapY = 2;

        const cols: LayoutColumn[] = [
          {
            start: 0, count: 12, iomGap: 90, iomIndex: 6,
          },
          {
            start: 12, count: 12, iomGap: 60, iomIndex: 6,
          },
          {
            start: 24, count: 12, iomGap: 60, iomIndex: 6,
          },
          {
            start: 36, count: 12, iomGap: 60, iomIndex: 6,
          },
          {
            start: 48, count: 12, iomGap: 60, iomIndex: 6,
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

        const mod = (index - col?.start) % col.count; // this.front[orientation];
        const iomGapX = currentColumn > 0 ? 25 : 0;
        const iomGapY = (index - col.start) >= col.iomIndex ? col.iomGap : 0;

        const nextPositionX = (displayObject.width + gapX) * currentColumn;
        let nextPositionY = mod * (displayObject.height + gapY);

        if (currentColumn > 0) {
          nextPositionY += 15;
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
