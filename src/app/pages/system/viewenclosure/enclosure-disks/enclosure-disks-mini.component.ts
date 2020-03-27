import { Component, Input, OnInit, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Application, Container, extras, Text, DisplayObject, Graphics, Sprite, Texture, utils} from 'pixi.js';
import 'pixi-projection';
import { VDevLabelsSVG } from 'app/core/classes/hardware/vdev-labels-svg';
import { DriveTray } from 'app/core/classes/hardware/drivetray';
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

@Component({
  selector: 'enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['./enclosure-disks.component.css']
})

export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {
  constructor(public el:ElementRef, protected core: CoreService, public sanitizer: DomSanitizer,  public mediaObserver: MediaObserver, public cdr: ChangeDetectorRef){
    super(el, core, sanitizer, mediaObserver, cdr)
  }

}
