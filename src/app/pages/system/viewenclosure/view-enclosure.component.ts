import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from 'app/services/';
import { MaterialModule } from 'app/appMaterial.module';
import { EnclosureDisksComponent} from './enclosure-disks/enclosure-disks.component';

import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { SystemProfiler } from './enclosure-disks/system-profiler';

// import { MatDialog } from '@angular/material';
// import { helptext_system_email } from 'app/helptext/system/email';
// import * as _ from 'lodash';
// import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
// import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

interface ViewConfig {
  name: string;
  icon: string;
  id: number;
  showInNavbar: boolean;
}

@Component({
  selector : 'view-enclosure',
  templateUrl :'./view-enclosure.component.html',
  styleUrls:['./view-enclosure.component.css']
})
export class ViewEnclosureComponent implements OnDestroy {

  public currentView: string = 'Disks';
  public system: SystemProfiler;
  public system_product;
  public selectedEnclosure: any;
  public views: ViewConfig[] = [
    { 
      name: 'Disks',
      icon: "harddisk",
      id: 0,
      showInNavbar: true
    },
    { 
      name: 'Cooling',
      icon: "fan",
      id: 1,
      showInNavbar: true
    },
    { 
      name: 'Power Supply',
      icon: "power-socket",
      id: 2,
      showInNavbar: true
    },
    { 
      name: 'Voltage',
      icon: "flash",
      id: 3,
      showInNavbar: true
    }/*,
    { 
      name: 'Pools',
      icon: "any",
      id: 4,
      showInNavbar: false
    }*/
  ]

  changeView(id){
    this.currentView = this.views[id].name;
  }

  constructor(private core: CoreService){
    core.register({observerClass: this, eventName: 'EnclosureData'}).subscribe((evt:CoreEvent) => {
      this.system.enclosures = evt.data;
      this.selectedEnclosure = this.system.profile[0];
      //console.log(this.system);
    });

    core.register({observerClass: this, eventName: 'PoolData'}).subscribe((evt:CoreEvent) => {
      this.system.pools = evt.data;
      core.emit({name: 'EnclosureDataRequest', sender: this});
    });


    core.register({observerClass: this, eventName: 'DisksData'}).subscribe((evt:CoreEvent) => {

      let data = evt.data;
      this.system = new SystemProfiler(this.system_product, data);
      //this.selectedEnclosure = this.system.profile[0];
      //console.log(this.system);
      core.emit({name: 'PoolDataRequest', sender: this});
      //this.pixiInit();
    });

    core.register({observerClass: this, eventName: 'SysInfo'}).subscribe((evt:CoreEvent) => {
      console.log(evt);
      //this.system_product = evt.data.system_product;
      this.system_product = 'M50'; // Just for testing on my FreeNAS box
      core.emit({name: 'DisksRequest', sender: this});
    });

    core.emit({name: 'SysInfoRequest', sender: this});
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this})
  }
}
