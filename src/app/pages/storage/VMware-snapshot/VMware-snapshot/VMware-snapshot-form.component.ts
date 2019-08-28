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
import helptext from '../../../../helptext/storage/VMware-snapshot/VMware-snapshot';

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
      placeholder: helptext.VMware_snapshot_form_hostname_placeholder,
      tooltip: helptext.VMware_snapshot_form_hostname_tooltip,
      validation: helptext.VMware_snapshot_form_hostname_validation,
      required: true
    },
    {
      type: 'input',
      name: 'username',
      placeholder: helptext.VMware_snapshot_form_username_placeholder,
      tooltip: helptext.VMware_snapshot_form_username_tooltip,
      validation: helptext.VMware_snapshot_form_username_validation,
      required: true
    },
    {
      type: 'input',
      name: 'password',
      placeholder: helptext.VMware_snapshot_form_password_placeholder,
      tooltip: helptext.VMware_snapshot_form_password_tooltip,
      inputType: 'password',
      validation: helptext.VMware_snapshot_form_password_validation,
      required: true,
      blurStatus: true,
      parent: this,
      blurEvent: this.blurEvent,
      togglePw: true
    },
    {
      type: 'select',
      name: 'filesystem',
      placeholder: helptext.VMware_snapshot_form_filesystem_placeholder,
      tooltip: helptext.VMware_snapshot_form_filesystem_tooltip,
      validation: helptext.VMware_snapshot_form_filesystem_validation,
      required: true,
      options: []
    },
    {
      type: 'select',
      name: 'datastore',
      placeholder: helptext.VMware_snapshot_form_datastore_placeholder,
      tooltip: helptext.VMware_snapshot_form_datastore_tooltip,
      validation: helptext.VMware_snapshot_form_datastore_validation,
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
          this.entityForm.formGroup.controls['password'].value === undefined
        ) { this.dialogService.Info(T('VM Snapshot'), T("Enter valid VMware ESXI/vSphere credentials to fetch datastores.")) }
        else {
          this.blurEvent(this);
        }

      }
    },
  ];

  resourceTransformIncomingRestData(data: any): any {
    data.password = '';
    return data;
  };

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef, protected dialogService: DialogService, 
    protected loader: AppLoaderService,) { }

  preInit(entityForm: any) {
    const queryPayload = []
    this.route.params.subscribe(params => {
      queryPayload.push("id");
      queryPayload.push("=");
      queryPayload.push(parseInt(params['pk'],10));
      this.pk = [queryPayload];
  });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;

    this.ws.call("pool.filesystem_choices").subscribe((filesystem_response)=>{
      filesystem_response.forEach(filesystem_item => {
        _.find(this.fieldConfig, {name : 'filesystem'}).options.push(
          {
            label : filesystem_item, value : filesystem_item
          }
        );   
      });
    });
    if(this.entityForm.pk){
      this.datastore = _.find(this.fieldConfig, { 'name': 'datastore' });
      this.datastore.options.length = 0;
    }
  }

  beforeSubmit(entityForm: any) {
    if (entityForm.filesystem !== undefined) {
      entityForm.filesystem = entityForm.filesystem;
    }
  }

  customEditCall(body){
    if(this.entityForm.pk){
      this.entityForm.loader.open();
      this.ws.call('vmware.update', [this.entityForm.pk, body]).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success))
      },(error)=>{
        this.loader.close();
        this.dialogService.errorReport(error.error,error.reason, error.trace.formatted);
      });
    } else {
      this.entityForm.loader.open();
      this.ws.call('vmware.create', [body]).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success))
      },(error)=>{
        this.loader.close();
        this.dialogService.errorReport(error.error,error.reason, error.trace.formatted);
      });

    }

  }
  blurEvent(parent){
    if(parent.entityForm){
      this.datastore = _.find(parent.fieldConfig, {name:'datastore'});
      const payload = {};
      payload['hostname'] = parent.entityForm.formGroup.value.hostname;
      payload['username'] = parent.entityForm.formGroup.value.username;
      payload['password'] = parent.entityForm.formGroup.value.password;

      if(payload['password'] !== "" && typeof(payload['password'])!== "undefined") {
        parent.loader.open();
        parent.ws.call("vmware.get_datastores", [payload]).subscribe((res) => {
          if(this.datastore.options.length > 0) {
            this.datastore.options.length = 0;
          };
          res.forEach((datastore) => {
            this.datastore.options.push({ label: datastore, value: datastore })
          });
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
