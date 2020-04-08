import { Component, Input, OnInit, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture, utils} from 'pixi.js';
import 'pixi-projection';
import { VDevLabelsSVG } from 'app/core/classes/hardware/vdev-labels-svg';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
import { MINI } from 'app/core/classes/hardware/mini';
import { M50 } from 'app/core/classes/hardware/m50';
import { M50Rear } from 'app/core/classes/hardware/m50_rear';
import { ES12 } from 'app/core/classes/hardware/es12';
import { E16 } from 'app/core/classes/hardware/e16';
import { E24 } from 'app/core/classes/hardware/e24';
import { ES24 } from 'app/core/classes/hardware/es24';
import { E60 } from 'app/core/classes/hardware/e60';
import { ES60 } from 'app/core/classes/hardware/es60';
import { DiskComponent } from './components/disk.component';
import { TabContentComponent } from './components/tab-content/tab-content.component';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { tween, easing, styler, value, keyframes } from 'popmotion';
import { Subject } from 'rxjs';
import { ExampleData } from './example-data';
import { DomSanitizer } from "@angular/platform-browser";
import { EnclosureDisksComponent, DiskFailure } from './enclosure-disks.component';
import { Temperature } from 'app/core/services/disk-temperature.service';

@Component({
  selector: 'enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {

  @ViewChild('cardcontent', {static: true}) cardContent:ElementRef;

  constructor(public el:ElementRef, 
    protected core: CoreService, 
    public sanitizer: DomSanitizer,  
    public mediaObserver: MediaObserver, public cdr: ChangeDetectorRef){
    super(el, core, sanitizer, mediaObserver, cdr)
    this.pixiWidth = 960 * 0.6; // PIXI needs an explicit number. Make sure the template flex width matches this
    this.pixiHeight = 480;
  }

  createEnclosure(enclosure: any = this.selectedEnclosure){
    switch(enclosure.model){
      default:
        console.warn("DEFAULT CASE");
        this.chassis = new MINI();
        break;
    }

    console.log(this.enclosure);
    this.setupEnclosureEvents(enclosure);
  }

  count(obj: any){
    return Object.keys(obj).length;
  }

  stackPositions(log:boolean = false){
    const result = this.enclosure.driveTrayObjects.map((dt, index) => { 
      const disk = this.findDiskBySlotNumber(index + 1);
      if(disk){
        return dt.container.getGlobalPosition();
      }
    });

    if(log){
      console.log(result);
    }
    return result;
  }

}
