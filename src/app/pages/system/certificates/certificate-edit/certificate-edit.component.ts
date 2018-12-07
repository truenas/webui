import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-certificate-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateEditComponent {

  protected queryCall: string = 'certificate.query';
  protected editCall = 'certificate.update';
  protected route_success: string[] = ['system', 'certificates'];
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any> = [["id", "="]];

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: T('Identifier'),
       tooltip: T('Enter an alphanumeric name for the certificate.\
                   Underscore (_), and dash (-) characters are allowed.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type: 'textarea',
      name: 'certificate',
      placeholder: T('Certificate'),
      isHidden: false,
      readonly: true,
    },
    {
      type: 'textarea',
      name: 'privatekey',
      placeholder: T('Private Key'),
      isHidden: false,
      readonly: true,
    },
    {
      type: 'textarea',
      name: 'CSR',
      placeholder: T('Signing Request'),
      isHidden: false,
      readonly: true,
    }
  ];

  private pk: any;
  protected certificateField: any;
  protected privatekeyField: any;
  protected CSRField: any;
  protected entityForm: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, protected dialog: DialogService) {}

  preInit() {
    this.certificateField = _.find(this.fieldConfig, { 'name': 'certificate' });
    this.privatekeyField = _.find(this.fieldConfig, { 'name': 'privatekey' });
    this.CSRField = _.find(this.fieldConfig, { 'name': 'CSR' });
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
            if (res[0].CSR != null) {
              this.CSRField['isHidden'] = false;
              this.certificateField.readonly = false;
              this.privatekeyField['isHidden'] = true;
            } else {
              this.CSRField['isHidden'] = true;
              this.certificateField['isHidden'] = false;
              this.privatekeyField['isHidden'] = false;
            }
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
}
