import { ChangeDriveTrayOptions } from 'app/interfaces/events/enclosure-events.interface';
import { ChassisView } from './chassis-view';
import { DriveTray } from './drivetray';

export class CompoundChassisView extends ChassisView {
  readonly className: string = 'CompoundChassisView';
  private _controller: number;
  private _sibling: number;
  get sibling(): number {
    return this._sibling;
  }
  siblingOffset = 5;

  constructor(controller: number, sibling: number) {
    super();
    this._controller = controller;
    this._sibling = sibling;
  }

  renderDriveTrays(): void {
    if (!this.slotRange) {
      this.slotRange = { start: 1, end: this.totalDriveTrays };
    }
    for (let i = 0; i < this.totalDriveTrays; i++) {
      const slot: number = this.slotRange.start + i;

      const dt = this.altDriveTraySlots.length > 0 && this.altDriveTraySlots.includes(slot)
        ? this.makeDriveTray(true) : this.makeDriveTray();

      dt.id = slot.toString(); // Slot

      if (this.autoPosition) {
        const position = this.generatePosition(dt.container, i, this.driveTraysOffsetX, this.driveTraysOffsetY);
        dt.container.x = position.x;
        dt.container.y = position.y;
      }
      dt.background.alpha = 0;
      dt.handle.alpha = 0;
      dt.handle.filters = this.filters;

      dt.container.interactive = true;
      const clickHandler = (evt: MouseEvent): void => { this.onTap(evt, dt); };
      dt.container.on('click', clickHandler);

      this.driveTrays.addChild(dt.container);
      this.driveTrayObjects.push(dt);
    }

    this.generatePerspectiveOffset();
    this.driveTrays.name = this.model + '_drivetrays';
    this.container.addChild(this.driveTrays);

    this.events.next({ name: 'ChassisLoaded', sender: this });
    this.onEnter();
  }

  makeDriveTray(altAssets = false): DriveTray {
    const dt = new DriveTray(this.model, this.loader);
    dt.vertical = this.vertical;
    dt.setup(altAssets);
    return dt;
  }

  colorDriveTray(options: ChangeDriveTrayOptions): void {
    let driveIndex;
    if (options.enclosure === this._sibling) {
      driveIndex = options.slot + this.siblingOffset - 1;
    } else {
      const offset = this.slotRange.start ? this.slotRange.start : 0;
      driveIndex = options.slot - this.slotRange.start;
      driveIndex = options.slot - offset;
    }

    if (driveIndex < 0 || driveIndex >= this.totalDriveTrays) {
      console.warn(`IGNORING DRIVE AT INDEX ${driveIndex} SLOT ${options.slot} IS OUT OF RANGE`);
      return;
    }
    const dt = this.driveTrayObjects[driveIndex];
    if (dt) dt.color = options.color.toLowerCase();
    if (dt && this.initialized) {
      dt.handle.alpha = options.color === 'none' ? this.disabledOpacity : 1;
    }
  }
}
