import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DialogService, RestService, WebSocketService } from '../../../../services/';
import { MatDialog } from '@angular/material';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { T } from 'app/translate-marker';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-acmedns-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class AcmednsEditComponent {

  protected queryCall: string = 'acme.dns.authenticator.query';
  protected editCall = 'acme.dns.authenticator.update';
  protected route_success: string[] = ['system', 'acmedns'];
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any> = [["id", "="]];

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

  private pk: any;
  protected nameField: any;
  protected authenticatorField: any;
  protected accessKeyField: any;
  protected secretAccessKeyField: any;
  protected entityForm: any;
  protected dialogRef: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService, private matDialog: MatDialog,
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
          this.entityForm.formGroup.controls['access_key_id'].setValue(res[0].attributes.access_key_id);
          this.entityForm.formGroup.controls['secret_access_key'].setValue(res[0].attributes.secret_access_key);
        });
      }
    });
  }

  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;
    payload['authenticator'] = value.authenticator;
    payload['attributes'] = {
      'access_key_id' : value.access_key_id, 
      'secret_access_key' : value.secret_access_key
    }
    let payloadArr = [this.pk, payload];
    console.log(payloadArr)

    // this.loader.open();
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": T("Updating ACME Authenticator ") }});
    // this.dialogRef.componentInstance.setDescription(T("Importing Disk..."));
    this.dialogRef.componentInstance.setCall(this.editCall, [payloadArr]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      // this.entityForm.snackBar.open(T("Disk successfully imported"), T("Success"));
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      console.log(res)
      new EntityUtils().handleWSError(this.entityForm, res);
    });

    // this.ws.call(this.editCall, [payloadArr]).subscribe(
    //   (res) => {
    //     this.loader.close();
    //     this.router.navigate(new Array('/').concat(this.route_success));
    //   },
    //   (res) => {
    //     this.loader.close();
    //     new EntityUtils().handleWSError(this.entityForm, res);
    //   }
    // );
  }

}
