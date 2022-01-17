import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';

export class Chassis {
  model: string;
  front: ChassisView;
  rear?: ChassisView;
  internal?: ChassisView;

  constructor() {
    this.model = 'm50';

    // Front View
    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = 'assets/images/hardware/m50/m50_960w.png';
    this.front.driveTrayBackgroundPath = 'assets/images/hardware/m50/m50_960w_drivetray_bg.png';
    this.front.driveTrayHandlePath = 'assets/images/hardware/m50/m50_960w_drivetray_handle.png';
    this.front.totalDriveTrays = 24;
  }
}
