import { CoreEvent } from 'app/interfaces/events';
import { Subject } from 'rxjs';
import { Chassis } from './chassis';

export class LabelFactory {
  /*
  * Don't use this class directly.
  * Instead extend this class for label
  * label functionality you need
  *
  */

  events: Subject<CoreEvent>;
  protected mainStage: any;
  protected chassis: Chassis; // The chassis we are labelling

  onInit(chassis: Chassis, stage: any): void {
    this.chassis = chassis;
    this.mainStage = stage;
    this.events = new Subject<CoreEvent>();
  }

  onDestroy(): void {
    console.log('Clean up after yourself');
  }

  // Animate into view
  enter(): void {
    console.log('Animate into view...');
  }

  // Animate out of view
  exit(): void {
    console.log('Animate out of view...');
  }
}
