import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { FormArray } from '@angular/forms';
import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-certificate-acme-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [EntityFormService]
})
export class CertificateAcmeAddComponent {

  protected addCall = "certificate.create";
  protected queryCall: string = 'certificate.query';
  protected route_success: string[] = [ 'system', 'certificates' ];
  protected isEntity: boolean = true;
  private csrOrg: any;
  public formArray: FormArray;
  public commonName: string;
  protected arrayControl: any;
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
      required: true,
      options : [
        {label: 'https://acme-staging-v02.api.letsencrypt.org/directory', value: 'https://acme-staging-v02.api.letsencrypt.org/directory'},
        {label: 'https://acme-v02.api.letsencrypt.org/directory', value: 'https://acme-v02.api.letsencrypt.org/directory'}
      ],
      value: 'https://acme-staging-v02.api.letsencrypt.org/directory'
    },
    {
      type: 'select',
      name: 'authenticators',
      placeholder: helptext_system_certificates.acme.authenticator.placeholder,
      tooltip: helptext_system_certificates.acme.authenticator.tooltip,
      options: [],
      required: true
    }
  ]

  protected entityForm: any;
  private pk: any;
  protected dialogRef: any;
  protected queryCallOption: Array<any> = [["id", "="]];
  protected initialCount = 1;

  constructor(
    protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, private dialog: MatDialog,
    protected entityFormService: EntityFormService, protected dialogService: DialogService
  ) { }

  preInit() { 
    this.arrayControl = _.find(this.fieldConfig, {'name' : 'dns_mapping_array'});
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });

    this.ws.call(this.queryCall, [this.queryCallOption]).subscribe((res) => {
      this.commonName = res[0].common;
      this.csrOrg = res[0];

      this.ws.call('acme.dns.authenticator.query').subscribe( (res) => {
        let dns_map = _.find(this.fieldConfig, {'name' : 'authenticators'});

        res.forEach((item) => {
          dns_map.options.push(
            { label : item.name, value : item.id}
          );
        });
      });
    })
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

  customSubmit(value) {
    let dns_map = { };
    dns_map[this.commonName] = value.authenticators;
    delete value.authenticators;
    let payload = value;
    payload['name'] = value.identifier;
    delete payload.identifier;
    payload['csr_id'] = this.csrOrg.id;
    payload['create_type'] = 'CERTIFICATE_CREATE_ACME';
    payload['dns_mapping'] = dns_map;

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": (
      helptext_system_certificates.acme.job_dialog_title) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialog.closeAll();
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      this.dialog.closeAll()
      // Dialog needed b/c handleWSError doesn't open a dialog when rejection comes back from provider
      this.dialogService.errorReport(helptext_system_certificates.acme.error_dialog.title, 
        err.exc_info.type, err.exception)
      new EntityUtils().handleWSError(this.entityForm, err);
    });
  }
}