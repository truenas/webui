import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils'
import { T } from 'app/translate-marker';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-acmedns-add',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class AcmednsAddComponent {

  protected addCall: string = 'acme.dns.authenticator.create';
  protected route_success: string[] = ['system', 'acmedns'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[];
    public fieldSets: FieldSet[] = [
      {
        name: T('Select Authenticator'),
        label: true,
        width: '45%',
        config:[
          {
            type : 'input',
            name : 'name',
            placeholder : T('Name'),
            tooltip : T('Temp tooltip'),
            required: true,
            validation : Validators.required,
            parent: this
          },
          {
            type : 'select',
            name : 'authenticator',
            placeholder : T('Authenticator'),
            tooltip : T('Temp tooltip'),
              options : [
                {label: 'Route53', value: 'route53'}
              ],
              value: 'route53',
            parent: this
          }
        ]
      },
      {
        name: T('Authenticator Attributes'),
        width: '45%',
        label: true,
        config:[
          {
            type : 'input',
            name : 'access_key_id',
            placeholder : T('Access ID Key'),
            tooltip : T('Temp tooltip'),
            required: true,
            validation : Validators.required,
            parent: this
          },
          {
            type : 'input',
            name : 'secret_access_key',
            placeholder : T('Secret Access Key'),
            tooltip : T('Temp tooltip'),
            required: true,
            validation : Validators.required,
            parent: this
          }
        ]
      }]

  protected entityForm: any;

  constructor(protected router: Router, protected ws: WebSocketService,
    protected loader: AppLoaderService, protected dialog: DialogService) {}

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;
    payload['authenticator'] = value.authenticator;
    payload['attributes'] = {
      'access_key_id' : value.access_key_id, 
      'secret_access_key' : value.secret_access_key
    }

    this.loader.open();
    this.ws.call(this.addCall, [payload]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );
  }
}
