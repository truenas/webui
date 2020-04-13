import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis } from './chassis';
import { ChassisView } from './chassis-view';
import { CoreEvent} from 'app/core/services/core.service';

export class MINIX extends Chassis {

  constructor(){
    super();
    this.model = "mini-xl+";
    
    this.front = new ChassisView();
    this.front.model = this.model;
    this.front.container = new PIXI.Container();
    this.front.chassisPath = "assets/images/hardware/mini_x/mini_x_960w.png";
    
    this.front.driveTrayBackgroundPath = "assets/images/hardware/mini_x/mini_x_hdd_drivetray_bg.png" ;
    this.front.driveTrayHandlePath = "assets/images/hardware/mini_x/mini_x_hdd_drivetray_handle.png";

    this.front.altDriveTraySlots = [6,7];
    this.front.altDriveTrayBackgroundPath = "assets/images/hardware/mini_x/mini_x_ssd_drivetray_bg.png" ;
    this.front.altDriveTrayHandlePath = "assets/images/hardware/mini_x/mini_x_ssd_drivetray_bg.png";
    
    this.front.vertical = false;
    this.front.disabledOpacity = 0.5;
    this.front.chassisOpacity = 0.65;
    this.front.totalDriveTrays = 7; // 5 x 3.5 && 2x 2.5"
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
    const scale: number = 0.8;
    const backY = 100;

    // Scale the 2.5"
    const scaleDT = (673 / 960) * 0.9;
   
    // We must hardcode the coordinates because 
    // the parent container's dimensions are not constant
    chassis.setTransform( -20, 170 - backY, scale, scale); // x, y, scaleX, scaleY 

    // Place the drives
    this.front.driveTrayObjects.forEach((dt, index) => {     
      let offsetY: number = 17;
      // HDD
      if(index < 5){

        // x, y, scaleX, scaleY
        dt.container.setTransform(78, offsetY + dt.container.y + (index * dt.container.height * 0.98), 0.93, 0.9);
      } else {
        offsetY += 150;
        // SSD
        //dt.container.setTransform(0, 121 - backY, 0.73, 0.73);       
        dt.container.setTransform(105, offsetY + dt.container.y + (index * dt.container.height * scaleDT), scaleDT, scaleDT );
      }
    });
  }

}
