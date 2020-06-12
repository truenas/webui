import { Component, Input, OnInit, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture, utils} from 'pixi.js';
import 'pixi-projection';
import { VDevLabelsSVG } from 'app/core/classes/hardware/vdev-labels-svg';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { MINI } from 'app/core/classes/hardware/mini';
import { MINIX } from 'app/core/classes/hardware/mini-x';
import { MINIXL } from 'app/core/classes/hardware/mini-xl';
import { MINIXLPLUS } from 'app/core/classes/hardware/mini-xl-plus';
import { DiskComponent } from './components/disk.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { tween, easing, styler, value, keyframes } from 'popmotion';
import { Subject } from 'rxjs';
import { ExampleData } from './example-data';
import { DomSanitizer } from "@angular/platform-browser";
import { EnclosureDisksComponent, DiskFailure } from './enclosure-disks.component';
import { Temperature } from 'app/core/services/disk-temperature.service';
import { DialogService } from 'app/services/dialog.service';

@Component({
  selector: 'enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {

  @ViewChild('cardcontent', {static: true}) cardContent:ElementRef;

  temperatureScales: boolean = false;

  constructor(public el:ElementRef, 
    protected core: CoreService, 
    public sanitizer: DomSanitizer,  
    public mediaObserver: MediaObserver, 
    public cdr: ChangeDetectorRef,
    public dialogService: DialogService,
  ){
    super(el, core, sanitizer, mediaObserver, cdr, dialogService)
    this.pixiWidth = 960 * 0.6; // PIXI needs an explicit number. Make sure the template flex width matches this
    this.pixiHeight = 480;
  }

  createExtractedEnclosure(profile){
    // MINIs have no support for expansion shelves
    // therefore we will never need to create 
    // any enclosure selection UI. Leave this
    // empty or the base class will throw errors
  }

  createEnclosure(enclosure: any = this.selectedEnclosure){
    switch(enclosure.model){
      case "FREENAS-MINI-3.0-E":
      case "FREENAS-MINI-3.0-E+":
        this.chassis = new MINI();
      break;
      case "FREENAS-MINI-3.0-X":
      case "FREENAS-MINI-3.0-X+":
        this.chassis = new MINIX();
      break;
      /*case "FREENAS-MINI-2.0-XL":
        this.chassis = new MINIXL();
      break;*/
      case "FREENAS-MINI-3.0-XL+":
        this.chassis = new MINIXLPLUS();
      break;
      default:
        this.controllerEvents.next({
          name: 'Error',
          data: {
            name: 'Unsupported Hardware',
            message: 'This chassis has an unknown or missing model value. METHOD: createEnclosure'
          }
        });
        this.aborted = true;
        break;
    }

    if(this.aborted){
      return;
    }

    this.setupEnclosureEvents(enclosure);

    // Slight adjustment to align with external html elements
    this.container.setTransform(-30);
  }

  count(obj: any){
    return Object.keys(obj).length;
  }

  stackPositions(log:boolean = false){
    const result = this.enclosure.driveTrayObjects.map((dt, index) => { 
      const disk = this.findDiskBySlotNumber(index + 1);
        return dt.container.getGlobalPosition();
    });

    if(log){
      console.warn(result);
    }
    return result;
  }

}
