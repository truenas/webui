import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DialogService, RestService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils'
import { T } from 'app/translate-marker';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-acmedns-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class AcmednsEditComponent implements OnInit {

  protected queryCall: string = 'acme.dns.authenticator.query';
  protected editCall = 'acme.dns.authenticator.update';
  protected route_success: string[] = ['system', 'acmedns'];
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any> = [["id", "="]];

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: T('Name'),
      tooltip: T('temp'),
      required: true,
      validation: Validators.required
    },
    {
      type : 'select',
      name : 'authenticator',
      placeholder : T('Authenticator'),
      options : [
        {label: 'Route53', value: 'route53'}
      ],
      value: 'Route53',
    },
    {
      type: 'input',
      name: 'access_key_id',
      placeholder: T('Access Key ID'),
      tooltip: T('temp'),
      required: true,
      validation: Validators.required
    },
    {
      type: 'input',
      name: 'secret_access_key',
      placeholder: T('Secret Access Key'),
      tooltip: T('temp'),
      required: true,
      validation: Validators.required
    },
  ];

  private pk: any;
  protected nameField: any;
  protected authenticatorField: any;
  protected accessKeyField: any;
  protected secretAccessKeyField: any;
  protected entityForm: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, protected dialog: DialogService) {}

  preInit() {
    this.nameField = _.find(this.fieldConfig, { 'name': 'name' });
    this.authenticatorField = _.find(this.fieldConfig, { 'name': 'authenticator' });
    this.accessKeyField = _.find(this.fieldConfig, { 'name': 'access_key_id' });
    this.secretAccessKeyField = _.find(this.fieldConfig, { 'name': 'secret_access_key' });
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
          if (res[0]) {
            console.log(res)
            // if (res[0].CSR != null) {
            //   this.CSRField['isHidden'] = false;
            //   this.certificateField.readonly = false;
            //   this.privatekeyField['isHidden'] = true;
            // } else {
            //   this.CSRField['isHidden'] = true;
            //   this.certificateField['isHidden'] = false;
            //   this.privatekeyField['isHidden'] = false;
            // }
          }
        });
      }
    });
  }

  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;
    if (value.CSR != null) {
      payload['certificate'] = value.certificate;
    }

    this.loader.open();
    this.ws.call(this.editCall, [this.pk, payload]).subscribe(
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

  ngOnInit() {
  }

}
