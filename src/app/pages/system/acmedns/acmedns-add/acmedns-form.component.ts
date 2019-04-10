import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_acme as helptext } from 'app/helptext/system/acme';

@Component({
  selector: 'app-acmedns-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class AcmednsFormComponent {

  protected addCall: string = 'acme.dns.authenticator.create';
  protected queryCall: string = 'acme.dns.authenticator.query';
  protected editCall = 'acme.dns.authenticator.update';
  protected route_success: string[] = ['system', 'acmedns'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[];
    public fieldSets: FieldSet[] = [
      {
        name: helptext.select_auth_label,
        label: true,
        width: '45%',
        config:[
          {
            type : 'input',
            name : helptext.authenticator_name_name,
            placeholder : helptext.authenticator_name_placeholder,
            tooltip : helptext.authenticator_name_tooltip,
            required: true,
            validation : helptext.authenticator_name_validation,
            parent: this
          },
          {
            type : 'select',
            name : helptext.authenticator_provider_name,
            placeholder : helptext.authenticator_provider_placeholder,
            tooltip : helptext.authenticator_provider_tooltip,
              options : [
                {label: 'Route53', value: 'route53'},
              ],
              value: 'route53',
            parent: this
          }
        ]
      },
      {
        name: helptext.auth_attributes_label,
        width: '45%',
        label: true,
        config:[
          // Route 53
          {
            type : 'input',
            name : helptext.auth_credentials_1_name,
            placeholder : helptext.auth_credentials_1_placeholder,
            tooltip : helptext.auth_credentials_1_tooltip,
            required: true,
            validation : helptext.auth_credentials_1_validation,
            parent: this,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'authenticator',
                  value: 'route53',
                 }]
              }
            ]
          },
          {
            type : 'input',
            name : helptext.auth_credentials_2_name,
            placeholder : helptext.auth_credentials_2_placeholder,
            tooltip : helptext.auth_credentials_2_tooltip,
            required: true,
            validation : helptext.auth_credentials_2_validation,
            parent: this,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'authenticator',
                  value: 'route53',
                 }]
              }
            ]
          }
          // Authentication attributes from other providers should go here. Each one needs a name
          // that contains whatever the authenticator's API requires, followed by a dash  and then
          // a unique identifier, probably the name of the service as seen in route53.
        ]
      }]

  protected entityForm: any;
  private pk: any;
  protected queryCallOption: Array<any> = [["id", "="]];

  constructor(protected router: Router, protected ws: WebSocketService, protected route: ActivatedRoute,
    protected loader: AppLoaderService, protected dialog: DialogService) {}

  preInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.pk = parseInt(params['pk']);
        this.ws.call(this.queryCall, [
          [
            ["id", "=", this.pk]
          ]
        ]).subscribe((res) => {
          for (let item in res[0].attributes) {
            this.entityForm.formGroup.controls[item + '-' + res[0].authenticator].setValue(res[0].attributes[item]);
          }
        });
      }
    });
  }

  customSubmit(value) {
    const attributes = {};
    let attr_name: string;

    for (let item in value) {
      if (item != 'name' && item != 'authenticator') {
        attr_name = item.split("-")[0];
        attributes[attr_name] = value[item];
      }
    }

    let payload = {};
    payload['name'] = value.name;
    payload['attributes'] = attributes;

    let newCall, data;
    if (this.pk) {
      newCall = this.editCall;
      data = [this.pk, payload];
    } else {
      payload['authenticator'] = value.authenticator;
      newCall = this.addCall;
      data = [payload];
    }

    this.loader.open();
    this.ws.call(newCall, data).subscribe(
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
