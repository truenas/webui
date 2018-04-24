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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-cloudcredentials-amazon',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CloudCredentialsAmazonComponent {

  protected isEntity = true;
  protected addCall = 'backup.credential.create';
  protected queryCall = 'backup.credential.query';
  public formGroup: FormGroup;
  protected route_success: string[] = ['system', 'cloudcredentials'];
  protected pk: any;
  protected queryPayload = [];
  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'provider',
      placeholder: 'amazon',
      value: 'AMAZON',
      isHidden: true
    },
    {
      type: 'input',
      name: 'name',
      placeholder: T('Account Name'),
      tooltip: T('Enter the Amazon Web Service account name.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'accesskey',
      placeholder: T('Access Key'),
      tooltip: T('Paste the Amazon account access key. This can be found\
       on the <a href="https://aws.amazon.com/" target="_blank">\
       Amazon AWS</a> website by clicking on <b>My account</b>, then\
       <b>Security Credentials</b> and\
       <b>Access Keys (Access Key ID and Secret Access Key)</b>.'),
       required: true,
       validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'secretkey',
      placeholder: T('Secret Key'),
      tooltip: T('After pasting the Access Key value to the FreeNAS Cloud\
       Credential Access Key field, enter the <b>Secret Key</b> value saved\
       when the pair was created. If the Secret Key value is not known, a new\
       key pair can be created on the same Amazon screen.'),
       required: true,
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
      });
    }
  }
  afterInit(entityForm: any) {
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction() {
    const auxPayLoad = []
    const payload = {};
    const formvalue = _.cloneDeep(this.formGroup.value);
    payload['provider'] = formvalue.provider;
    payload['name'] = formvalue.name;
    payload['attributes'] = { 'accesskey': formvalue.accesskey, 'secretkey': formvalue.secretkey };
    if (!this.pk) {
      auxPayLoad.push(payload)
      return this.ws.call('backup.credential.create', auxPayLoad);
    } else {
      return this.ws.call('backup.credential.update', [this.pk, payload]);
    }


  }
  dataHandler(entityForm: any) {
    if (typeof entityForm.wsResponseIdx === "object") {
      if (entityForm.wsResponseIdx.hasOwnProperty('accesskey')) {
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.accesskey);
      } else if (entityForm.wsResponseIdx.hasOwnProperty('secretkey')) {
        entityForm.wsfg.setValue(entityForm.wsResponseIdx.secretkey);
      }
    } else {
      entityForm.wsfg.setValue(entityForm.wsResponseIdx);
    }
  }
  dataAttributeHandler(entityForm: any) {
    const formvalue = _.cloneDeep(entityForm.formGroup.value);
    if (typeof entityForm.wsResponseIdx === "object") {
      for (const flds in entityForm.wsResponseIdx) {
        if (flds === 'accesskey') {
          entityForm.formGroup.controls['accesskey'].setValue(entityForm.wsResponseIdx.accesskey);
        } else if (flds === 'secretkey') {
          entityForm.formGroup.controls['secretkey'].setValue(entityForm.wsResponseIdx.secretkey);
        }
      }
    }
  }
}
