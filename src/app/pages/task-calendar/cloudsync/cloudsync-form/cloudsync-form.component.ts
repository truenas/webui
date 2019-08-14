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
import { EntityUtils } from '../../../common/entity/utils';
import { Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';

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
    value: 'PULL',
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
    value: '',
    isHidden: true,
    disabled: true,
    required: true,
    validation : helptext.bucket_input_validation
  }, {
    type: 'explorer',
    name: 'folder',
    placeholder: helptext.folder_placeholder,
    tooltip: helptext.folder_tooltip,
    initial: '/',
    value: '/',
    explorerType: 'directory',
    customTemplateStringOptions: {
      displayField: 'Path',
      isExpandedField: 'expanded',
      idField: 'uuid',
      getChildren: this.getChildren.bind(this),
      nodeHeight: 23,
      allowDrag: true,
      useVirtualScroll: false,
    },
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
  }, {
    type: 'select',
    name: 'task_encryption',
    placeholder: helptext.encryption_placeholder,
    tooltip: helptext.encryption_tooltip,
    options: [
      {label: "None", value: ""},
      {label: "AES-256", value: "AES256"},
    ],
    value: "",
    isHidden: true,
  }, {
    type: 'select',
    name: 'storage_class',
    placeholder: helptext.storage_class_placeholder,
    tooltip: helptext.storage_class_tooltip,
    options: [
      {label: "---------", value: ""},
      {label: "STANDARD", value: "STANDARD"},
      {label: "REDUCED_REDUNDANCY", value: "REDUCED_REDUNDANCY"},
      {label: "STANDARD_IA", value: "STANDARD_IA"},
      {label: "ONEZONE_IA", value: "ONEZONE_IA"},
      {label: "GLACIER", value: "GLACIER"},
      {label: "DEEP_ARCHIVE", value: "DEEP_ARCHIVE"},
    ],
    value: '',
    isHidden: true,
  }, {
    type: 'input',
    inputType: 'number',
    name: 'b2-chunk-size',
    placeholder: helptext.b2_chunk_size_placeholder,
    tooltip: helptext.b2_chunk_size_tooltip,
    isHidden: true,
    value: 96,
    min: 5,
    validation: [Validators.min(5)],
  }, {
    type: 'checkbox',
    name: 'fast_list',
    placeholder: helptext.fast_list_placeholder,
    tooltip: helptext.fast_list_tooltip,
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
    tooltip: helptext.transfer_mode_warning_sync + ' ' + helptext.transfer_mode_warning_copy + ' ' + helptext.transfer_mode_warning_move,
    options: [
      { label: 'SYNC', value: 'SYNC' },
      { label: 'COPY', value: 'COPY' },
      { label: 'MOVE', value: 'MOVE' },
    ],
    value: 'COPY',
    required: true,
    validation : helptext.transfer_mode_validation
  },
  {
    type: 'paragraph',
    name: 'transfer_mode_warning',
    paraText: helptext.transfer_mode_warning_copy,
    isLargeText: true,
    paragraphIcon: 'add_to_photos'
  },
  {
    type: 'checkbox',
    name: 'snapshot',
    placeholder: helptext.snapshot_placeholder,
    tooltip: helptext.snapshot_tooltip,
    value: false,
    isHidden: false,
    disabled: false,
    relation: [
      {
        action: 'HIDE',
        when: [{
          name: 'direction',
          value: 'PULL',
        }]
      }
    ],
  },
  {
    type: 'textarea',
    name: 'pre_script',
    placeholder: helptext.pre_script_placeholder,
    tooltip: helptext.pre_script_tooltip,
    value: '',
  },
  {
    type: 'textarea',
    name: 'post_script',
    placeholder: helptext.post_script_placeholder,
    tooltip: helptext.post_script_tooltip,
    value: '',
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
    type: 'scheduler',
    name: 'cloudsync_picker',
    placeholder: helptext.cloudsync_picker_placeholder,
    tooltip: helptext.cloudsync_picker_tooltip,
    required: true,
    value: "0 0 * * *",
  },
  {
    type: 'input',
    inputType: 'number',
    name: 'transfers',
    placeholder: helptext.transfers_placeholder,
    tooltip: helptext.transfers_tooltip,
    value: null,
  },
  {
    type: 'checkbox',
    name: 'follow_symlinks',
    placeholder: helptext.follow_symlinks_placeholder,
    tooltip: helptext.follow_symlinks_tooltip,
  },
  {
    type: 'checkbox',
    name: 'enabled',
    placeholder: helptext.enabled_placeholder,
    tooltip: helptext.enabled_tooltip,
    value: true,
  },
  {
    type: 'input',
    name: 'bwlimit',
    placeholder: helptext.bwlimit_placeholder,
    tooltip: helptext.bwlimit_tooltip,
  },
  {
    type: 'input',
    name: 'exclude',
    placeholder: helptext.exclude_placeholder,
    tooltip: helptext.exclude_tooltip,
  }];

  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected dom_field: any;
  protected credentials: any;
  protected bucket_field: any;
  protected bucket_input_field: any;
  protected folder_field: any;
  public credentials_list = [];

  public formGroup: any;
  public error: string;
  protected pk: any;
  public isNew: boolean = false;
  protected data: any;
  protected pid: any;
  protected cloudcredential_query = 'cloudsync.credentials.query';

  protected providers: any;
  protected taskSchemas = ['encryption', 'fast_list', 'b2-chunk-size', 'storage_class'];

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

  getChildren(node) {
    let credential = this.formGroup.controls['credentials'].value;
    let bucket = this.formGroup.controls['bucket'].value;
    if (this.bucket_field.disabled) {
      bucket = this.formGroup.controls['bucket_input'].value;
    }
    return new Promise((resolve, reject) => {
        resolve(this.getBucketFolders(credential, bucket, node));
    });
  }

  setBucketError(error: any) {
      if (error) {
        this.bucket_field.hasErrors = true;
        this.bucket_field.errors = error;
        this.bucket_input_field.hasErrors = true;
        this.bucket_input_field.errors = error;
      } else {
        this.bucket_field.hasErrors = false;
        this.bucket_field.errors = null;
        this.bucket_input_field.hasErrors = false;
        this.bucket_input_field.errors = null;
      }
  }

  getBucketFolders(credential, bucket, node) {
    const children = [];
    let data = {
      "credentials": credential,
      "encryption": false,
      "filename_encryption": false,
      "encryption_password": "",
      "encryption_salt": "",
      "attributes": {
        "bucket": bucket,
        "folder": node.data.name,
      },
      "args": ""
    }
    if (bucket == '') {
      delete data.attributes.bucket;
    }
    return this.ws.call('cloudsync.list_directory', [data]).toPromise().then(
      (res) => {
        this.setBucketError(null);

        for (let i = 0; i < res.length; i++) {
          const child = {};
          if (res[i].IsDir) {
            if (data.attributes.folder == '/') {
              child['name'] = data.attributes.folder + res[i].Path;
            } else {
              child['name'] = data.attributes.folder + '/' + res[i].Path;
            }
            child['subTitle'] = res[i].Name;
            child['hasChildren'] = true;
            children.push(child);
          }
        }
        return children;
      },
      (err) => {
        if (err.extra && err.extra[0][0].split('.').pop() == 'bucket') {
          this.setBucketError(err.extra[0][1]);
        } else {
          new EntityUtils().handleWSError(this, err);
        }
      });
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
    this.folder_field = _.find(this.fieldConfig, { "name": "folder"});
    this.formGroup.controls['credentials'].valueChanges.subscribe((res)=>{
      // reset folder tree view
      if (!this.folder_field.disabled) {
        this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
      }

      if (res!=null) {
        this.credentials_list.forEach((item)=>{
          if (item.id == res) {
            const targetProvider = _.find(this.providers, {"name": item.provider});
            if (targetProvider && targetProvider['buckets']) {
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
                    res.forEach((subitem) => {
                      this.bucket_field.options.push({ label: subitem.Name, value: subitem.Path });
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

            const task_schema = _.find(this.providers, {"name": item.provider}) ?  _.find(this.providers, {"name": item.provider})['task_schema'] : [];

            for (const i of this.taskSchemas) {
              const tobeDisable = _.findIndex(task_schema, {property: i}) > -1 ? false : true;
              this.setDisabled(i === 'encryption' ? 'task_encryption' : i, tobeDisable, tobeDisable);
            }
          }
        });
      } else {
        for (const i of this.taskSchemas) {
          this.setDisabled(i === 'encryption' ? 'task_encryption' : i, true, true);
        }
      }
    })

    this.formGroup.controls['bucket_input'].valueChanges.subscribe((res)=> {
      this.setBucketError(null);
      this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
    });

    this.formGroup.controls['bucket'].valueChanges.subscribe((res)=> {
      this.setBucketError(null);
      this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
    });

    this.formGroup.controls['bwlimit'].valueChanges.subscribe((res)=> {
      _.find(this.fieldConfig, {name: 'bwlimit'}).hasErrors = false;
      _.find(this.fieldConfig, {name: 'bwlimit'}).errors = null;
      this.formGroup.controls['bwlimit'].errors = null;
    });

    // When user interacts with direction dropdown, change transfer_mode to COPY
    this.formGroup
      .get('direction')
      .valueChanges.pipe(filter(() => this.formGroup.get('transfer_mode').value !== 'COPY'))
      .subscribe(() => this.formGroup.get('transfer_mode').setValue('COPY'));

    // Update transfer_mode paragraphs when the mode is changed
    this.formGroup.get('transfer_mode').valueChanges.subscribe(mode => {
      const paragraph = this.fieldConfig.find(config => config.name === 'transfer_mode_warning');
      switch (mode) {
        case 'SYNC':
          paragraph.paraText = helptext.transfer_mode_warning_sync;
          paragraph.paragraphIcon = 'sync';
          break;
        case 'MOVE':
          paragraph.paraText = helptext.transfer_mode_warning_move;
          paragraph.paragraphIcon = 'move_to_inbox';
          break;
        default:
          paragraph.paraText = helptext.transfer_mode_warning_copy;
          paragraph.paragraphIcon = 'add_to_photos';
      }
    });

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

    if (data.bwlimit) {
      let bwlimit_str = "";
      for (let i = 0; i < data.bwlimit.length; i++) {
        if (data.bwlimit[i].bandwidth != null) {
          const bw = (<any>window).filesize(data.bwlimit[i].bandwidth, {output: "object"});
          const sub_bwlimit = data.bwlimit[i].time + "," + bw.value + bw.symbol;
          if (bwlimit_str != "") {
            bwlimit_str += " " + sub_bwlimit;
          } else {
            bwlimit_str += sub_bwlimit;
          }
        }
      }
      data.bwlimit = bwlimit_str;
    }

    if (data.exclude) {
      data.exclude = _.join(data.exclude, ' ');
    }

    return data;
  }

  handleBwlimit(bwlimit: any): Array<any> {
    const bwlimtArr = [];
    bwlimit = bwlimit.trim().split(' ');

    for (let i = 0; i < bwlimit.length; i++) {
      const sublimitArr = bwlimit[i].split(',');
      if (sublimitArr[1] && sublimitArr[1] != 'off') {
        if (this.cloudcredentialService.getByte(sublimitArr[1]) == -1) {
          _.find(this.fieldConfig, {name: 'bwlimit'}).hasErrors = true;
          _.find(this.fieldConfig, {name: 'bwlimit'}).errors = 'Invalid bandwidth ' + sublimitArr[1];
          this.formGroup.controls['bwlimit'].setErrors('Invalid bandwidth ' + sublimitArr[1]);
        } else {
          sublimitArr[1] = this.cloudcredentialService.getByte(sublimitArr[1]);
        }
      }
      const subLimit = {
        "time": sublimitArr[0],
        "bandwidth": sublimitArr[1] == 'off' ? null : sublimitArr[1],
      }

      bwlimtArr.push(subLimit);
    }
    return bwlimtArr;
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
    if (value.task_encryption != undefined) {
      attributes['encryption'] = value.task_encryption === '' ? null : value.task_encryption;
      delete value.task_encryption;
    }
    if (value['storage_class'] != undefined) {
      attributes['storage_class'] = value['storage_class'];
      delete value['storage_class'];
    }
    if (value.fast_list != undefined) {
      attributes['fast_list'] = value.fast_list;
      delete value.fast_list;
    }
    if (value['b2-chunk-size'] != undefined) {
      attributes['b2-chunk-size'] = value['b2-chunk-size'];
      delete value['b2-chunk-size'];
    }

    value['attributes'] = attributes;

    let spl = value.cloudsync_picker.split(" ");
    delete value.cloudsync_picker;
    schedule['minute'] = spl[0];
    schedule['hour'] = spl[1];
    schedule['dom'] = spl[2];
    schedule['month'] = spl[3];
    schedule['dow'] = spl[4];

    value['schedule'] = schedule;

    if (value.bwlimit !== undefined) {
      value.bwlimit = value.bwlimit.trim() === '' ? [] : this.handleBwlimit(value.bwlimit);
    }

    if (value.exclude !== undefined) {
      value.exclude = value.exclude.trim() === '' ? [] : value.exclude.trim().split(" ");
    }

    if (!this.formGroup.valid) {
      return;
    }

    if (value['direction'] == 'PULL') {
      value['snapshot'] = false;
    }

    if (!this.pk) {
      this.loader.open();
      this.ws.call(this.addCall, [value]).subscribe((res)=>{
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
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
        new EntityUtils().handleWSError(this, err);
        }
      );
    }
  }

}
