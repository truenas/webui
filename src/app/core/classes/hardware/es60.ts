import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView, Position } from './chassis-view';

export class ES60 extends Chassis {

  constructor(){
    super();
    this.model = "es60";

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/es60/es60_960w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/es60/es60_960w_drivetray_bg.png" ;
    this.front.driveTrayHandlePath = "assets/images/hardware/es60/es60_960w_drivetray_handle.png";
    this.front.driveTraysOffsetY = -40;
    this.front.totalDriveTrays = 60;
    this.front.rows = 12;
    this.front.columns = 5;

    // Scale drives to chassis
    this.front.driveTrays.scale.y = 1.1;
    this.front.chassisScale = {y: 0.98};

    this.generatePerspectiveOffset();
  }

  generatePerspectiveOffset(){
    this.front.driveTrays.transform.position.x = 32;
    this.front.driveTrays.transform.position.y = 32;
  }

}
