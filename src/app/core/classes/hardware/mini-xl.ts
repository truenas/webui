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
    this.front.chassisPath = "assets/images/hardware/mini_xl/mini_xl_768w.png";
    this.front.driveTrayBackgroundPath = "assets/images/hardware/mini_xl/mini_hdd_drivetray_bg.png" 
    this.front.driveTrayHandlePath = "assets/images/hardware/mini_xl/mini_hdd_drivetray_handle.png" 
    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 9;
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
   
    // We must hardcode the coordinates because 
    // the parent container's dimensions are not constant
    chassis.setTransform( -20, 170, 1.3, 1.3); // x, y, scaleX, scaleY 

    // Place the drives
    this.front.driveTrayObjects.forEach((dt, i) => {     
      // HDD
      if(i > 0){
        const index:number = i - 1;
        const gap: number = index < 4 ? 0 : 48;
        const offsetY: number = 193;

        // x, y, scaleX, scaleY
        dt.container.setTransform(68, offsetY + dt.container.y + (index * dt.container.height) + gap);
      } else if(i == 0) {
        // SSD
        //dt.container.setTransform(95,193);       
      }
    });
  }

}
