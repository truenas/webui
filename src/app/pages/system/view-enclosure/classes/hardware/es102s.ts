import { Container, Transform } from 'pixi.js';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

interface LayoutColumn {
  start: number;
  count: number;
  iomGap: number;
  iomIndex: number;
}

export class Es102S extends Chassis {
  constructor() {
    super();
    this.model = 'es102s';

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/es102/es102_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/es102/es102_960w_drivetray_handle.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/es102/es102_960w_drivetray_bg_grey.png';

    this.front.totalDriveTrays = 60;
    this.front.rows = 12;
    this.front.columns = 8;
    this.front.orientation = 'columns';

    // Scale
    this.front.chassisScale = { x: 1.025, y: 1.1 };
    this.front.driveTrays.scale.x = 1;
    this.front.driveTrays.scale.y = 1;

    // Offsets
    this.front.driveTraysOffsetX = -20;
    this.front.driveTraysOffsetY = -47;

    this.front.layout = {
      generatePosition: (
        displayObject: Container,
        index: number,
        offsetX: number,
        offsetY: number,
      ) => {
        const gapX = 4;// was 16
        const gapY = 2;

        const cols: LayoutColumn[] = [
          {
            start: 0, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 14, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 28, count: 14, iomGap: 38, iomIndex: 7,
          },
          {
            start: 42, count: 12, iomGap: 100, iomIndex: 6,
          },
          {
            start: 54, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 66, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 78, count: 12, iomGap: 70, iomIndex: 6,
          },
          {
            start: 90, count: 12, iomGap: 70, iomIndex: 6,
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

        const mod = (index - col.start) % col.count; // this.front[orientation];
        const iomGapX = currentColumn > 3 ? 30 : 0;
        const iomGapY = (index - col.start) >= col.iomIndex ? col.iomGap : 0;

        const nextPositionX = (displayObject.width + gapX) * currentColumn;
        let nextPositionY = mod * (displayObject.height + gapY);

        if (currentColumn > 3) {
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
