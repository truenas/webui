import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-cloudcredentials-b2',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class CloudCredentialsB2Component {

  protected isEntity: boolean = true;
  protected addCall = 'backup.credential.create';
  protected queryCall = 'backup.credential.query';
  protected route_success: string[] = ['system', 'cloudcredentials'];
  public formGroup: FormGroup;
  protected pk: any;
  protected queryPayload = [];
  protected fieldConfig: FieldConfig[] = [
  {
    type : 'input',
    name : 'provider',
    placeholder : 'backblaze',
    value: 'BACKBLAZE',
    isHidden: true
  },
  {
    type : 'input',
    name : 'name',
    placeholder : 'Account Name',
    tooltip : 'Enter the Backblaze account name.',
  },
  {
    type : 'textarea',
    name : 'accesskey',
    placeholder :  'Access Key',
    tooltip : 'Paste the account access key. For more information refer\
 to the <a href="https://www.backblaze.com/help.html" target="_blank">\
 BACKBLAZE help</a> page.',
  },
  {
    type : 'textarea',
    name : 'secretkey',
    placeholder : 'Secret Key',
    tooltip : 'Enter the secret key generated.',
  },
];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {}

  preInit(entityForm: any) {
    if (!entityForm.isNew) {
    this.route.params.subscribe(params => {
      this.queryPayload.push("id")
      this.queryPayload.push("=")
      this.queryPayload.push(parseInt(params['pk']));
      this.pk = [this.queryPayload];
    });
  }
  }
  afterInit(entityForm: any) {
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction(){
    const auxPayLoad = []
    const payload = {};
    const formvalue = _.cloneDeep(this.formGroup.value);
    payload['provider'] = formvalue.provider;
    payload['name'] = formvalue.name;
    payload['attributes'] = { 'accesskey': formvalue.accesskey, 'secretkey': formvalue.secretkey };
    if (!this.pk){
      auxPayLoad.push(payload)
      return this.ws.call('backup.credential.create', auxPayLoad);
    }
    else {
      return this.ws.call('backup.credential.update', [this.pk, payload]);
    }
    

  }
  dataHandler(entityForm: any){
    if (typeof entityForm.wsResponseIdx === "object"){
      if (entityForm.wsResponseIdx.hasOwnProperty('accesskey')){
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.accesskey);
      } else if (entityForm.wsResponseIdx.hasOwnProperty('secretkey')){
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.secretkey);
      }
    }
    else {
      entityForm.wsfg.setValue(entityForm.wsResponseIdx);
    }
  }
  dataAttributeHandler(entityForm: any){
    const formvalue = _.cloneDeep(entityForm.formGroup.value);
    if (typeof entityForm.wsResponseIdx === "object"){
      for (let flds in entityForm.wsResponseIdx){
        if (flds === 'accesskey'){
          entityForm.formGroup.controls['accesskey'].setValue(entityForm.wsResponseIdx.accesskey);
        } else if (flds === 'secretkey'){
          entityForm.formGroup.controls['secretkey'].setValue(entityForm.wsResponseIdx.secretkey);
         }
      }
    }
  }
}
