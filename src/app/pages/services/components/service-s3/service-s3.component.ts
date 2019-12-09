import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import {  DialogService } from '../../../../services/';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/services/components/service-s3';
import { map } from 'rxjs/operators';

@Component({
  selector : 's3-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceS3Component implements OnDestroy {
  //protected resource_name: string = 'services/s3';
  protected queryCall: string = 's3.config';
  protected addCall: string = 's3.update';
  protected route_success: string[] = [ 'services' ];
  private certificate: any;
  private ip_address: any;


  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'bindip',
      placeholder : helptext.bindip_placeholder,
      tooltip: helptext.bindip_tooltip,
      options : helptext.bindip_options
    },
    {
      type : 'input',
      name : 'bindport',
      placeholder : helptext.bindport_placeholder,
      tooltip: helptext.bindport_tooltip,
      value: '9000',
      required: true,
      validation: helptext.bindport_validation
    },
    {
      type : 'input',
      name : 'access_key',
      placeholder : helptext.access_key_placeholder,
      tooltip: helptext.access_key_tooltip,
      required: true,
      validation: helptext.access_key_validation
    },
    {
      type : 'input',
      name : 'secret_key',
      placeholder : helptext.secret_key_placeholder,
      togglePw: true,
      tooltip: helptext.secret_key_tooltip,
      inputType : 'password',
      required : true,
      validation: helptext.secret_key_validation
    },
    {
      type : 'input',
      name : 'secret_key2',
      placeholder : helptext.secret_key2_placeholder,
      inputType : 'password',
      required: true,
      validation : helptext.secret_key2_validation
    },
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'storage_path',
      placeholder : helptext.storage_path_placeholder,
      tooltip: helptext.storage_path_tooltip,
      required: true,
      validation: helptext.storage_path_validation
    },
    {
      type : 'checkbox',
      name : 'browser',
      placeholder : helptext.browser_placeholder,
      tooltip: helptext.browser_tooltip,
    },
/*  This is to be enabled when the mode feature is finished and fully implemented for S3
    {
      type : 'select',
      name : 'mode',
      placeholder : helptext.mode_placeholder,
      options : helptext.mode_options
    },
*/
    {
      type : 'select',
      name : 'certificate',
      placeholder : helptext.certificate_placeholder,
      tooltip : helptext.certificate_tooltip,
      options : []
    },
  ];
  protected storage_path: any;
  protected storage_path_subscription: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService, private dialog:DialogService ) {}

  ngOnDestroy() {
    this.storage_path_subscription.unsubscribe();
  }

  afterInit(entityForm: any) {
    this.storage_path = entityForm.formGroup.controls['storage_path'];
    this.storage_path_subscription = this.storage_path.valueChanges.subscribe((res) => {
      if(res && res.split('/').length < 4) {
        this.dialog.confirm(T("Warning"), T("Assigning a directory to Minio changes the permissions \
                                             of that directory and every directory in it to \
                                             minio:minio and overrides any previous permissions. \
                                             Creating a separate dataset for Minio is strongly \
                                             recommended."), true);
      }
    });
    this.systemGeneralService.getCertificates().subscribe((res)=>{
      this.certificate = _.find(this.fieldConfig, {name:'certificate'});
      if (res.length > 0) {
        res.forEach(item => {
          this.certificate.options.push({label:item.name, value: item.id});
        });
      }
    });
    this.ws
      .call("s3.bindip_choices", [])
      .pipe(
        map(response =>
          Object.keys(response || {}).map(key => ({
            label: response[key],
            value: key
          }))
        )
      )
      .subscribe(choices => {
        _.find(this.fieldConfig, { name: "bindip" }).options = choices;
      });
    entityForm.ws.call('s3.config').subscribe((res)=>{
      entityForm.formGroup.controls['bindip'].setValue(res.bindip);
      entityForm.formGroup.controls['bindport'].setValue(res.bindport);
      entityForm.formGroup.controls['access_key'].setValue(res.access_key);
      entityForm.formGroup.controls['secret_key'].setValue(res.secret_key);
      entityForm.formGroup.controls['secret_key2'].setValue(res.secret_key);
      entityForm.formGroup.controls['storage_path'].setValue(res.storage_path);
      entityForm.formGroup.controls['browser'].setValue(res.browser);
      //entityForm.formGroup.controls['mode'].setValue(res.mode);
      if (res.certificate && res.certificate.id) {
        entityForm.formGroup.controls['certificate'].setValue(res.certificate.id);
      }
    })
    entityForm.submitFunction = this.submitFunction;

  }

  clean(value) {
    delete value['secret_key2'];

    return value;
  }

  resourceTransformIncomingRestData(data) {
    delete data['secret_key'];
  }

  submitFunction(this: any, entityForm: any,){

    return this.ws.call('s3.update', [entityForm]);

  }
}
