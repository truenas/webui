import { Container, Texture, Sprite } from 'pixi.js';
import { DriveTray } from './drivetray';
import { Chassis, Position } from './chassis';

export class ES60 extends Chassis {

  constructor(){
    super();
    this.model = "es60";
    this.container = new PIXI.Container();
    this.chassisPath = "assets/images/hardware/es60/es60_960w.png";
    this.driveTrayBackgroundPath = "assets/images/hardware/es60/es60_960w_drivetray_bg.png" 
    this.driveTrayHandlePath = "assets/images/hardware/es60/es60_960w_drivetray_handle.png"
    this.totalDriveTrays = 60;
    //this.load();
    
     this.rows = 12;
     this.columns = 5;
  }

   generatePosition(displayObject, index): Position{
     let gapX = 16;
     let gapY = 6;
     let mod = index % this.rows;

     //let nextPositionX = mod * (displayObject.width + gapX);
     //let nextPositionY = Math.floor(index / this.columns) * (displayObject.height + gapY);
     let nextPositionX = Math.floor(index / this.rows) * (displayObject.width + gapX);
     let nextPositionY = mod * (displayObject.height + gapY);
     
     console.log(this.driveTrays);
     return {x: nextPositionX, y: nextPositionY }
   }

   generatePerspectiveOffset(){
     this.driveTrays.transform.position.x = 32;
     this.driveTrays.transform.position.y = 32;
   }

}
