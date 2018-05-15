import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService, WebSocketService, DialogService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
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

@Component({
  selector: 'cloudsync-add',
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.css'],
  providers: [TaskService, UserService, EntityFormService]
})
export class CloudsyncFormComponent implements OnInit {

  protected queryCall = 'backup.create';
  public route_success: string[] = ['tasks', 'cloudsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected queryPayload = [];

  public fieldConfig: FieldConfig[] = [{
    type: 'input',
    name: 'description',
    placeholder: T('Description'),
    tooltip: T('Enter a description for this task.'),
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'direction',
    placeholder: T('Direction'),
    tooltip: T('<i>Push</i> sends data to the cloud storage. <i>Pull</i>\
                takes data from the cloud storage.'),
    options: [
      { label: 'PULL', value: 'PULL' },
      { label: 'PUSH', value: 'PUSH' },
    ],
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'credential',
    placeholder: T('Credential'),
    tooltip: T('Choose the cloud storage provider from the list of\
                existing Cloud credentials.'),
    options: [{
      label: '---', value: null
    }],
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'bucket',
    placeholder: T('Bucket'),
    tooltip: T('Select the S3 bucket to use.'),
    options: [{
      label: '---', value: null
    }],
    isHidden: true,
  }, {
    type: 'input',
    name: 'folder',
    placeholder: T('Folder'),
    tooltip: T('Enter the name of the folder to sync to.'),
    isHidden: true,
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
    placeholder: T('Home Directory'),
    value: '/mnt',
    tooltip: T('Browse to the name of an <b>existing</b> pool or dataset\
                the user will be assigned access permissions.'),
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'transfer_mode',
    placeholder: T('Transfer Mode'),
    tooltip: T('<i>SYNC</i> keeps files identical between destination\
                and source. Files removed from the source are also\
                removed from the destination.<i>COPY</i> duplicates\
                files from source to destination. Skips identical files.\
                <i>MOVE</i> copies files from source to destination.\
                Deletes files from the source after finishing the copy.'),
    options: [
      { label: 'SYNC', value: 'SYNC' },
      { label: 'COPY', value: 'COPY' },
      { label: 'MOVE', value: 'MOVE' },
    ],
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'repeat',
    placeholder: T('Quick Schedule'),
    tooltip: T('Choose how often to run the task. Choose the\
                empty value to define a custom schedule.'),
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
    tooltip: T('Define the minute to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'hour',
    placeholder: T('Hour'),
    tooltip: T('Define the hour to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'daymonth',
    placeholder: T('Day of month'),
    tooltip: T('Define the day of the month to run the task.'),
    value: '*',
    isHidden: false,
  }, {
    type: 'select',
    name: 'month',
    placeholder: T('Month'),
    tooltip: T('Define which months to run the task.'),
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
    name: 'dayweek',
    placeholder: T('Day of week'),
    tooltip: T('Choose which days of the week to run the test.'),
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

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;
  protected credential: any;
  protected encryption: any;
  protected encryption_password: any;
  protected encryption_salt: any;
  protected bucket_field: any;
  protected folder_field: any;
  public credential_list = [];
  public selectedCredential: any;

  public formGroup: any;
  public error: string;
  protected pk: any;
  public isNew: boolean = false;
  protected data: any;
  protected pid: any;
  protected cloudcredential_query = 'backup.credential.query';

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected rest: RestService,
    protected dialog: DialogService,
    protected ws: WebSocketService) {}


  getBackblaze(credential){
    this.ws.call('backup.b2.get_buckets', [credential.id]).subscribe((res) => {
      return res;
    })
  }

  getAmazonCredential(credential){
    return this.ws.call('backup.s3.get_buckets', [credential.id]);
  }

  getB2Credential(credential){
    return this.ws.call('backup.b2.get_buckets', [credential.id])
  }

  getGcloudCredential(credential){
    return this.ws.call('backup.gcs.get_buckets', [credential.id]);
  }

  getAzureCredential(credential){
    return this.ws.call('backup.azure.get_buckets', [credential.id]);
  }

  checkProvider(credential){
    if (credential.provider == "AMAZON") {
      // code...goamazon
      this.getAmazonCredential(credential).subscribe(res => {
        _.find(this.fieldConfig, {'name': 'encryption'}).isHidden = false;
        if (res) {
          this.bucket_field.options = [];
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.name, value: item.name});
          });
        }
      });
    }else if (credential.provider == "BACKBLAZE") {
      this.getB2Credential(credential).subscribe(res => {
        if (res) {
          this.bucket_field.options = [];
          this.formGroup.controls['folder'].setValue('cloud');
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.bucketName, value: item.bucketName});
          });
        }
      });
    }else if (credential.provider == "GCLOUD") {
      this.getGcloudCredential(credential).subscribe(res => {
        if (res) {
          this.bucket_field.options = [];
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.name, value: item.name});
          });
        }
      });
    }else if (credential.provider == "AZURE") {
      this.getAzureCredential(credential).subscribe(res => {
        if (res) {
          this.bucket_field.options = [];
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item, value: item});
          });
        }
      });
    }
  }

  ngOnInit() {
    let date = new Date();
    this.month_field = _.find(this.fieldConfig, { 'name': 'month' });
    this.day_field = _.find(this.fieldConfig, { 'name': 'dayweek' });
    this.daymonth_field = _.find(this.fieldConfig, { 'name': 'daymonth' });
    this.hour_field = _.find(this.fieldConfig, { 'name': 'hour' });
    this.mintue_field = _.find(this.fieldConfig, { 'name': 'minute' });
    this.credential = _.find(this.fieldConfig, { 'name': 'credential' });
    this.bucket_field = _.find(this.fieldConfig, {'name': 'bucket'});
    this.folder_field = _.find(this.fieldConfig, {'name': 'folder'});


    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    this.formGroup.controls['credential'].valueChanges.subscribe((res)=>{
      console.log("credential value changed: ",res);
      if (res!=null) {
        _.find(this.fieldConfig, {'name': 'bucket'}).isHidden = false;
        _.find(this.fieldConfig, {'name': 'folder'}).isHidden = false;
        this.credential_list.forEach((item)=>{
          if (item.id == res) {
            this.selectedCredential = item;
            this.checkProvider(this.selectedCredential);
          }
        });
      }
      //get cloud credential provider by id,
      //show bucket, folder filed
    })

    this.ws.call(this.cloudcredential_query, {}).subscribe(res => {
      res.forEach((item) => {
        this.credential.options.push({ label: item.name + ' (' + item.provider + ')', value: item.id });
        this.credential_list.push(item);
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
          this.daymonth_field.isHidden = false;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['month'].setValue([date.getMonth().toString()]);
            this.formGroup.controls['dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls['daymonth'].setValue(date.getDate().toString());
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'hourly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.daymonth_field.isHidden = true;
          this.hour_field.isHidden = true;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'daily') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.daymonth_field.isHidden = true;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'weekly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = false;
          this.daymonth_field.isHidden = true;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls['hour'].setValue(date.getHours().toString());
            this.formGroup.controls['minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'monthly') {
          this.month_field.isHidden = true;
          this.day_field.isHidden = true;
          this.daymonth_field.isHidden = false;
          this.hour_field.isHidden = false;
          this.mintue_field.isHidden = false;

          if (this.isNew) {
            this.formGroup.controls['daymonth'].setValue(date.getDate().toString());
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
          console.log("query data: ", this.data);
          for (let i in this.data) {
            let fg = this.formGroup.controls[i];
            if (fg) {
              let current_field = this.fieldConfig.find((control) => control.name === i);
              if (current_field.name == "month" || current_field.name == "dayweek") {
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
          if(this.data.attrbutes) {
            this.formGroup.controls['folder'].setValue(this.data.attrbutes.folder);
          }

          if (_.isEqual(this.formGroup.controls['month'].value, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])) {
            if (_.isEqual(this.formGroup.controls['dayweek'].value, ['1', '2', '3', '4', '5', '6', '7'])) {
              if (this.formGroup.controls['daymonth'].value == '*') {
                if (this.formGroup.controls['hour'].value == '*') {
                  this.formGroup.controls['repeat'].setValue('hourly');
                } else {
                  this.formGroup.controls['repeat'].setValue('daily');
                }
              } else {
                this.formGroup.controls['repeat'].setValue('monthly');
              }
            } else {
              if (this.formGroup.controls['daymonth'].value == '*') {
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
    const auxPayLoad = []
    let attributes = {};
    const payload = {};

    if (value['repeat'] == 'hourly') {
      value['dayweek'] = '*';
      value['month'] = '*';
      value['daymonth'] = '*';
      value['hour'] = '*';
    } else if (value['repeat'] == 'daily') {
      value['dayweek'] = '*';
      value['month'] = '*';
      value['daymonth'] = '*';
    } else if (value['repeat'] == 'weekly') {
      value['month'] = '*';
      value['daymonth'] = '*';
    } else if (value['repeat'] == 'monthly') {
      value['dayweek'] = '*';
      value['month'] = '*';
    }

    payload['description'] = value.description;
    payload['direction'] = value.direction;
    payload['transfer_mode'] = value.transfer_mode;
    payload['path'] = value.path;
    payload['credential'] = parseInt(value.credential);
    if (value.encryption) {
      console.log(value.encryption);
    }
    payload['minute'] = value.minute;
    payload['hour'] = value.hour;
    payload['daymonth'] = value.daymonth;
    payload['dayweek'] = value.dayweek.join(",");
    payload['month'] = value.month.join(",");
    payload['enabled'] = value.enabled;
    attributes['bucket'] = value.bucket;
    attributes['folder'] = value.folder;
    payload['attributes'] = attributes;

    this.loader.open();
    if (!this.pk) {
      console.log("create cloud sync");
      auxPayLoad.push(payload)
      this.ws.call('backup.create', auxPayLoad).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (err) => {
        this.loader.close();
        console.log("error: ", err);
        this.dialog.errorReport('Error', err.reason, err.trace.formatted);
      });
    } else {
      this.loader.close();
      this.ws.job('backup.update', [parseInt(this.pid), payload]).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (err)=>{
        console.log("error: ", err);
        this.dialog.errorReport('Error', err.reason, err.trace.formatted);
      });
    }
  }
}
