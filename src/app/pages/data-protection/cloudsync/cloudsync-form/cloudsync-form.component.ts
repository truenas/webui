import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TreeNode } from 'angular-tree-component';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { Direction } from 'app/enums/direction.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncBucket, CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import {
  FieldConfig, FormExplorerConfig, FormInputConfig, FormParagraphConfig, FormSelectConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils, NULL_VALUE } from 'app/pages/common/entity/utils';
import {
  WebSocketService, DialogService, CloudCredentialService, AppLoaderService, JobService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-cloudsync-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [CloudCredentialService, JobService],
})
export class CloudsyncFormComponent implements FormConfiguration {
  addCall: 'cloudsync.create' = 'cloudsync.create';
  editCall: 'cloudsync.update' = 'cloudsync.update';
  entityForm: EntityFormComponent;
  isEntity = true;
  queryCall: 'cloudsync.query' = 'cloudsync.query';
  queryPayload: any[] = [];
  customFilter: any[] = [];
  title: string;

  fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.fieldset_transfer,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.description_placeholder,
          tooltip: helptext.description_tooltip,
          required: true,
          validation: helptext.description_validation,
        }, {
          type: 'select',
          name: 'direction',
          placeholder: helptext.direction_placeholder,
          tooltip: helptext.direction_tooltip,
          options: [
            { label: T('PUSH'), value: Direction.Push },
            { label: T('PULL'), value: Direction.Pull },
          ],
          value: Direction.Pull,
          required: true,
          validation: helptext.direction_validation,
        }, {
          type: 'select',
          name: 'transfer_mode',
          placeholder: helptext.transfer_mode_placeholder,
          tooltip: helptext.transfer_mode_warning_sync + ' ' + helptext.transfer_mode_warning_copy + ' ' + helptext.transfer_mode_warning_move,
          options: [
            { label: T('SYNC'), value: TransferMode.Sync },
            { label: T('COPY'), value: TransferMode.Copy },
            { label: T('MOVE'), value: TransferMode.Move },
          ],
          value: TransferMode.Copy,
          required: true,
          validation: helptext.transfer_mode_validation,
        },
        {
          type: 'paragraph',
          name: 'transfer_mode_warning',
          paraText: helptext.transfer_mode_warning_copy,
          isLargeText: true,
          paragraphIcon: 'add_to_photos',
        },
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          tristate: false,
          name: 'path_destination',
          placeholder: helptext.path_placeholder,
          value: '/mnt',
          tooltip: helptext.path_tooltip,
          required: true,
          validation: helptext.path_validation,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path_source',
          placeholder: helptext.path_placeholder,
          value: '/mnt',
          multiple: true,
          tristate: false,
          disabled: true,
          isHidden: true,
          tooltip: helptext.path_tooltip,
          required: true,
          validation: helptext.path_validation,
        },
      ],
    },
    {
      name: helptext.fieldset_remote,
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'credentials',
          placeholder: helptext.credentials_placeholder,
          tooltip: helptext.credentials_tooltip,
          options: [{
            label: '----------', value: null,
          }],
          value: null,
          required: true,
          validation: helptext.credentials_validation,
        }, {
          type: 'select',
          name: 'bucket',
          placeholder: helptext.bucket_placeholder,
          tooltip: helptext.bucket_tooltip,
          options: [{
            label: '----------', value: '',
          }],
          value: '',
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptext.bucket_validation,
        }, {
          type: 'input',
          name: 'bucket_input',
          placeholder: helptext.bucket_input_placeholder,
          tooltip: helptext.bucket_input_tooltip,
          value: '',
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptext.bucket_input_validation,
        }, {
          type: 'explorer',
          name: 'folder_destination',
          placeholder: helptext.folder_placeholder,
          tooltip: helptext.folder_tooltip,
          initial: '/',
          value: '/',
          tristate: false,
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
        },
        {
          type: 'explorer',
          multiple: true,
          name: 'folder_source',
          tristate: false,
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
        },
      ],
    },
    {
      name: helptext.fieldset_control,
      label: true,
      config: [
        {
          type: 'scheduler',
          name: 'cloudsync_picker',
          placeholder: helptext.cloudsync_picker_placeholder,
          tooltip: helptext.cloudsync_picker_tooltip,
          required: true,
          value: '0 0 * * *',
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.enabled_placeholder,
          tooltip: helptext.enabled_tooltip,
          value: true,
        },
      ],
    },
    {
      name: helptext.fieldset_advanced_options,
      label: true,
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
              action: RelationAction.Hide,
              connective: RelationConnection.Or,
              when: [{
                name: 'direction',
                value: Direction.Pull,
              }, {
                name: 'transfer_mode',
                value: TransferMode.Move,
              }],
            },
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
        },
        {
          type: 'textarea',
          name: 'post_script',
          placeholder: helptext.post_script_placeholder,
          tooltip: helptext.post_script_tooltip,
          value: '',
        },
        {
          type: 'chip',
          name: 'exclude',
          placeholder: helptext.exclude_placeholder,
          tooltip: helptext.exclude_tooltip,
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
            { label: 'None', value: '' },
            { label: 'AES-256', value: 'AES256' },
          ],
          value: '',
          isHidden: true,
        }, {
          type: 'select',
          name: 'storage_class',
          placeholder: helptext.storage_class_placeholder,
          tooltip: helptext.storage_class_tooltip,
          options: [
            { label: '---------', value: '' },
            { label: 'STANDARD', value: 'STANDARD' },
            { label: 'REDUCED_REDUNDANCY', value: 'REDUCED_REDUNDANCY' },
            { label: 'STANDARD_IA', value: 'STANDARD_IA' },
            { label: 'ONEZONE_IA', value: 'ONEZONE_IA' },
            { label: 'GLACIER', value: 'GLACIER' },
            { label: 'DEEP_ARCHIVE', value: 'DEEP_ARCHIVE' },
          ],
          value: '',
          isHidden: true,
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
              action: RelationAction.Show,
              when: [{
                name: 'encryption',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'encryption_password',
          placeholder: helptext.encryption_password_placeholder,
          tooltip: helptext.encryption_password_tooltip,
          inputType: 'password',
          togglePw: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'encryption',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'encryption_salt',
          placeholder: helptext.encryption_salt_placeholder,
          tooltip: helptext.encryption_salt_tooltip,
          inputType: 'password',
          togglePw: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'encryption',
                value: true,
              }],
            },
          ],
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
          type: 'chip',
          name: 'bwlimit',
          placeholder: helptext.bwlimit_placeholder,
          tooltip: helptext.bwlimit_tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);
  fieldConfig: FieldConfig[] = [];

  protected credentials: FormSelectConfig;
  protected bucket_field: FormSelectConfig;
  protected bucket_input_field: FormInputConfig;
  protected folder_field_destination: FormExplorerConfig;
  protected folder_field_source: FormExplorerConfig;
  credentials_list: CloudsyncCredential[] = [];

  formGroup: FormGroup;
  error: string;
  pk: number;
  isNew = false;
  protected data: any;

  protected providers: CloudsyncProvider[];
  protected taskSchemas = ['encryption', 'fast_list', 'chunk_size', 'storage_class'];
  custActions = [
    {
      id: 'dry_run',
      name: helptext.action_button_dry_run,
      function: () => {
        const payload = this.submitDataHandler(this.formGroup.value);
        const dialogRef = this.matDialog.open(EntityJobComponent, {
          data: { title: helptext.job_dialog_title_dry_run },
          disableClose: true,
        });
        dialogRef.componentInstance.setCall('cloudsync.sync_onetime', [payload, { dry_run: true }]);
        dialogRef.componentInstance.showAbortButton = true;
        dialogRef.componentInstance.showRealtimeLogs = true;
        dialogRef.componentInstance.hideProgressValue = true;
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.componentInstance.showCloseButton = true;
          // this.matDialog.closeAll();
          // this.job.showLogs(res);
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
          this.matDialog.closeAll();
          new EntityUtils().handleWSError(this.entityForm, err);
        });
      },
    },
  ];

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected dialog: DialogService,
    protected matDialog: MatDialog,
    protected ws: WebSocketService,
    protected cloudcredentialService: CloudCredentialService,
    protected job: JobService,
    protected modalService: ModalService) {
    this.cloudcredentialService.getProviders().pipe(untilDestroyed(this)).subscribe((providers) => {
      this.providers = providers;
    });
    this.modalService.getRow$.pipe(take(1)).pipe(untilDestroyed(this)).subscribe((id: string) => {
      this.customFilter = [[['id', '=', id]]];
    });
  }

  getBuckets(credential: CloudsyncCredential): Observable<CloudsyncBucket[]> {
    return this.ws.call('cloudsync.list_buckets', [credential.id]);
  }

  getChildren(node: TreeNode): Promise<Promise<any>> {
    const credential = this.formGroup.controls['credentials'].value;
    let bucket = this.formGroup.controls['bucket'].value;
    if (this.bucket_field.disabled) {
      bucket = this.formGroup.controls['bucket_input'].value;
    }
    return new Promise((resolve) => {
      resolve(this.getBucketFolders(credential, bucket, node));
    });
  }

  setBucketError(error: string): void {
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

  getBucketFolders(credential: number, bucket: string, node: TreeNode): Promise<any> {
    const formValue = this.entityForm.formGroup.value;
    const children: any[] = [];
    const data = {
      credentials: credential,
      encryption: formValue['encryption'] === undefined ? false : formValue['encryption'],
      filename_encryption: formValue['filename_encryption'] === undefined ? false : formValue['filename_encryption'],
      encryption_password: formValue['encryption_password'] === undefined ? '' : formValue['encryption_password'],
      encryption_salt: formValue['encryption_salt'] === undefined ? '' : formValue['encryption_salt'],
      attributes: {
        bucket,
        folder: node.data.name,
      },
      args: '',
    };
    if (bucket == '') {
      delete data.attributes.bucket;
    }
    return this.ws.call('cloudsync.list_directory', [data]).toPromise().then(
      (res) => {
        this.setBucketError(null);

        for (let i = 0; i < res.length; i++) {
          const child: any = {};
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
      },
    );
  }

  setDisabled(name: string, disable: boolean, hide = false): void {
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
    }
  }

  dataHandler(entityForm: EntityFormComponent): void {
    const data = entityForm.wsResponse;
    if (data.direction === Direction.Pull) {
      data.path_destination = data.path;
      data.attributes.folder_source = data.attributes.include.map((p: string) => data.attributes.folder + '/' + p.split('/')[1]);
    } else {
      data.attributes.folder_destination = data.attributes.folder;
      data.path_source = data.include.map((p: string) => data.path + '/' + p.split('/')[1]);
    }

    for (const i in data) {
      const fg = entityForm.formGroup.controls[i];
      if (fg) {
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

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.formGroup = entityForm.formGroup;
    this.pk = entityForm.pk;

    this.title = entityForm.isNew ? helptext.cloudsync_task_add : helptext.cloudsync_task_edit;
    this.credentials = this.fieldSets.config('credentials');
    this.bucket_field = this.fieldSets.config('bucket');
    this.bucket_input_field = this.fieldSets.config('bucket_input') as FormInputConfig;
    this.setDisabled('bucket', true, true);
    this.setDisabled('bucket_input', true, true);
    this.cloudcredentialService.getCloudsyncCredentials().then((credentials) => {
      credentials.forEach((item) => {
        this.credentials.options.push({ label: item.name + ' (' + item.provider + ')', value: item.id });
        this.credentials_list.push(item);
      });
    });

    this.formGroup.get('folder_source').valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      if (!values) {
        return;
      }
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (!values.length) {
        return;
      }
      const parentDirectories = values.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        const joined = sliced.join('/');
        return joined;
      });
      const allMatch = parentDirectories.every((v: string) => v === parentDirectories[0]);

      const folder_source_field = this.fieldSets.config('folder_source');
      const folder_source_fc = this.formGroup.get('folder_source');
      let prevErrors = folder_source_fc.errors;
      if (prevErrors === null) {
        prevErrors = {};
      }
      if (!allMatch) {
        folder_source_fc.setErrors({
          ...prevErrors,
          misMatchDirectories: true,
        });
        folder_source_field.warnings = T('All selected directories must be at the same level i.e., must have the same parent directory.');
      } else {
        delete prevErrors.misMatchDirectories;
        if (Object.keys(prevErrors).length) {
          folder_source_fc.setErrors({ ...prevErrors });
        } else {
          folder_source_fc.setErrors(null);
        }
        folder_source_field.warnings = null;
      }
    });

    this.formGroup.get('path_source').valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      if (!values) {
        return;
      }
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (!values.length) {
        return;
      }

      const parentDirectories = values.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        const joined = sliced.join('/');
        return joined;
      });
      const allMatch = parentDirectories.every((v: string) => v === parentDirectories[0]);

      const path_source_field = this.fieldSets.config('path_source');
      const path_source_fc = this.formGroup.get('path_source');
      let prevErrors = path_source_fc.errors;
      if (prevErrors === null) {
        prevErrors = {};
      }
      if (!allMatch) {
        path_source_fc.setErrors({
          ...prevErrors,
          misMatchDirectories: true,
        });
        path_source_field.warnings = T('All selected directories must be at the same level i.e., must have the same parent directory.');
      } else {
        delete prevErrors.misMatchDirectories;
        if (Object.keys(prevErrors).length) {
          path_source_fc.setErrors({ ...prevErrors });
        } else {
          path_source_fc.setErrors(null);
        }
        path_source_field.warnings = null;
      }
    });

    this.folder_field_destination = this.fieldSets.config('folder_destination');
    this.folder_field_source = this.fieldSets.config('folder_source');
    this.formGroup.controls['credentials'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: number | typeof NULL_VALUE) => {
      this.setDisabled('bucket', true, true);
      this.setDisabled('bucket_input', true, true);
      // reset folder tree view
      if (!this.folder_field_destination.disabled) {
        if (this.folder_field_destination.customTemplateStringOptions.explorer) {
          this.folder_field_destination.customTemplateStringOptions.explorer.ngOnInit();
        }
      }
      if (!this.folder_field_source.disabled) {
        if (this.folder_field_source.customTemplateStringOptions.explorer) {
          this.folder_field_source.customTemplateStringOptions.explorer.ngOnInit();
        }
      }

      if (res !== NULL_VALUE) {
        if (this.formGroup.get('direction').value === Direction.Pull) {
          this.setDisabled('folder_source', false, false);
          this.setDisabled('folder_destination', true, true);
        } else {
          this.setDisabled('folder_source', true, true);
          this.setDisabled('folder_destination', false, false);
        }
      } else {
        this.setDisabled('folder_source', true, true);
        this.setDisabled('folder_destination', true, true);
      }

      if (res != null) {
        this.credentials_list.forEach((item) => {
          if (item.id == res) {
            const targetProvider = _.find(this.providers, { name: item.provider });
            if (targetProvider && targetProvider['buckets']) {
              if (entityForm.loaderOpen === false) {
                this.loader.open();
              } else {
                entityForm.keepLoaderOpen = true;
              }

              // update bucket fields name and tooltips based on provider
              if (item.provider == 'AZUREBLOB' || item.provider == 'HUBIC') {
                this.bucket_field.placeholder = T('Container');
                this.bucket_field.tooltip = T('Select the pre-defined container to use.');
                this.bucket_input_field.placeholder = T('Container');
                this.bucket_input_field.tooltip = T('Input the pre-defined container to use.');
              } else {
                this.bucket_field.placeholder = T('Bucket');
                this.bucket_field.tooltip = T('Select the pre-defined S3 bucket to use.');
                this.bucket_input_field.placeholder = T('Bucket');
                this.bucket_input_field.tooltip = T('Input the pre-defined S3 bucket to use.');
              }

              this.getBuckets(item).pipe(untilDestroyed(this)).subscribe((res) => {
                if (entityForm.loaderOpen === false) {
                  this.loader.close();
                } else {
                  entityForm.loader.close();
                  entityForm.loaderOpen = false;
                  entityForm.keepLoaderOpen = false;
                }
                this.bucket_field.options = [{ label: '----------', value: '' }];
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
                this.dialog.confirm({
                  title: err.extra ? err.extra.excerpt : (T('Error: ') + err.error),
                  message: err.reason,
                  hideCheckBox: true,
                  buttonMsg: T('Fix Credential'),
                }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
                  this.router.navigate(new Array('/').concat(['system', 'cloudcredentials', 'edit', String(item.id)]));
                });
              });
            } else {
              this.setDisabled('bucket', true, true);
              this.setDisabled('bucket_input', true, true);
            }

            const task_schema = _.find(this.providers, { name: item.provider }) ? _.find(this.providers, { name: item.provider })['task_schema'] : [];

            for (const i of this.taskSchemas) {
              const tobeDisable = !(_.findIndex(task_schema, { property: i }) > -1);
              this.setDisabled(i === 'encryption' ? 'task_encryption' : i, tobeDisable, tobeDisable);
            }
          }
        });
      } else {
        for (const i of this.taskSchemas) {
          this.setDisabled(i === 'encryption' ? 'task_encryption' : i, true, true);
        }
      }
    });

    this.formGroup.controls['bucket_input'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setBucketError(null);
      if (this.folder_field_destination.customTemplateStringOptions.explorer) {
        this.folder_field_destination.customTemplateStringOptions.explorer.ngOnInit();
      }
      if (this.folder_field_source.customTemplateStringOptions.explorer) {
        this.folder_field_source.customTemplateStringOptions.explorer.ngOnInit();
      }
    });

    this.formGroup.controls['bucket'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setBucketError(null);
      if (this.folder_field_destination.customTemplateStringOptions.explorer) {
        this.folder_field_destination.customTemplateStringOptions.explorer.ngOnInit();
      }
      if (this.folder_field_source.customTemplateStringOptions.explorer) {
        this.folder_field_source.customTemplateStringOptions.explorer.ngOnInit();
      }
    });

    this.formGroup.controls['bwlimit'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      _.find(entityForm.fieldConfig, { name: 'bwlimit' }).hasErrors = false;
      _.find(entityForm.fieldConfig, { name: 'bwlimit' }).errors = null;
      this.formGroup.controls['bwlimit'].setErrors(null);
    });

    // When user interacts with direction dropdown, change transfer_mode to COPY
    this.formGroup
      .get('direction')
      .valueChanges
      .pipe(tap((direction: string) => {
        if (direction === Direction.Pull) {
          if (this.formGroup.get('credentials').value && this.formGroup.get('credentials').value !== NULL_VALUE) {
            this.setDisabled('folder_source', false, false);
            this.setDisabled('folder_destination', true, true);
          } // we don't have an else here because in that case both are
          // hidden by the relation rule defined in the field config
          this.setDisabled('path_destination', false, false);
          this.setDisabled('path_source', true, true);
        } else {
          this.setDisabled('path_source', false, false);
          this.setDisabled('path_destination', true, true);
          if (this.formGroup.get('credentials').value && this.formGroup.get('credentials').value !== NULL_VALUE) {
            this.setDisabled('folder_source', true, true);
            this.setDisabled('folder_destination', false, false);
          } // we don't have an else here because in that case both are
          // hidden by the relation rule defined in the field config
        }
      }))
      .pipe(filter(() => this.formGroup.get('transfer_mode').value !== TransferMode.Copy))
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.dialog.info(helptext.resetTransferModeDialog.title, helptext.resetTransferModeDialog.content, '500px', 'info', true);
        this.formGroup.get('transfer_mode').setValue(TransferMode.Copy);
      });

    // Update transfer_mode paragraphs when the mode is changed
    this.formGroup.get('transfer_mode').valueChanges.pipe(untilDestroyed(this)).subscribe((mode: TransferMode) => {
      const paragraph: FormParagraphConfig = entityForm.fieldConfig.find((config) => config.name === 'transfer_mode_warning');
      switch (mode) {
        case TransferMode.Sync:
          paragraph.paraText = helptext.transfer_mode_warning_sync;
          paragraph.paragraphIcon = 'sync';
          break;
        case TransferMode.Move:
          paragraph.paraText = helptext.transfer_mode_warning_move;
          paragraph.paragraphIcon = 'move_to_inbox';
          break;
        default:
          paragraph.paraText = helptext.transfer_mode_warning_copy;
          paragraph.paragraphIcon = 'add_to_photos';
      }
    });
  }

  resourceTransformIncomingRestData(data: CloudSyncTask): any {
    const transformed: any = { ...data };
    transformed.cloudsync_picker = data.schedule.minute + ' '
                          + data.schedule.hour + ' '
                          + data.schedule.dom + ' '
                          + data.schedule.month + ' '
                          + data.schedule.dow;

    if (data.bwlimit) {
      const bwlimit = [];
      for (let i = 0; i < data.bwlimit.length; i++) {
        let sub_bwlimit = data.bwlimit[i].time + ',off';
        if (data.bwlimit[i].bandwidth != null) {
          const bandwidth = filesize(data.bwlimit[i].bandwidth);
          sub_bwlimit = `${data.bwlimit[i].time}, ${bandwidth}`;
        }
        bwlimit.push(sub_bwlimit);
      }
      transformed.bwlimit = bwlimit;
    }

    return transformed;
  }

  handleBwlimit(bwlimit: string): any[] {
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
          _.find(this.fieldConfig, { name: 'bwlimit' }).hasErrors = true;
          _.find(this.fieldConfig, { name: 'bwlimit' }).errors = 'Invalid bandwidth ' + sublimitArr[1];
          (this.formGroup.controls['bwlimit'] as any).setErrors('Invalid bandwidth ' + sublimitArr[1]);
        } else {
          (sublimitArr[1] as any) = this.cloudcredentialService.getByte(sublimitArr[1]);
        }
      }
      const subLimit = {
        time: sublimitArr[0],
        bandwidth: sublimitArr[1] == 'off' ? null : sublimitArr[1],
      };

      bwlimtArr.push(subLimit);
    }
    return bwlimtArr;
  }

  submitDataHandler(formValue: any): any {
    const value = _.cloneDeep(formValue);
    const attributes: any = {};
    const schedule: Schedule = {};

    value.path = value.direction === Direction.Pull ? value.path_destination : value.path_source;

    if (Array.isArray(value.path)) {
      value.include = [];
      for (const dir of value.path) {
        const directory = dir.split('/');
        value.include.push('/' + directory[directory.length - 1] + '/**');
      }
      const directory = value.path[0].split('/');
      value.path = directory.slice(0, directory.length - 1).join('/');
    }

    delete value.path_source;
    delete value.path_destination;

    value['credentials'] = parseInt(value.credentials, 10);

    if (value.bucket != undefined) {
      attributes['bucket'] = value.bucket;
      delete value.bucket;
    }
    if (value.bucket_input != undefined) {
      attributes['bucket'] = value.bucket_input;
      delete value.bucket_input;
    }
    attributes['folder'] = value.direction === Direction.Pull ? value.folder_source : value.folder_destination;
    delete value.folder_source;
    delete value.folder_destination;

    if (Array.isArray(attributes['folder'])) {
      attributes.include = [];
      for (const dir of attributes.folder) {
        const directory = dir.split('/');
        attributes.include.push('/' + directory[directory.length - 1] + '/**');
      }
      const directory = attributes.folder[0].split('/');
      attributes.folder = directory.slice(0, directory.length - 1).join('/');
    }

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
      const spl = value.cloudsync_picker.split(' ');
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

    if (value['direction'] == Direction.Pull) {
      value['snapshot'] = false;
    }
    return value;
  }

  customSubmit(value: any): void {
    value = this.submitDataHandler(value);
    if (!this.pk) {
      this.loader.open();
      this.ws.call(this.addCall, [value]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.modalService.close('slide-in-form');
      }, (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      });
    } else {
      this.loader.open();
      this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
        () => {
          this.loader.close();
          this.modalService.close('slide-in-form');
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err);
        },
      );
    }
  }

  isCustActionDisabled(): boolean {
    return !this.entityForm.valid;
  }
}
