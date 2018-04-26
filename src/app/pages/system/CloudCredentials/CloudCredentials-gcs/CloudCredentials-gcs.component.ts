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
import {Subscription} from 'rxjs/Subscription';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-cloudcredentials-gcs',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class CloudCredentialsGCSComponent {

  protected isEntity = true;
  protected addCall = 'backup.credential.create';
  protected queryCall = 'backup.credential.query';
  protected route_success: string[] = ['system', 'cloudcredentials'];
  public formGroup: FormGroup;
  protected pk: any;
  protected queryPk: any;
  protected queryPayload = [];
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'provider',
      placeholder : T('google cloud service'),
      value: 'GCLOUD',
      isHidden: true
    },
    {
      type : 'input',
      name : 'name',
      placeholder : T('Account Name'),
      tooltip : T('Enter the Google Cloud Service account name.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'textarea',
      name : 'preview',
      placeholder : T('Preview JSON Service Account Key'),
      disabled: true
    },
    {
      type : 'readfile',
      name : 'attributes',
      placeholder : T('JSON Service Account Key'),
      tooltip : T('Browse to the location of the saved Google Cloud\
       Storage key and select it. Refer to <a\
       href="https://cloud.google.com/storage/docs/" target="_blank">\
       Gcloud documentation</a> for more information.'),
      validation : [ Validators.required ]
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
      this.queryPayload.push(parseInt(params['pk'],0));
      this.pk = [this.queryPayload];
      this.queryPk = parseInt(params['pk'],0);
      
    });
  }
  }
  afterInit(entityForm: any) {
    /*reading from middleware*/
    if (this.queryPk) {
      this.ws.call('backup.credential.query', [this.pk]).subscribe((res)=> {
        entityForm.formGroup.controls['preview'].setValue(JSON.stringify(res[0].attributes.keyfile));
      })
    }

    /*reading from local json file*/
    entityForm.formGroup.controls['attributes'].valueChanges.subscribe((value)=>{
      entityForm.formGroup.controls['preview'].setValue(value);
    });
  
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
