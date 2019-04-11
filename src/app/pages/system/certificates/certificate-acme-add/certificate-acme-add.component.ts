import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-certificate-acme-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class CertificateAcmeAddComponent {

  protected addCall = "certificate.create";
  protected queryCall: string = 'certificate.query';
  protected route_success: string[] = [ 'system', 'certificates' ];
  protected isEntity: boolean = true;
  private csrOrg: any;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'identifier',
      placeholder : helptext_system_certificates.acme.identifier.placeholder,
      tooltip: helptext_system_certificates.acme.identifier.tooltip,
      required: true,
      validation : helptext_system_certificates.add.name.validation,
      hasErrors: false,
      errors: 'Allowed characters: letters, numbers, underscore (_), and dash (-).'
    },
    {
      type : 'checkbox',
      name : 'tos',
      placeholder : helptext_system_certificates.acme.tos.placeholder,
      tooltip: helptext_system_certificates.acme.tos.tooltip,
      required: true,
    },
    {
      type : 'input',
      name : 'renew_days',
      placeholder : helptext_system_certificates.acme.renew_day.placeholder,
      tooltip: helptext_system_certificates.acme.renew_day.tooltip,
      inputType: 'number',
      required: true,
      value: 10,
      validation: helptext_system_certificates.acme.renew_day.validation
    },
    {
      type : 'select',
      name : 'acme_directory_uri',
      placeholder : helptext_system_certificates.acme.dir_uri.placeholder,
      tooltip: helptext_system_certificates.acme.dir_uri.tooltip,
      options : [
        {label: 'https://acme-staging-v02.api.letsencrypt.org/directory', value: 'https://acme-staging-v02.api.letsencrypt.org/directory'},
        {label: 'https://acme-v02.api.letsencrypt.org/directory', value: 'https://acme-v02.api.letsencrypt.org/directory'}
      ],
      value: 'https://acme-staging-v02.api.letsencrypt.org/directory'
    },
    {
      type : 'select',
      name : 'dns_mapping',
      placeholder : helptext_system_certificates.acme.authenticator.placeholder,
      tooltip: helptext_system_certificates.acme.authenticator.tooltip,
      options : [
        {label: 'Temp option...', value: 'temp_option'}
      ],
      value: '',
      required: true
    },
  ]

  private authenticators: any;
  protected entityForm: any;
  private pk: any;
  protected dialogRef: any;
  protected queryCallOption: Array<any> = [["id", "="]];

  constructor(
    protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, private dialog: MatDialog
  ) { }

  preInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
    this.ws.call('acme.dns.authenticator.query').subscribe( (res) => {
      this.authenticators = _.find(this.fieldConfig, {'name' : 'dns_mapping'});
      res.forEach((item) => {
        this.authenticators.options.push(
          { label : item.name, value : item.name}
        );
      });
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
          this.csrOrg = res;
        });
      }
    });
  }

  customSubmit(value) {
    let payload = {};
    let temp = this.csrOrg[0].common;
    payload['tos'] = value.tos;
    payload['csr_id'] = this.csrOrg[0].id;
    payload['acme_directory_uri'] = value.acme_directory_uri;
    payload['name'] = value.identifier;
    payload['renew_days'] = value.renew_days;
    payload['create_type'] = 'CERTIFICATE_CREATE_ACME';
    payload['dns_mapping'] = { // ???
      temp : '1' 
    }
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": ("Creating...") }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialog.closeAll();
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialog.closeAll()
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}