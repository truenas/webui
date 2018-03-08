import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService, WebSocketService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

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
    placeholder: 'Description',
    tooltip: 'Optional.',
  }, {
    type: 'select',
    name: 'direction',
    placeholder: 'Direction',
    options: [
      { label: 'PULL', value: 'PULL' },
      { label: 'PUSH', value: 'PUSH' },
    ]
  }, {
    type: 'select',
    name: 'credential',
    placeholder: 'Credential',
    options: [{
      label: '---', value: null
    }]
  }, {
    type: 'select',
    name: 'bucket',
    placeholder: 'Bucket',
    options: [{
      label: '---', value: null
    }],
    isHidden: true,
  }, {
    type: 'input',
    name: 'folder',
    placeholder: 'Folder',
    isHidden: true,
  }, {
    type: 'select',
    name: 'amazon_encryp',
    options: [
      {label: "None", value: ""},
      {label: "AES-256", value: "AES256"},
    ],
    isHidden: true,
  },{
    type: 'explorer',
    initial: '/mnt',
    explorerType: 'directory',
    name: 'path',
    placeholder: 'Home Directory',
    value: '/mnt',
    tooltip: 'Browse to the name of an <b>existing</b> volume or\
      dataset that the user will be assigned permission to access.',
  }, {
    type: 'select',
    name: 'transfer_mode',
    placeholder: 'Transfer Mode',
    options: [
      { label: 'SYNC', value: 'SYNC' },
      { label: 'COPY', value: 'COPY' },
      { label: 'MOVE', value: 'MOVE' },
    ]
  }, {
    type: 'checkbox',
    name: 'encryption',
    placeholder: 'Remote Encryption',
  }, {
    type: 'input',
    name: 'encryption_password',
    placeholder: 'encryption_password',
    inputType : 'password',
  }, {
    type: 'input',
    name: 'encryption_salt',
    placeholder: 'encryption_salt',
    inputType : 'password',
  }, {
    type: 'select',
    name: 'repeat',
    placeholder: 'Quick Schedule',
    tooltip: 'Select a time frame for the job. Otherwise, do not select\
 a time frame to customize the schedule.',
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
    placeholder: 'Minute',
    tooltip: 'The job occurs at the specified minutes.',
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'hour',
    placeholder: 'Hour',
    tooltip: 'The job occurs at the specified hours.',
    value: '*',
    isHidden: false,
  }, {
    type: 'input',
    name: 'daymonth',
    placeholder: 'Day of month',
    tooltip: 'The job occurs on the specified days each month.',
    value: '*',
    isHidden: false,
  }, {
    type: 'select',
    name: 'month',
    placeholder: 'Month',
    tooltip: 'The job occurs at the specified months.',
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
    placeholder: 'Day of week',
    tooltip: 'The job occurs on the specified days.',
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
    placeholder: 'Enable',
    tooltip: 'Uncheck to disable the job without deleting it.',
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
        if (res) {
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.name, value: item.name});
          });
        }
      });
    }else if (credential.provider == "BACKBLAZE") {
      this.getB2Credential(credential).subscribe(res => {
        if (res) {
          this.formGroup.controls['folder'].setValue('cloud');
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.bucketName, value: item.bucketName});
          });
        }
      });
    }else if (credential.provider == "GCLOUD") {
      this.getGcloudCredential(credential).subscribe(res => {
        if (res) {
          res.forEach((item) => {
            this.bucket_field.options.push({ label: item.name, value: item.name});
          });
        }
      });
    }else if (credential.provider == "AZURE") {
      this.getAzureCredential(credential).subscribe(res => {
        if (res) {
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
    this.encryption_password = _.find(this.fieldConfig, {'name': 'encryption_password'});
    this.encryption_salt = _.find(this.fieldConfig, {'name': 'encryption_salt'});
    this.bucket_field = _.find(this.fieldConfig, {'name': 'bucket'});
    this.folder_field = _.find(this.fieldConfig, {'name': 'folder'});


    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.formGroup.controls['encryption'].valueChanges.subscribe((res)=> {
      this.encryption_password.isHidden = !res;
      this.encryption_salt.isHidden = !res;
    });

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
        this.credential.options.push({ label: item.name, value: item.id });
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
      payload['encryption'] = value.encryption;
      payload['filename_encryption'] = value.filename_encryption;
      payload['encryption_password'] = value.encryption_password;
      payload['encryption_salt'] = value.encryption_salt;
    }
    payload['minute'] = value.minute;
    payload['hour'] = value.hour;
    payload['daymonth'] = value.daymonth;
    payload['dayweek'] = value.dayweek;
    payload['month'] = value.month;
    payload['enabled'] = value.enabled;
    attributes['bucket'] = value.bucket;
    attributes['folder'] = value.folder;
    payload['attributes'] = attributes;
    
    if (!this.pk) {
      auxPayLoad.push(payload)
      this.ws.call('backup.create', auxPayLoad).subscribe(res=>{});
    } else {
      this.ws.job('backup.update', [parseInt(this.pid), payload]).subscribe((res)=>{
      });
    }
    this.router.navigate(new Array('/').concat(this.route_success));
  }
}
