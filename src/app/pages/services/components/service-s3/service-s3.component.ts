import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import {  DialogService } from '../../../../services/';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/services/components/service-s3';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { map } from 'rxjs/operators';

@Component({
  selector : 's3-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceS3Component implements OnDestroy {
  //protected resource_name: string = 'services/s3';
  protected queryCall: string = 's3.config';
  protected updateCall: string = 's3.update';
  protected route_success: string[] = [ 'services' ];
  private certificate: any;
  private ip_address: any;
  private initial_path: any;
  private warned = false;
  private validBindIps = [];
  public title = helptext.formTitle;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_title,
      class: 'group-configuration-form',
      label:true,
      config: [
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
        validation: helptext.secret_key_validation
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
        options : [{label: '---', value: null}]
      },
    ]
  },{
    name: 'divider',
    divider: true
  }];
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
      if(res && res != this.initial_path && !this.warned) {
        this.dialog.confirm(helptext.path_warning_title, helptext.path_warning_msg).subscribe(confirm => {
          if (!confirm) {
            this.storage_path.setValue(this.initial_path);
          } else {
            this.warned = true;
          }
        });
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
        choices.forEach(ip => { 
          this.validBindIps.push(ip.value)
        });
        _.find(this.fieldConfig, { name: "bindip" }).options = choices;
      });
    entityForm.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data) {
    if (data.certificate && data.certificate.id) {
      data['certificate'] = data.certificate.id;
    }
    if (data.storage_path) {
      this.initial_path = data.storage_path;
    }
    delete data['secret_key'];
    
    // If validIps is slow to load, skip check on load (It's still done on save)
    if (this.validBindIps.length > 0) {
      return this.compareBindIps(data);
    }
    return data;
  }

  compareBindIps(data) {
    if (data.bindip && this.validBindIps.length > 0) {
      if (!this.validBindIps.includes(data.bindip)) {
        data.bindip = '';
      }
    }
    return data;
  }

  submitFunction(this: any, entityForm: any,){

    return this.ws.call('s3.update', [entityForm]);

  }

  beforeSubmit(data) {
    data = this.compareBindIps(data);
  }

}
