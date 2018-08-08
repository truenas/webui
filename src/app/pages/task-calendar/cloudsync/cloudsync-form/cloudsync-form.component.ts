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
import { TranslateService } from '@ngx-translate/core';
import { Validators } from '@angular/forms';

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
    placeholder: T('Description'),
    tooltip: T('Enter a description of the Cloud Sync Task.'),
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'direction',
    placeholder: T('Direction'),
    tooltip: T('<i>Push</i> sends data to cloud storage. <i>Pull</i>\
                receives data from cloud storage.'),
    options: [
      { label: 'PUSH', value: 'PUSH' },
      { label: 'PULL', value: 'PULL' },
    ],
    value: 'PUSH',
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'credentials',
    placeholder: T('Credential'),
    tooltip: T('Select the cloud storage provider credentials from the\
                list of available Cloud Credentials.'),
    options: [{
      label: '----------', value: null
    }],
    value: null,
    required: true,
    validation : [ Validators.required ],
  }, {
    type: 'select',
    name: 'bucket',
    placeholder: T('Bucket'),
    tooltip: T('Select the pre-defined S3 bucket to use.'),
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
    validation : [ Validators.required ],
  }, {
    type: 'input',
    name: 'bucket_input',
    placeholder: T('Bucket'),
    tooltip: T('Input the pre-defined S3 bucket to use.'),
    isHidden: true,
    disabled: true,
    required: true,
    validation : [ Validators.required ],
  }, {
    type: 'input',
    name: 'folder',
    placeholder: T('Folder'),
    tooltip: T('Enter the name of the destination folder.'),
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
    placeholder: T('Server Side Encryption'),
    tooltip: T('Choose <i>AES-256</i> or <i>None</i>.'),
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
    placeholder: T('Directory/Files'),
    value: '/mnt',
    tooltip: T('Select the directories or files to be sent to the cloud\
                for *Push* syncs, or the destination to be written for\
                *Pull* syncs. Be cautious about the destination of *Pull*\
                jobs to avoid overwriting existing files.'),
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'transfer_mode',
    placeholder: T('Transfer Mode'),
    tooltip: T('<i>SYNC</i> makes files on the destination system identical\
                to those on the source. Files that have been removed from\
                the source are removed from the destination, similar to\
                <i>rsync --delete</i>.\
                <i>COPY</i> copies files from source to destination,\
                skipping files that are identical, similar to <i>rsync</i>.\
                <i>MOVE</i> copies files from source to destination,\
                deleting files from the source after the copy, similar\
                to <i>mv</i>.'),
    options: [
      { label: 'SYNC', value: 'SYNC' },
      { label: 'COPY', value: 'COPY' },
      { label: 'MOVE', value: 'MOVE' },
    ],
    value: 'SYNC',
    required: true,
    validation : [ Validators.required ]
  },
  {
    type: 'checkbox',
    name: 'encryption',
    placeholder: T('Remote encryption'),
    tooltip: T('Set to encrypt files before transfer and store the\
                encrypted files on the remote system.\
                <a href="https://rclone.org/crypt/"\
                target="_blank">rclone Crypt</a> is used.'),
    value: false,
  },
  {
    type: 'checkbox',
    name: 'filename_encryption',
    placeholder: T('Filename encryption'),
    value: true,
    tooltip: T('Set to encrypt the shared file names.'),
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
    placeholder: T('Encryption password'),
    tooltip: T('Enter the password to encrypt and decrypt remote data.\
                <b>Warning</b>: Always save and back up this password.\
                Losing the encryption password can result in data loss.'),
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
    placeholder: T('Encryption salt'),
    tooltip: T('Enter a long string of random characters for use as\
                <a href="https://searchsecurity.techtarget.com/definition/salt"\
                target="_blank">salt</a> for the encryption password.\
                <b>Warning:</b> Save and back up the encryption salt\
                value. Losing the salt value can result in data loss.'),
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
    placeholder: T('Auxiliary arguments'),
    value: "",
    isHidden: true,
  },
  {
    type: 'scheduler',
    name: 'cloudsync_picker',
    placeholder: T('Schedule the Cloud Sync Task'),
    tooltip: T('Select a schedule preset or choose <i>Custom</i> to open\
                the advanced scheduler.'),
    required: true
  },
  {
    type: 'checkbox',
    name: 'enabled',
    placeholder: T('Enabled'),
    tooltip: T('Enable this Cloud Sync Task. Unset to disable this Cloud\
                Sync Task without deleting it.'),
    value: true,
  }];

  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected dom_field: any;
  protected credentials: any;
  protected bucket_field: any;

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
        item.isHidden = hide;
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

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    }

    this.formGroup.controls['credentials'].valueChanges.subscribe((res)=>{
      if (res!=null) {
        this.credentials_list.forEach((item)=>{
          if (item.id == res) {
            if (_.find(this.providers, {"name": item.provider}).buckets) {
              this.loader.open();
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
