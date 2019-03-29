import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import * as _ from 'lodash';
import { DialogService, RestService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
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
      placeholder: helptext_system_certificates.edit.name.placeholder,
      tooltip: helptext_system_certificates.edit.name.tooltip,
      required: true,
      validation: helptext_system_certificates.edit.name.validation
    },
    {
      type: 'textarea',
      name: 'certificate',
      placeholder: helptext_system_certificates.edit.certificate.placeholder,
      isHidden: false,
      readonly: true,
    },
    {
      type: 'textarea',
      name: 'CSR',
      placeholder: helptext_system_certificates.edit.csr.placeholder,
      isHidden: false,
      readonly: true,
    },
    {
      type: 'textarea',
      name: 'privatekey',
      placeholder: helptext_system_certificates.edit.privatekey.placeholder,
      isHidden: false,
      readonly: true,
    }
  ];

  private pk: any;
  protected certificateField: any;
  protected privatekeyField: any;
  protected CSRField: any;
  protected entityForm: any;
  protected dialogRef: any

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService, protected matDialog: MatDialog,
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
              this.certificateField['isHidden'] = true;
              this.privatekeyField['isHidden'] = false;
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
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": "Updating Identifier" }});
    this.dialogRef.componentInstance.setCall(this.editCall, [this.pk, {'name':value['name']}]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.matDialog.closeAll();
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.matDialog.closeAll();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
