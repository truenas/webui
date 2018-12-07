import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService, DialogService, CloudCredentialService} from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/task-calendar/cloudsync/cloudsync-form';


@Component({
  selector: 'cloudsync-add',
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.css'],
  providers: [EntityFormService, FieldRelationService, CloudCredentialService]
})
export class CloudsyncFormComponent implements OnInit {

  protected addCall = 'cloudsync.create';
  protected editCall = 'cloudsync.update';
  public route_success: string[] = ['tasks', 'cloudsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected queryPayload = [];

  public fieldConfig: FieldConfig[] = [{
    type: 'input',
    name: 'description',
    placeholder: helptext.description_placeholder,
    tooltip: helptext.description_tooltip,
    required: true,
    validation : helptext.description_validation,
  }, {
    type: 'select',
    name: 'direction',
    placeholder: helptext.direction_placeholder,
    tooltip: helptext.direction_tooltip,
    options: [
      { label: 'PUSH', value: 'PUSH' },
      { label: 'PULL', value: 'PULL' },
    ],
    value: 'PUSH',
    required: true,
    validation : helptext.direction_validation,
  }, {
    type: 'select',
    name: 'credentials',
    placeholder: helptext.credentials_placeholder,
    tooltip: helptext.credentials_tooltip,
    options: [{
      label: '----------', value: null
    }],
    value: null,
    required: true,
    validation : helptext.credentials_validation,
  }, {
    type: 'select',
    name: 'bucket',
    placeholder: helptext.bucket_placeholder,
    tooltip: helptext.bucket_tooltip,
    options: [{
      label: '----------', value: ''
    }],
    value: '',
    isHidden: true,
    disabled: true,
    relation: [
      {
        action: 'HIDE',
        when: [{
          name: 'credentials',
          value: null,
        }]
      }
    ],
    required: true,
    validation : helptext.bucket_validation
  }, {
    type: 'input',
    name: 'bucket_input',
    placeholder: helptext.bucket_input_placeholder,
    tooltip: helptext.bucket_input_tooltip,
    isHidden: true,
    disabled: true,
    required: true,
    validation : helptext.bucket_input_validation
  }, {
    type: 'input',
    name: 'folder',
    placeholder: helptext.folder_placeholder,
    tooltip: helptext.folder_tooltip,
    isHidden: true,
    disabled: true,
    relation: [
      {
        action: 'HIDE',
        when: [{
          name: 'credentials',
          value: null,
        }]
      }
    ],
    value: "",
  }, {
    type: 'select',
    name: 'encryption',
    placeholder: helptext.encryption_placeholder,
    tooltip: helptext.encryption_tooltip,
    options: [
      {label: "None", value: ""},
      {label: "AES-256", value: "AES256"},
    ],
    isHidden: true,
  }, {
    type: 'explorer',
    initial: '/mnt',
    explorerType: 'directory',
    name: 'path',
    placeholder: helptext.path_placeholder,
    value: '/mnt',
    tooltip: helptext.path_tooltip,
    required: true,
    validation : helptext.path_validation
  }, {
    type: 'select',
    name: 'transfer_mode',
    placeholder: helptext.transfer_mode_placeholder,
    tooltip: helptext.transfer_mode_tooltip,
    options: [
      { label: 'SYNC', value: 'SYNC' },
      { label: 'COPY', value: 'COPY' },
      { label: 'MOVE', value: 'MOVE' },
    ],
    value: 'SYNC',
    required: true,
    validation : helptext.transfer_mode_validation
  },
  {
    type: 'checkbox',
    name: 'encryption',
    placeholder: helptext.remote_encryption_placeholder,
    tooltip: helptext.remote_encryption_tooltip,
    value: false,
  },
  {
    type: 'checkbox',
    name: 'filename_encryption',
    placeholder: helptext.filename_encryption_placeholder,
    value: true,
    tooltip: helptext.filename_encryption_tooltip,
    isHidden: true,
    relation: [
      {
        action: 'SHOW',
        when: [{
          name: 'encryption',
          value: true,
        }]
      }
    ]
  },
  {
    type: 'input',
    name: 'encryption_password',
    placeholder: helptext.encryption_password_placeholder,
    tooltip: helptext.encryption_password_tooltip,
    isHidden: true,
    relation: [
      {
        action: 'SHOW',
        when: [{
          name: 'encryption',
          value: true,
        }]
      }
    ]
  },
  {
    type: 'input',
    name: 'encryption_salt',
    placeholder: helptext.encryption_salt_placeholder,
    tooltip: helptext.encryption_salt_tooltip,
    isHidden: true,
    relation: [
      {
        action: 'SHOW',
        when: [{
          name: 'encryption',
          value: true,
        }]
      }
    ]
  },
  {
    type: 'textarea',
    name: 'args',
    placeholder: helptext.args_placeholder,
    value: "",
    isHidden: true,
  },
  {
    type: 'scheduler',
    name: 'cloudsync_picker',
    placeholder: helptext.cloudsync_picker_placeholder,
    tooltip: helptext.cloudsync_picker_tooltip,
    required: true
  },
  {
    type: 'checkbox',
    name: 'enabled',
    placeholder: helptext.enabled_placeholder,
    tooltip: helptext.enabled_tooltip,
    value: true,
  }];

  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected dom_field: any;
  protected credentials: any;
  protected bucket_field: any;
  protected bucket_input_field: any;

  public credentials_list = [];

  public formGroup: any;
  public error: string;
  protected pk: any;
  public isNew: boolean = false;
  protected data: any;
  protected pid: any;
  protected cloudcredential_query = 'cloudsync.credentials.query';

  protected providers: any;

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected dialog: DialogService,
    protected ws: WebSocketService,
    protected cloudcredentialService: CloudCredentialService) {
    this.cloudcredentialService.getProviders().subscribe((res) => {
      this.providers = res;
    });
  }

  getBuckets(credential) {
    return this.ws.call('cloudsync.list_buckets', [credential.id]);
  }

  setRelation(config: FieldConfig) {
    const activations =
        this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
          activations, this.formGroup);
      const tobeHide = this.fieldRelationService.isFormControlToBeHide(
          activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled, tobeHide);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
          .forEach(control => {
            control.valueChanges.subscribe(
                () => { this.relationUpdate(config, activations); });
          });
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup);
    const tobeHide = this.fieldRelationService.isFormControlToBeHide(
          activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled, tobeHide);
  }

  setDisabled(name: string, disable: boolean, hide: boolean = false, status?:string) {
    if (hide) {
      disable = hide;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
        item['isHidden'] = hide;
      }
      return item;
    });

    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }
  }

  ngOnInit() {
    this.credentials = _.find(this.fieldConfig, { 'name': 'credentials' });
    this.bucket_field = _.find(this.fieldConfig, {'name': 'bucket'});
    this.bucket_input_field = _.find(this.fieldConfig, {'name': 'bucket_input'});

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    }

    this.formGroup.controls['credentials'].valueChanges.subscribe((res)=>{
      console.log(res);
      if (res!=null) {
        this.credentials_list.forEach((item)=>{
          if (item.id == res) {
            if (_.find(this.providers, {"name": item.provider})['buckets']) {
              this.loader.open();
              // update bucket fields name and tooltips based on provider
              if (item.provider == "AZUREBLOB" || item.provider == "HUBIC" ) {
                this.bucket_field.placeholder = T("Container");
                this.bucket_field.tooltip = T('Select the pre-defined container to use.');
                this.bucket_input_field.placeholder = T("Container");
                this.bucket_input_field.tooltip = T('Input the pre-defined container to use.');
              } else {
                this.bucket_field.placeholder = T("Bucket");
                this.bucket_field.tooltip = T('Select the pre-defined S3 bucket to use.');
                this.bucket_input_field.placeholder = T("Bucket");
                this.bucket_input_field.tooltip = T('Input the pre-defined S3 bucket to use.');
              }

              this.getBuckets(item).subscribe(
                (res) => {
                  this.loader.close();
                  this.bucket_field.options = [{label: '----------', value: ''}];
                  if (res) {
                    res.forEach((item) => {
                      this.bucket_field.options.push({ label: item.Name, value: item.Path });
                    });
                  }
                  this.setDisabled('bucket', false, false);
                  this.setDisabled('bucket_input', true, true);
                },
                (err) => {
                  this.loader.close();
                  this.setDisabled('bucket', true, true);
                  this.setDisabled('bucket_input', false, false);
                  this.dialog.confirm(T('Error: ') + err.error, err.reason, true, T('Fix Credential')).subscribe(
                    (res) => {
                      if (res) {
                        this.router.navigate(new Array('/').concat(['system', 'cloudcredentials', 'edit', item.id]));
                      }
                    })
                }
              );
            } else {
              this.setDisabled('bucket', true, true);
              this.setDisabled('bucket_input', true, true);
            }
          }
        });
      }
    })

    // get cloud credentials
    this.ws.call(this.cloudcredential_query, {}).subscribe(res => {
      res.forEach((item) => {
        this.credentials.options.push({ label: item.name + ' (' + item.provider + ')', value: item.id });
        this.credentials_list.push(item);
      });
    });

    this.aroute.params.subscribe(params => {
      if (this.isEntity) {
        this.pk = params['pk'];
        this.pid = params['pk'];
        if (this.pk && !this.isNew) {
          this.queryPayload.push("id")
          this.queryPayload.push("=")
          this.queryPayload.push(parseInt(params['pk']));
          this.pk = [this.queryPayload];
        } else {
          this.isNew = true;
        }
      }
    });

    if (!this.isNew) {
      this.ws.call('cloudsync.query', [this.pk]).subscribe((res) => {
        if (res) {
          this.data = this.resourceTransformIncomingRestData(res[0]);
          for (let i in this.data) {
            let fg = this.formGroup.controls[i];
            if (fg) {
              let current_field = this.fieldConfig.find((control) => control.name === i);
              fg.setValue(this.data[i]);
            }
          }
          if (this.data.credentials) {
            this.formGroup.controls['credentials'].setValue(this.data.credentials.id);
          }
          if(this.data.attributes) {
            if (this.formGroup.controls['bucket']) {
              this.formGroup.controls['bucket'].setValue(this.data.attributes.bucket);
            }
            if (this.formGroup.controls['bucket_input']) {
              this.formGroup.controls['bucket_input'].setValue(this.data.attributes.bucket);
            }
            this.formGroup.controls['folder'].setValue(this.data.attributes.folder);
          }
        }
      });
    }

  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  resourceTransformIncomingRestData(data) {
    data['cloudsync_picker'] = data.schedule.minute + " " +
                          data.schedule.hour + " " +
                          data.schedule.dom + " " +
                          data.schedule.month + " " +
                          data.schedule.dow;
    return data;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    let attributes = {};
    let schedule = {};

    value['credentials'] = parseInt(value.credentials);

    if (value.bucket != undefined) {
      attributes['bucket'] = value.bucket;
      delete value.bucket;
    }
    if (value.bucket_input != undefined) {
      attributes['bucket'] = value.bucket_input;
      delete value.bucket_input;
    }
    attributes['folder'] = value.folder;
    delete value.folder;
    value['attributes'] = attributes;

    let spl = value.cloudsync_picker.split(" ");
    delete value.cloudsync_picker;
    schedule['minute'] = spl[0];
    schedule['hour'] = spl[1];
    schedule['dom'] = spl[2];
    schedule['month'] = spl[3];
    schedule['dow'] = spl[4];

    value['schedule'] = schedule;

    if (!this.pk) {
      this.loader.open();
      this.ws.call(this.addCall, [value]).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (err) => {
        this.loader.close();
        this.dialog.errorReport('Error', err.reason, err.trace.formatted);
      });
    } else {
      this.loader.open();
      this.ws.call(this.editCall, [parseInt(this.pid), value]).subscribe(
        (res)=>{
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (err)=>{
        this.loader.close();
        this.dialog.errorReport('Error', err.reason, err.trace.formatted);
        }
      );
    }
  }

}
