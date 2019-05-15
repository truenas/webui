import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { FormControl, FormArray } from '@angular/forms';
import { RestService, WebSocketService } from '../../../../services/';
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
      type : 'combobox',
      name : 'acme_directory_uri',
      placeholder : helptext_system_certificates.acme.dir_uri.placeholder,
      tooltip: helptext_system_certificates.acme.dir_uri.tooltip,
      required: true,
      options : [
        {label: 'https://acme-staging-v02.api.letsencrypt.org/directory', value: 'https://acme-staging-v02.api.letsencrypt.org/directory'},
        {label: 'https://acme-v02.api.letsencrypt.org/directory', value: 'https://acme-v02.api.letsencrypt.org/directory'}
      ],
    }
  ]

  private authenticators = [];
  protected entityForm: any;
  private pk: any;
  protected dialogRef: any;
  protected queryCallOption: Array<any> = [["id", "="]];
  protected initialCount = 1;

  constructor(
    protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, private dialog: MatDialog,
    protected entityFormService: EntityFormService
  ) { }

  preInit() { 
    this.arrayControl = _.find(this.fieldConfig, {'name' : 'dns_mapping_array'});
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
    this.ws.call(this.queryCall, [this.queryCallOption]).subscribe((res) => {
      this.csrOrg = res;
      let domains = [this.csrOrg[0].common];
      for (let item of this.csrOrg[0].san) {
        domains.push(item);
      }
      this.ws.call('acme.dns.authenticator.query').subscribe( (res) => {
        res.forEach((item) => {
          this.authenticators.push(
            { label : item.name, value : item.id}
          );
        });
      });

      // TODO: This works, submits data to payload but throws console errors and doesn't add new fields to the FormGroup.
      // So Angular doesn;t recognize them as required. Need to work on dynamically adding these fields, although the user is warned by dialog
      // if these selections are left blank.
      for (let item of domains) {
        let fc = (
          {
            type: "select",
            name: "dns_mapping-" + item, 
            placeholder: "Authenticator for " + item, 
            tooltip: "Specify Authenticator to be used for " + item, 
            options: this.authenticators,
            required: true, 
            class: 'dns_mapping'              
          });
        this.fieldConfig.push(fc);
      }
    })
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.formArray = entityEdit.formGroup.controls['dns_mapping_array'];
  }

  customSubmit(value) {
    let dns_map = {};
    for (let item in value) {
    if (item.includes('dns_mapping')) {
        let i = item.split('-');
        dns_map[i[1]]=value[item];
      }
    }
    let payload = {};
    payload['tos'] = value.tos;
    payload['csr_id'] = this.csrOrg[0].id;
    payload['acme_directory_uri'] = value.acme_directory_uri;
    payload['name'] = value.identifier;
    payload['renew_days'] = value.renew_days;
    payload['create_type'] = 'CERTIFICATE_CREATE_ACME';
    payload['dns_mapping'] = dns_map;

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