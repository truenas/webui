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
  selector : 'app-cloudcredentials-gcs',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class CloudCredentialsGCSComponent {

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
      placeholder : 'google cloud service',
      value: 'GCLOUD',
      isHidden: true
    },
    {
      type : 'input',
      name : 'name',
      placeholder : 'Account Name',
    },
    {
      type : 'readfile',
      name : 'attributes',
      placeholder : 'JSON Service Account Key',
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
    const kf = formvalue.attributes;
    try{
      payload['attributes'] = { 'keyfile': JSON.parse(kf) };
    if (!this.pk){
      auxPayLoad.push(payload)
      return this.ws.call('backup.credential.create', auxPayLoad);
    }
    else {
      return this.ws.call('backup.credential.update', [this.pk, payload]);
    }
  }
  catch(err) {
    alert("Invalid JSON")
    
  }

  

  }
  dataHandler(entityForm: any){
    if (typeof entityForm.wsResponseIdx === "object"){
      if (entityForm.wsResponseIdx.hasOwnProperty('keyfile')){
        entityForm.wsfg.setValue(JSON.stringify(entityForm.wsResponseIdx.keyfile))
      }
    }
    else {
      entityForm.wsfg.setValue(entityForm.wsResponseIdx);
    }
  }
}
