import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from 'app/services/';
import { MaterialModule } from 'app/appMaterial.module';
import { EnclosureDisksComponent} from './enclosure-disks/enclosure-disks.component';

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
  public views: ViewConfig[] = [
    { 
      name: 'Disks',
      icon: "any",
      id: 0,
      showInNavbar: true
    },
    { 
      name: 'Cooling',
      icon: "any",
      id: 1,
      showInNavbar: true
    },
    { 
      name: 'Power Supply',
      icon: "any",
      id: 2,
      showInNavbar: true
    },
    { 
      name: 'Voltage',
      icon: "any",
      id: 3,
      showInNavbar: true
    },
    { 
      name: 'Pools',
      icon: "any",
      id: 4,
      showInNavbar: false
    }
  ]

  changeView(id){
    this.currentView = this.views[id].name;
  }

  constructor(){}

  ngOnDestroy(){}
}
