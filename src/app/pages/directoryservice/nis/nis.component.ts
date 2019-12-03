import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
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
  public queryCall = 'nis.config';
  protected addCall = 'nis.update';
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
      name : 'domain',
      placeholder : helptext.nis_domain_placeholder,
      tooltip: helptext.nis_domain_tooltip,
      required: true,
      validation : helptext.nis_domain_validation
    },
    {
      type : 'input',
      name : 'servers',
      placeholder : helptext.nis_servers_placeholder,
      tooltip : helptext.nis_servers_tooltip
    },
    {
      type : 'checkbox',
      name : 'secure_mode',
      placeholder : helptext.nis_secure_mode_placeholder,
      tooltip : helptext.nis_secure_mode_tooltip
    },
    {
      type : 'checkbox',
      name : 'manycast',
      placeholder : helptext.nis_manycast_placeholder,
      tooltip : helptext.nis_manycast_tooltip
    },
    {
      type : 'checkbox',
      name : 'enable',
      placeholder : helptext.nis_enable_placeholder,
      tooltip : helptext.nis_enable_tooltip
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService,
              private dialogservice: DialogService) {}
  
  resourceTransformIncomingRestData(data) {
    data.servers = data.servers.join(',');
    return data;
  }

  afterInit(entityForm: any) {
    entityForm.submitFunction = body => this.ws.call(this.addCall, [body]);
  }

  beforeSubmit(data) {
    data.servers = data.servers.replace(/\s/g, '').split(',');
  }
}
