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
import { first } from 'rxjs/operators';
import { EntityUtils } from '../../../../pages/common/entity/utils';

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
  private datastoreList: any;
  private dataListComplete: any;
  private fileSystemList: any;

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
    this.datastoreList = [];
    this.entityForm = entityForm;

    if(this.entityForm.pk){
      this.datastore = _.find(this.fieldConfig, { 'name': 'datastore' });
      this.datastore.options.length = 0;
    }

    this.entityForm.formGroup.controls['datastore'].valueChanges.subscribe((res) => {
      this.datastoreList.forEach((e) => {
       if( res === e.name) {
         this.entityForm.formGroup.controls['filesystem'].setValue(e.filesystems[0]);
       }
      })
    })
  }

  beforeSubmit(entityForm: any) {
    if (entityForm.filesystem !== undefined) {
      entityForm.filesystem = entityForm.filesystem;
    }
  }

  customSubmit(entityForm: any) {
    const payload = {
      "datastore": entityForm.datastore,
      "filesystem": entityForm.filesystem,
      "hostname":entityForm.hostname,
      "username": entityForm.username,
      "password": entityForm.password
    };
    // Looks for a mismatch and raises a confirm dialog if there is one; otherwise saves w/o the dialog
    const dataStoreMatch = this.datastoreList.find(item => item.name === entityForm.datastore);
      if (!dataStoreMatch || (dataStoreMatch.name === entityForm.datastore && dataStoreMatch.filesystems[0] !== entityForm.filesystem)) {
        let firstObj = this.fileSystemList.find(item => item.name === entityForm.filesystem);
        let secondObj = this.dataListComplete.find(item => item.name === entityForm.datastore);
        if (secondObj.description === '') {
          secondObj.description = T('(No description)');
        }
        this.dialogService.confirm(T('Are you sure?'), T('The filesystem ') + firstObj.name + T(' is ') +
          firstObj.description + T(' but datastore ') + secondObj.name + T(' is ') + secondObj.description + 
          T('. Is this correct?'), true).subscribe((res) => {
            if (res === true) {
              this.loader.open();
              this.ws.call(this.addCall, [payload]).subscribe((res) => {
                this.loader.close();
                this.router.navigate(new Array('/').concat(this.route_success));
              },
              (e_res) => {
               this.loader.close();
               this.dialogService.errorReport(T('Error'),e_res);
             })
            }
         }) 
        } else {
          this.loader.open();
          this.ws.call(this.addCall, [payload]).subscribe((res) => {
            this.loader.close();
            this.router.navigate(new Array('/').concat(this.route_success));
          },
          (e_res) => {
           this.loader.close();
           this.dialogService.errorReport(T('Error'),e_res);
         })
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
        parent.ws.call("vmware.match_datastores_with_datasets", [payload]).subscribe((res) => {
          res.filesystems.forEach(filesystem_item => {
            _.find(parent.fieldConfig, {name : 'filesystem'})['options'].push(
              {
                label : filesystem_item.name, value : filesystem_item.name
              }
            );   
          });

          res.datastores.forEach((i) => {
            if(i.filesystems.length > 0) {
              parent.datastoreList.push(i);
            }
          })
          if(this.datastore.options.length > 0){
            this.datastore.options.length = 0;
          }
          for (const key in res.datastores) {
            const datastores = res.datastores[key]
            this.datastore.options.push({ label: datastores.name, value: datastores.name })
          }

          parent.fileSystemList = res.filesystems;
          parent.dataListComplete = res.datastores;
          parent.loader.close();
        }
        ,
        (error)=>{
          this.datastore.options.length = 0;
          parent.loader.close();
          if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
            parent.dialogService.errorReport(helptext.connect_err_dialog.title, helptext.connect_err_dialog.msg, '');
          } else {
            new EntityUtils().handleWSError(this, error, this.dialogService);
          }
        });
      }
    }
 }
}
