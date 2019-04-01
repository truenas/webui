import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from 'app/services/';
import { MaterialModule } from 'app/appMaterial.module';
import { EnclosureDetailsComponent} from './enclosure-details/enclosure-details.component';

// import { MatDialog } from '@angular/material';
// import { helptext_system_email } from 'app/helptext/system/email';
// import * as _ from 'lodash';
// import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
// import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

interface ViewConfig {
  name: string;
  icon: string;
  showInNavbar: boolean;
}

@Component({
  selector : 'view-enclosure',
  templateUrl :'./view-enclosure.component.html',
  styleUrls:['./view-enclosure.component.css']
})
export class ViewEnclosureComponent implements OnDestroy {

  public currentView: string = 'Global Map';
  public views: ViewConfig[] = [
    { 
      name: 'Disks',
      icon: "any",
      showInNavbar: true
    },
    { 
      name: 'Cooling',
      icon: "any",
      showInNavbar: true
    },
    { 
      name: 'Power Supply',
      icon: "any",
      showInNavbar: true
    },
    { 
      name: 'Voltage',
      icon: "any",
      showInNavbar: true
    },
    { 
      name: 'Global Map',
      icon: "any",
      showInNavbar: false
    }
  ]

  constructor(){}

  ngOnDestroy(){}
    }
