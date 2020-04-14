import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';
import { CoreEvent} from 'app/core/services/core.service';

export class MINIXL extends Chassis {

  constructor(){
    super();
    this.model = "mini-xl";
    
    this.front = new ChassisView();
    this.front.model = this.model;
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/mini_xl/mini_xl_768w.png";
    
    this.front.driveTrayBackgroundPath = "assets/images/hardware/mini_xl/mini_hdd_drivetray_bg.png" ;
    this.front.driveTrayHandlePath = "assets/images/hardware/mini_xl/mini_hdd_drivetray_handle.png";
    
    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 8;
    this.front.autoPosition = false;

    this.front.events.subscribe((evt: CoreEvent) => {
      if(evt.name == "ChassisLoaded"){
        this.onLoaded();
      }
    });
  }

  onLoaded(){
    // Scale the Chassis
    let chassis = this.front.container.getChildAt(0);
    const backY = 100;
   
    // We must hardcode the coordinates because 
    // the parent container's dimensions are not constant
    chassis.setTransform( -20, 170 - backY, 1.15, 1.15); // x, y, scaleX, scaleY 

    // Place the drives
    this.front.driveTrayObjects.forEach((dt, index) => {     
      // HDD
      const gap: number = index < 4 ? 0 : 44;
      const offsetY: number = 176 - backY;

      // x, y, scaleX, scaleY
      dt.container.setTransform(49, offsetY + dt.container.y + (index * dt.container.height * 0.905) + gap, 0.9, 0.905); 
    });
  }

}
