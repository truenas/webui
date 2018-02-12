import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';

@Component({
  selector : 'app-volume-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class VolumeDeleteComponent implements Formconfiguration {

  saveSubmitText: "Delete Volume";
  resource_name = 'storage/volume/';
  route_success: string[] = [ 'storage', 'volumes' ];
  

}
