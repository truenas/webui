import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService, WebSocketService, DialogService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import {EntityUtils} from '../../../common/entity/utils';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { ValueValidator } from '../../../common/entity/entity-form/validators/value-validation';

@Component({
  selector: 'cloudsync-add',
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.css'],
  providers: [TaskService, UserService, EntityFormService, FieldRelationService]
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
    tooltip: T('Enter a descriptive name of this task.'),
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
    tooltip: T('Choose the cloud storage provider credentials from the\
                list of entered Cloud Credentials.'),
    options: [{
      label: '----------', value: null
    }],
    value: null,
    required: true,
    validation : [ Validators.required, ValueValidator()],
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
    ]
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
    tooltip: T('The password for encrypting and decrypting remote\
                data. <b>Warning:</b>\
                Always save and back up this password. Losing the\
                encryption password can result in data loss.'),
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
                <b>Warning:</b> Save and back up the encryption salt value.\
                Losing the salt value can result in data loss.'),
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
  }, {
    type: 'input',
    name: 'args',
    placeholder: T('Auxiliary arguments'),
    value: "",
  }, {
    type: 'select',
    name: 'repeat',
    placeholder: T('Quick Schedule'),
    tooltip: T('Choose how often to run the task. An empty\
                value allows defining a custom schedule.'),
    options: [
      { label: '----------', value: 'none' },
      { label: 'Hourly', value: 'hourly' },
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
    ],
    value: 'once',
  }, {
    type: 'input',
    name: 'minute',
    placeholder: T('Minute'),
    tooltip: T('Minute to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'hour',
    placeholder: T('Hour'),
    tooltip: T('Hour to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'dom',
    placeholder: T('Day of month'),
    tooltip: T('Day of the month to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'select',
    name: 'month',
    placeholder: T('Month'),
    tooltip: T('Months when the task runs.'),
    multiple: true,
    options: [{
      label: 'January',
      value: '1',
    }, {
      label: 'February',
      value: '2',
    }, {
      label: 'March',
      value: '3',
    }, {
      label: 'April',
      value: '4',
    }, {
      label: 'May',
      value: '5',
    }, {
      label: 'June',
      value: '6',
    }, {
      label: 'July',
      value: '7',
    }, {
      label: 'August',
      value: '8',
    }, {
      label: 'September',
      value: '9',
    }, {
      label: 'October',
      value: '10',
    }, {
      label: 'November',
      value: '11',
    }, {
      label: 'December',
      value: '12',
    }],
    value: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    isHidden: false,
  }, {
    type: 'select',
    name: 'dow',
    placeholder: T('Day of week'),
    tooltip: T('Days of the week to run the task.'),
    multiple: true,
    options: [{
      label: 'Monday',
      value: '1',
    }, {
      label: 'Tuesday',
      value: '2',
    }, {
      label: 'Wednesday',
      value: '3',
    }, {
      label: 'Thursday',
      value: '4',
    }, {
      label: 'Friday',
      value: '5',
    }, {
      label: 'Saturday',
      value: '6',
    }, {
      label: 'Sunday',
      value: '7',
    }],
    value: ['1', '2', '3', '4', '5', '6', '7'],
    isHidden: false,
  }, {
    type: 'checkbox',
    name: 'enabled',
    placeholder: T('Enabled'),
    tooltip: T('Unset to disable the task without deleting it.'),
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

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected rest: RestService,
    protected dialog: DialogService,
    protected ws: WebSocketService) {}

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
    let date = new Date();
    this.month_field = _.find(this.fieldConfig, { 'name': 'month' });
    this.day_field = _.find(this.fieldConfig, { 'name': 'dow' });
    this.dom_field = _.find(this.fieldConfig, { 'name': 'dom' });
    this.hour_field = _.find(this.fieldConfig, { 'name': 'hour' });
    this.mintue_field = _.find(this.fieldConfig, { 'name': 'minute' });
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
              },
              (res) => {
                // provider don't use bucket, hide bucket field
                this.loader.close();
                this.setDisabled('bucket', true, true);
              }
            );
          }
        });
      }
    })

    // get cloud credentials
    this.ws.call(this.cloudcredential_query, {}).subscribe(res => {
      res.forEach((item) => {
        console.log(item);
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
      this.formGroup.controls['repeat'].valueChanges.subscribe((res) => {
        if (res == 'none') {
          this.month_field.isHidden = false;
          this.day_field.isHidden = false;
          this.dom_field.isHidden = false;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['month'].setValue([date.getMonth().toString()]);
            this.formGroup.controls['dow'].setValue([date.getDay().toString()]);
            this.formGroup.controls['dom'].setValue(date.getDate().toString());
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'hourly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.dom_field.isHidden = true;
          this.hour_field.isHidden = true;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'daily') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.dom_field.isHidden = true;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'weekly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = false;
          this.dom_field.isHidden = true;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['dow'].setValue([date.getDay().toString()]);
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'monthly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.dom_field.isHidden = false;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['dom'].setValue(date.getDate().toString());
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        }
      })
    });

    if (!this.isNew) {
      this.ws.call('backup.query', [this.pk]).subscribe((res) => {
        if (res) {
          this.data = res[0];
          for (let i in this.data) {
            let fg = this.formGroup.controls[i];
            if (fg) {
              let current_field = this.fieldConfig.find((control) => control.name === i);
              if (current_field.name == "month" || current_field.name == "dow") {
                // multiple select
                if (this.data[i] == '*') {
                  let human_value = [];
                  for (let i in current_field.options) {
                    human_value.push(current_field.options[i].value);
                  }
                  fg.setValue(human_value);
                } else {
                  let human_value = [];
                  for (let j in this.data[i]) {
                    if (_.find(current_field.options, { 'value': this.data[i][j] })) {
                      human_value.push(this.data[i][j]);
                    }
                  }
                  fg.setValue(human_value);
                }
              } else {
                fg.setValue(this.data[i]);
              }
            }
          }
          if (this.data.credential) {
            this.formGroup.controls['credential'].setValue(this.data.credential.id);
          }
          if(this.data.attributes) {
            this.formGroup.controls['bucket'].setValue(this.data.attributes.bucket);
            this.formGroup.controls['folder'].setValue(this.data.attributes.folder);
          }

          if (_.isEqual(this.formGroup.controls['month'].value, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])) {
            if (_.isEqual(this.formGroup.controls['dow'].value, ['1', '2', '3', '4', '5', '6', '7'])) {
              if (this.formGroup.controls['dom'].value == '*') {
                if (this.formGroup.controls['hour'].value == '*') {
                  this.formGroup.controls['repeat'].setValue('hourly');
                } else {
                  this.formGroup.controls['repeat'].setValue('daily');
                }
              } else {
                this.formGroup.controls['repeat'].setValue('monthly');
              }
            } else {
              if (this.formGroup.controls['dom'].value == '*') {
                this.formGroup.controls['repeat'].setValue('weekly');
              }
            }
          }
          this.formGroup.controls['encryption'].value = this.data.encryption;
        }
      });
    }

  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    let attributes = {};
    let schedule = {};

    value['credentials'] = parseInt(value.credentials);


    attributes['bucket'] = value.bucket;
    delete value.bucket;
    attributes['folder'] = value.folder;
    delete value.folder;
    value['attributes'] = attributes;


    schedule['dow'] = value.dow;
    schedule['month'] = value.month;
    schedule['dom'] = value.dom;
    schedule['hour'] = value.hour;
    schedule['minute'] = value.minute;

    if (value['repeat'] == 'hourly') {
      schedule['dow'] = '*';
      schedule['month'] = '*';
      schedule['dom'] = '*';
      schedule['hour'] = '*';
    } else if (value['repeat'] == 'daily') {
      schedule['dow'] = '*';
      schedule['month'] = '*';
      schedule['dom'] = '*';
    } else if (value['repeat'] == 'weekly') {
      schedule['month'] = '*';
      schedule['dom'] = '*';
    } else if (value['repeat'] == 'monthly') {
      schedule['dow'] = '*';
      schedule['month'] = '*';
    }
    delete value.repeat;

    if (_.isArray(value.dow)) {
      schedule['dow'] = value.dow.join(",");
    }
    if (_.isArray(value.month)) {
      schedule['month'] = value.month.join(",");
    }
    delete value.dow;
    delete value.month;
    delete value.dom;
    delete value.hour;
    delete value.minute;

    value['schedule'] = schedule;

    console.log(value);
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
