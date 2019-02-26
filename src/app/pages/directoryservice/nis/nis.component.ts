import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {  DialogService } from '../../../services/';
import helptext from '../../../helptext/directoryservice/nis';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-nis',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class NISComponent {
  protected resource_name =  helptext.nis_resource_name;
  public custActions: Array<any> = [
    {
      'id' : helptext.nis_custactions_clearcache_id,
      'name' : helptext.nis_custactions_clearcache_name,
       function : async () => {
         this.ws.call('notifier.ds_clearcache').subscribe((cache_status)=>{
          this.dialogservice.Info(helptext.nis_custactions_clearcache_dialog_title, 
            helptext.nis_custactions_clearcache_dialog_message);
        })
      }
    }
  ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : helptext.nis_domain_name,
      placeholder : helptext.nis_domain_placeholder,
      tooltip: helptext.nis_domain_tooltip,
      required: true,
      validation : helptext.nis_domain_validation
    },
    {
      type : 'input',
      name : helptext.nis_servers_name,
      placeholder : helptext.nis_servers_placeholder,
      tooltip : helptext.nis_servers_tooltip
    },
    {
      type : 'checkbox',
      name : helptext.nis_secure_mode_name,
      placeholder : helptext.nis_secure_mode_placeholder,
      tooltip : helptext.nis_secure_mode_tooltip
    },
    {
      type : 'checkbox',
      name : helptext.nis_manycast_name,
      placeholder : helptext.nis_manycast_placeholder,
      tooltip : helptext.nis_manycast_tooltip
    },
    {
      type : 'checkbox',
      name : helptext.nis_enable_name,
      placeholder : helptext.nis_enable_placeholder,
      tooltip : helptext.nis_enable_tooltip
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
              private dialogservice: DialogService) {}
}
