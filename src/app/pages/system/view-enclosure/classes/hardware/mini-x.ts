import { CoreEvent } from 'app/interfaces/events';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';

export class MiniX extends Chassis {
  constructor() {
    super();
    this.model = 'mini-x';

    this.front = new ChassisView();
    this.front.model = this.model;
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/mini_x/mini_x_960w.png';

    this.front.driveTrayBackgroundPath = 'assets/images/hardware/mini_x/mini_x_hdd_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/mini_x/mini_x_hdd_drivetray_handle.png';

    this.front.altDriveTraySlots = [6, 7];
    this.front.altDriveTrayBackgroundPath = 'assets/images/hardware/mini_x/mini_x_ssd_drivetray_bg.png';
    this.front.altDriveTrayHandlePath = 'assets/images/hardware/mini_x/mini_x_ssd_drivetray_bg.png';

    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 7;
    this.front.autoPosition = false;

    this.front.events.subscribe((evt: CoreEvent) => {
      if (evt.name === 'ChassisLoaded') {
        this.onLoaded();
      }
    });
  }

  onLoaded(): void {
    // Scale the Chassis
    const chassis = this.front.container.getChildAt(0);
    const scale = 0.95;

    // Scale the 2.5"
    const scaleDt = (673 / 960) * 1.1;

    // We must hardcode the coordinates because
    // the parent container's dimensions are not constant
    chassis.setTransform(0, 0, scale, scale);

    // Place the drives
    this.front.driveTrayObjects.forEach((dt, index) => {
      let offsetY = -50;
      // HDD
      if (index < 5) {
        dt.container.setTransform(
          118,
          offsetY + dt.container.y + (index * dt.container.height * 1.14),
          1.14,
          1.1,
        );
      } else {
        offsetY += 180;
        // SSD
        dt.container.setTransform(
          155,
          offsetY + dt.container.y + (index * dt.container.height * scaleDt),
          scaleDt,
          scaleDt,
        );
      }
    });
  }
}
