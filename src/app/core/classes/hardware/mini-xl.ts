import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';
import { CoreEvent} from 'app/core/services/core.service';

export class MINIXL extends Chassis {

  constructor(){
    super();
    this.model = "mini";

    this.front = new ChassisView();
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/mini/mini_673w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/mini/mini_hdd_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/mini/mini_hdd_drivetray_handle.png" 
    this.front.driveTraysOffsetX = -200;
    this.front.driveTraysOffsetY = -138;
    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 9;
    //this.front.columns = 1;
    //this.front.rows = 8;
    this.front.autoPosition = false;

    this.front.events.subscribe((evt: CoreEvent) => {
      if(evt.name == "ChassisLoaded"){
        this.onLoaded();
      }
    });
  }

  onLoaded(){

    console.warn(this.front.driveTrayObjects);
    this.front.driveTrayObjects.forEach((dt, index) => {     
      const gap = index < 4 ? 0 : 48;

      dt.container.x = dt.container.width + this.front.driveTraysOffsetX;
      dt.container.y = dt.container.y + (index * dt.container.height) + gap;
    });
  }

}
