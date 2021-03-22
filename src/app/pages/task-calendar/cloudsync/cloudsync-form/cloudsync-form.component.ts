import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

import * as _ from 'lodash';
import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { WebSocketService, DialogService, CloudCredentialService, AppLoaderService, JobService} from '../../../../services/';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/task-calendar/cloudsync/cloudsync-form';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-cloudsync-add',
  template: `<entity-form [conf]='this'></entity-form>`,
  providers: [CloudCredentialService, JobService]
})
export class CloudsyncFormComponent {

  protected addCall = 'cloudsync.create';
  protected editCall = 'cloudsync.update';
  public route_success: string[] = ['tasks', 'cloudsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity = true;
  protected queryCall = 'cloudsync.query';
  protected queryPayload = [];
  protected customFilter;

  public fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_transfer,
      label: true,
      class: '',
      width: '49%',
      config: [
        {
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
          type: 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path',
          placeholder: helptext.path_placeholder,
          value: '/mnt',
          tooltip: helptext.path_tooltip,
          required: true,
          validation : helptext.path_validation
        },
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext.fieldset_remote,
      label: true,
      class: '',
      width: '49%',
      config: [
        {
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
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext.fieldset_control,
      label: true,
      class: '',
      width: '100%',
      config: [
        {
          type: 'scheduler',
          name: 'cloudsync_picker',
          placeholder: helptext.cloudsync_picker_placeholder,
          tooltip: helptext.cloudsync_picker_tooltip,
          required: true,
          value: "0 0 * * *",
          class: 'inline',
          width: "50%"
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.enabled_placeholder,
          tooltip: helptext.enabled_tooltip,
          value: true,
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext.fieldset_advanced_options,
      label: true,
      class: '',
      width: '100%',
      config: [
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
              connective: 'OR',
              when: [{
                name: 'direction',
                value: 'PULL',
              }, {
                name: 'transfer_mode',
                value: 'MOVE',
              }]
            }
          ],
        },
        {
          type: 'checkbox',
          name: 'follow_symlinks',
          placeholder: helptext.follow_symlinks_placeholder,
          tooltip: helptext.follow_symlinks_tooltip,
        },
        {
          type: 'textarea',
          name: 'pre_script',
          placeholder: helptext.pre_script_placeholder,
          tooltip: helptext.pre_script_tooltip,
          value: '',
          class: 'inline',
          width: "50%"
        },
        {
          type: 'textarea',
          name: 'post_script',
          placeholder: helptext.post_script_placeholder,
          tooltip: helptext.post_script_tooltip,
          value: '',
          class: 'inline',
          width: "50%"
        },
        {
          type: 'chip',
          name: 'exclude',
          placeholder: helptext.exclude_placeholder,
          tooltip: helptext.exclude_tooltip,
          class: 'inline',
          width: "50%"
        },
        {
          type: 'paragraph',
          name: 'advanced_remote_options',
          paraText: helptext.advanced_remote_options,
        },
        {
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
          class: 'inline',
          width: "50%"
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
          class: 'inline',
          width: "50%"
        }, {
          type: 'input',
          inputType: 'number',
          name: 'chunk_size',
          placeholder: helptext.b2_chunk_size_placeholder,
          tooltip: helptext.b2_chunk_size_tooltip,
          isHidden: true,
          value: 96,
          min: 5,
          validation: [Validators.min(5)],
          class: 'inline',
          width: "50%"
        }, {
          type: 'checkbox',
          name: 'fast_list',
          placeholder: helptext.fast_list_placeholder,
          tooltip: helptext.fast_list_tooltip,
          isHidden: true,
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
          ],
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
          ],
          class: 'inline',
          width: "50%"
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
          ],
          class: 'inline',
          width: "50%"
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'transfers',
          placeholder: helptext.transfers_placeholder,
          tooltip: helptext.transfers_tooltip,
          value: null,
          class: 'inline',
          width: "50%"
        },
        {
          type: 'chip',
          name: 'bwlimit',
          placeholder: helptext.bwlimit_placeholder,
          tooltip: helptext.bwlimit_tooltip,
          class: 'inline',
          width: "50%"
        }
      ]
    }
  ];
  public fieldConfig = [];

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
  public isNew = false;
  protected data: any;

  protected providers: any;
  protected taskSchemas = ['encryption', 'fast_list', 'chunk_size', 'storage_class'];
  public custActions: Array<any> = [
    {
      id : 'dry_run',
      name : helptext.action_button_dry_run,
      function : () => {
        const payload = this.submitDataHandler(this.formGroup.value);
        const dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": helptext.job_dialog_title_dry_run }, disableClose: true});
        dialogRef.componentInstance.setCall('cloudsync.sync_onetime', [payload, {"dry_run": true}]);
        dialogRef.componentInstance.showAbortButton = true;
        dialogRef.componentInstance.showRealtimeLogs = true;
        dialogRef.componentInstance.hideProgressValue = true;
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.subscribe((res) => {
          dialogRef.componentInstance.showCloseButton = true;
          // this.matDialog.closeAll();
          // this.job.showLogs(res);
        });
        dialogRef.componentInstance.failure.subscribe((err) => {
          this.matDialog.closeAll()
          new EntityUtils().handleWSError(this.entityForm, err);
        });
      }
    }
  ];

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected dialog: DialogService,
    protected matDialog: MatDialog,
    protected ws: WebSocketService,
    protected cloudcredentialService: CloudCredentialService,
    protected job: JobService) {
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
    const formValue = this.entityForm.formGroup.value;
    const children = [];
    let data = {
      "credentials": credential,
      "encryption": formValue['encryption'] === undefined ? false : formValue['encryption'],
      "filename_encryption": formValue['filename_encryption'] === undefined ? false : formValue['filename_encryption'],
      "encryption_password": formValue['encryption_password'] === undefined ? "" : formValue['encryption_password'],
      "encryption_salt": formValue['encryption_salt'] === undefined ? "" : formValue['encryption_salt'],
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
              child['name'] = data.attributes.folder + res[i].Name;
            } else {
              child['name'] = data.attributes.folder + '/' + res[i].Name;
            }
            child['subTitle'] = res[i].Decrypted ? `${res[i].Decrypted} (${res[i].Name})` : res[i].Name;
            child['hasChildren'] = true;
            children.push(child);
          }
        }
        return children;
      },
      (err) => {
        if (err.extra && err.extra[0] && err.extra[0][0].split('.').pop() == 'bucket') {
          this.setBucketError(err.extra[0][1]);
        } else {
          new EntityUtils().handleWSError(this, err, this.dialog);
        }
        node.collapse();
      });
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

  preInit() {
    this.aroute.params.subscribe(params => {
        this.pk = params['pk'];
        if (this.pk) {
          this.customFilter = [[["id", "=", parseInt(params['pk'], 10)]]]
        }
    });
  }

  dataHandler(entityForm) {
    const data = entityForm.wsResponse;
    for (const i in data) {
      const fg = entityForm.formGroup.controls[i];
      if (fg) {
        const current_field = this.fieldConfig.find((control) => control.name === i);
        fg.setValue(data[i]);
      }
    }
    if (data.credentials) {
      entityForm.formGroup.controls['credentials'].setValue(data.credentials.id);
    }
    if (data.attributes) {
      for (let attr in data.attributes) {
        attr = attr === 'encryption' ? 'task_encryption' : attr;
        if (entityForm.formGroup.controls[attr]) {
          if (attr === 'task_encryption') {
            entityForm.formGroup.controls[attr].setValue(data.attributes['encryption'] == null ? '' : data.attributes['encryption']);
          } else {
            entityForm.formGroup.controls[attr].setValue(data.attributes[attr]);
          }
          if (attr === 'bucket' && entityForm.formGroup.controls['bucket_input']) {
            entityForm.formGroup.controls['bucket_input'].setValue(data.attributes[attr]);
          }
        }
      }
    }
  }

  async afterInit(entityForm) {
    this.entityForm = entityForm;
    this.formGroup = entityForm.formGroup;

    this.credentials = _.find(entityForm.fieldConfig, { 'name': 'credentials' });
    this.bucket_field = _.find(entityForm.fieldConfig, {'name': 'bucket'});
    this.bucket_input_field = _.find(entityForm.fieldConfig, {'name': 'bucket_input'});
    this.setDisabled('bucket', true, true);
    this.setDisabled('bucket_input', true, true);
    this.cloudcredentialService.getCloudsyncCredentials().then(
      (res) => {
        res.forEach((item) => {
          this.credentials.options.push({ label: item.name + ' (' + item.provider + ')', value: item.id });
          this.credentials_list.push(item);
        });
      }
    )

    this.folder_field = _.find(entityForm.fieldConfig, { "name": "folder"}); 
    this.formGroup.controls['credentials'].valueChanges.subscribe((res)=>{
      this.setDisabled('bucket', true, true);
      this.setDisabled('bucket_input', true, true);
      // reset folder tree view
      if (!this.folder_field.disabled) {
        if (this.folder_field.customTemplateStringOptions.explorer) {
          this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
        }
      }

      if (res!=null) {
        this.credentials_list.forEach((item)=>{
          if (item.id == res) {
            const targetProvider = _.find(this.providers, {"name": item.provider});
            if (targetProvider && targetProvider['buckets']) {
              if (entityForm.loaderOpen === false) {
                this.loader.open();
              } else {
                entityForm.keepLoaderOpen = true;
              }

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
                  if (entityForm.loaderOpen === false) {
                    this.loader.close();
                  } else {
                    entityForm.loader.close();
                    entityForm.loaderOpen = false;
                    entityForm.keepLoaderOpen = false;
                  }
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
                  if (entityForm.loaderOpen === false) {
                    this.loader.close();
                  } else {
                    entityForm.loader.close();
                    entityForm.loaderOpen = false;
                    entityForm.keepLoaderOpen = false;
                  }
                  this.setDisabled('bucket', true, true);
                  this.setDisabled('bucket_input', false, false);
                  this.dialog.confirm(err.extra ? err.extra.excerpt : (T('Error: ') + err.error) , err.reason, true, T('Fix Credential')).subscribe(
                    (dialog_res) => {
                      if (dialog_res) {
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
      if (this.folder_field.customTemplateStringOptions.explorer) {
        this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
      }
    });

    this.formGroup.controls['bucket'].valueChanges.subscribe((res)=> {
      this.setBucketError(null);
      if (this.folder_field.customTemplateStringOptions.explorer) {
        this.folder_field.customTemplateStringOptions.explorer.ngOnInit();
      }
    });

    this.formGroup.controls['bwlimit'].valueChanges.subscribe((res)=> {
      _.find(entityForm.fieldConfig, {name: 'bwlimit'}).hasErrors = false;
      _.find(entityForm.fieldConfig, {name: 'bwlimit'}).errors = null;
      this.formGroup.controls['bwlimit'].errors = null;
    });

    // When user interacts with direction dropdown, change transfer_mode to COPY
    this.formGroup
      .get('direction')
      .valueChanges.pipe(filter(() => this.formGroup.get('transfer_mode').value !== 'COPY'))
      .subscribe(() => {
        this.dialog.Info(helptext.resetTransferModeDialog.title, helptext.resetTransferModeDialog.content, '500px', 'info', true);
        this.formGroup.get('transfer_mode').setValue('COPY');
      });

    // Update transfer_mode paragraphs when the mode is changed
    this.formGroup.get('transfer_mode').valueChanges.subscribe(mode => {
      const paragraph = entityForm.fieldConfig.find(config => config.name === 'transfer_mode_warning');
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
  }

  resourceTransformIncomingRestData(data) {
    data['cloudsync_picker'] = data.schedule.minute + " " +
                          data.schedule.hour + " " +
                          data.schedule.dom + " " +
                          data.schedule.month + " " +
                          data.schedule.dow;

    if (data.bwlimit) {
      const bwlimit = [];
      for (let i = 0; i < data.bwlimit.length; i++) {
        let sub_bwlimit = data.bwlimit[i].time + ",off";
        if (data.bwlimit[i].bandwidth != null) {
          const bw = (<any>window).filesize(data.bwlimit[i].bandwidth, {output: "object"});
          sub_bwlimit = data.bwlimit[i].time + "," + bw.value + bw.symbol;
        }
        bwlimit.push(sub_bwlimit);
      }
      data.bwlimit = bwlimit;
    }

    return data;
  }

  handleBwlimit(bwlimit: any): Array<any> {
    const bwlimtArr = [];

    for (let i = 0; i < bwlimit.length; i++) {
      const sublimitArr = bwlimit[i].split(',');
      if (sublimitArr.length === 1 && bwlimit.length === 1) {
        if (!sublimitArr[0].includes(':')) {
          sublimitArr.unshift('00:00');
        }
      }
      if (sublimitArr[1] && sublimitArr[1] != 'off') {
        if (sublimitArr[1].endsWith('/s') || sublimitArr[1].endsWith('/S')) {
          sublimitArr[1] = sublimitArr[1].substring(0, sublimitArr[1].length - 2);
        }
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

  submitDataHandler(formValue) {
    const value = _.cloneDeep(formValue);
    const attributes = {};
    const schedule = {};

    value['credentials'] = parseInt(value.credentials, 10);

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
    if (value['chunk_size'] != undefined) {
      attributes['chunk_size'] = value['chunk_size'];
      delete value['chunk_size'];
    }

    value['attributes'] = attributes;

    if (value.cloudsync_picker) {
      const spl = value.cloudsync_picker.split(" ");
      delete value.cloudsync_picker;
      schedule['minute'] = spl[0];
      schedule['hour'] = spl[1];
      schedule['dom'] = spl[2];
      schedule['month'] = spl[3];
      schedule['dow'] = spl[4];
    }

    value['schedule'] = schedule;

    if (value.bwlimit !== undefined) {
      value.bwlimit = this.handleBwlimit(value.bwlimit);
    }

    if (!this.formGroup.valid) {
      return;
    }

    if (value['direction'] == 'PULL') {
      value['snapshot'] = false;
    }
    return value;
  }

  customSubmit(value) {
    value = this.submitDataHandler(value);
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
      this.ws.call(this.editCall, [parseInt(this.pk, 10), value]).subscribe(
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

  isCustActionDisabled(id) {
    return !this.entityForm.valid;
  }
}
