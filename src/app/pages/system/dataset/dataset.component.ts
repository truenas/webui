import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, UserService, WebSocketService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-system-dataset',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetComponent implements OnInit{

  protected resource_name: string = 'storage/dataset';
  protected volume_name: string = 'storage/volume';

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'stg_guiprotocol',
    placeholder: 'System Dataset Pool',
    tooltip: 'Select Default Pool',
    options: [
      { label: 'freenas-boot', value: 'freenas-boot' },
    ],
  },{
      type: 'checkbox',
      name: 'stg_guihttpsredirect',
      placeholder: 'Syslog',
      tooltip : 'Check this to redirect <i>HTTP</i> connections to\
 <i>HTTPS</i>. <i>HTTPS</i> must be selected in <b>Protocol</b>.'
    },{
      type: 'checkbox',
      name: 'stg_guihttpsredirect',
      placeholder: 'Reporting Database',
      tooltip : 'Save the Round-Robin Database (RRD) used by system statistics collection daemon into the system dataset'
    }];

  private stg_guiprotocol: any;
  constructor(private rest: RestService, private ws: WebSocketService) {}

  ngOnInit() {
    this.rest.get(this.volume_name, {}).subscribe( res => {
       if (res) {
         this.stg_guiprotocol = _.find(this.fieldConfig, {'name': 'stg_guiprotocol'});
         res.data.forEach( x => {
           this.stg_guiprotocol.options.push({ label: x.name, value: x.name});
         });
       }
    })
  }
}
