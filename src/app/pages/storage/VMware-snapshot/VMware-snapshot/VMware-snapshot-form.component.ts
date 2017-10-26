import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Rx';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
   selector : 'vmware-snapshot-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class VMwareSnapshotFormComponent {

  protected resource_name: string = 'storage/vmwareplugin';
  protected route_success: string[] = [ 'storage', 'vmware-Snapshots' ];
  protected isEntity: boolean = true;
  protected pk: any;
  public formGroup: FormGroup;

  protected entityForm: any;
  private datastore: any;

  protected fieldConfig: FieldConfig[] =[
    {
      type: 'input', 
      name: 'hostname', 
      placeholder: 'Hostname',
    },
    {
      type: 'input', 
      name: 'username', 
      placeholder: 'Username',
    },
    {
      type: 'input', 
      name: 'password', 
      placeholder: 'Password',
      inputType: 'password'
    },
    {
      type: 'explorer', 
      name: 'filesystem', 
      placeholder: 'ZFS Filesystem',
      initial: '/mnt'
    },
    {
      type: 'select', 
      name: 'datastore', 
      placeholder: 'Datastore',
    },

  ]
  public custActions: Array<any> = [
    {
      id : 'FetchDataStores',
      name : 'Fetch DataStores',
      function : () => {
        this.datastore = _.find(this.fieldConfig, {'name' : 'datastore'});
        this.datastore.type = 'select';
        this.datastore.options = [];

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined ||
          this.entityForm.formGroup.controls['username'].value === undefined ||
          this.entityForm.formGroup.controls['password'].value === undefined
        ) { alert("Please enter valid vmware ESXI/vsphere credentials to fetch datastores.")}
        else {
          const payload = {};
          payload['hostname'] = this.entityForm.formGroup.controls['hostname'].value;
          payload['username'] = this.entityForm.formGroup.controls['username'].value;
          payload['password'] = this.entityForm.formGroup.controls['password'].value;
          this.ws.call("vmware.get_datastores", [payload]).subscribe((res)=>{
            for (const key in res) {
              const datastores = res[key]
              for (const datastore in datastores){
                this.datastore.options.push({label : datastore, value : datastore})
              }      
            }
          });
        }

       }
    },
  ];

  resourceTransformIncomingRestData(data:any): any {
    data.password = '';
    data.filesystem = '/mnt/'+data.filesystem;
    return data;
  };

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
  }

  beforeSubmit(entityForm: any){
    entityForm.filesystem = entityForm.filesystem.slice(5)
  }
}
