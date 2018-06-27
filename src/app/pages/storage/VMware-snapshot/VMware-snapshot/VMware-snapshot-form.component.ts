import {
  ApplicationRef,
  Component,
  Injector,
} from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { RestService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-vmware-snapshot-form',
  template: `<entity-form [conf]="this"></entity-form>`
})

export class VMwareSnapshotFormComponent {

  protected route_success: string[] = ['storage', 'vmware-Snapshots'];
  protected isEntity = true;
  public queryCall = "vmware.query";
  public addCall = "vmware.create";
  protected pk: any;
  public formGroup: FormGroup;

  protected entityForm: any;
  private datastore: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'hostname',
      placeholder: T('Hostname'),
      tooltip: T('Enter the IP address or hostname of the VMware host.\
                  When clustering, this is the vCenter server for the\
                  cluster.'),
      validation: [Validators.required],
      required: true
    },
    {
      type: 'input',
      name: 'username',
      placeholder: T('Username'),
      tooltip: T('Enter the user on the VMware host with permission to\
                  snapshot virtual machines.'),
      validation: [Validators.required],
      required: true
    },
    {
      type: 'input',
      name: 'new_password2',
      placeholder: T('Password'),
      tooltip: T('Enter the password associated with <b>Username</b>.'),
      inputType: 'password',
      validation: [Validators.required],
      required: true,
      blurStatus: true,
      parent: this,
      blurEvent: this.blurEvent,
    },
    {
      type: 'explorer',
      name: 'filesystem',
      placeholder: T('ZFS Filesystem'),
      tooltip: T('Enter the filesystem to snapshot.'),
      explorerType: "zvol",
      initial: '/mnt',
      validation: [Validators.required],
      required: true
    },
    {
      type: 'select',
      name: 'datastore',
      placeholder: T('Datastore'),
      tooltip: T('After entering the <b>Hostname, Username</b>, and\
                  <b>Password</b>, click <b>Fetch Datastores</b> and\
                  select the datastore to be synchronized.'),
      validation: [Validators.required],
      required: true,
      options: []
    },

  ]
  public custActions: Array<any> = [
    {
      id: 'FetchDataStores',
      name: 'Fetch DataStores',
      function: () => {
        this.datastore = _.find(this.fieldConfig, { 'name': 'datastore' });
        this.datastore.type = 'select';

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined ||
          this.entityForm.formGroup.controls['username'].value === undefined ||
          this.entityForm.formGroup.controls['new_password2'].value === undefined
        ) { this.dialogService.Info(T('VM Snapshot'), T("Please enter valid vmware ESXI/vsphere credentials to fetch datastores.")) }
        else {
          this.blurEvent(this);
        }

      }
    },
  ];

  resourceTransformIncomingRestData(data: any): any {
    data.password = '';
    data.filesystem = '/mnt/' + data.filesystem;
    return data;
  };

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef, protected dialogService: DialogService, 
    protected loader: AppLoaderService,) { }



  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    if(this.entityForm.pk){
      this.datastore = _.find(this.fieldConfig, { 'name': 'datastore' });
      this.datastore.options.length = 0;
    }
  }

  beforeSubmit(entityForm: any) {
    if (entityForm.filesystem !== undefined) {
      entityForm.filesystem = entityForm.filesystem.slice(5);
    }
  }

  customEditCall(body){
    if (body.new_password2){
      body.password = body.new_password2;
      delete body.new_password2;
    }
    this.ws.call('vmware.update', [this.entityForm.pk, body]).subscribe((res)=>{
    },(error)=>{
      this.dialogService.errorReport(error.error,error.reason, error.trace.formatted)
    });
  }

  blurEvent(parent){
    if(parent.entityForm){
      this.datastore = _.find(parent.fieldConfig, {name:'datastore'});
      const payload = {};
      payload['hostname'] = parent.entityForm.formGroup.value.hostname;
      payload['username'] = parent.entityForm.formGroup.value.username;
      payload['password'] = parent.entityForm.formGroup.value.new_password2;
      if(payload['password'] !== "") {
        parent.loader.open();
        parent.ws.call("vmware.get_datastores", [payload]).subscribe((res) => {
        if(this.datastore.options.length >0){
          this.datastore.options.length = 0;
        }
          for (const key in res) {
            const datastores = res[key]
            for (const datastore in datastores) {
              this.datastore.options.push({ label: datastore, value: datastore })
            }
          }
          parent.loader.close();
        }
        ,
        (error)=>{
          this.datastore.options.length = 0;
          parent.loader.close();
          parent.dialogService.errorReport(error.error,error.reason, error.trace.formatted);
        });
      }
    }

    }

}
