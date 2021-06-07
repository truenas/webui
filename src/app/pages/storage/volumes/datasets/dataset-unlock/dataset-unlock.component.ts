import {
  Component,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { UnlockDialogComponent } from './unlock-dialog/unlock-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-dataset-unlock',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DatasetUnlockComponent implements FormConfiguration, OnDestroy {
  queryCall: 'pool.dataset.encryption_summary' = 'pool.dataset.encryption_summary';
  updateCall = 'pool.dataset.unlock';
  route_success: string[] = ['storage'];
  isEntity = true;
  isNew = true;
  pk: string;
  protected path: string;
  protected entityForm: EntityFormComponent;
  protected dialogOpen = false;

  protected datasets: any;
  protected datasets_fc: any;

  protected key_file_fc: any;
  protected key_file_fg: any;
  protected key_file_subscription: any;
  protected unlock_children_fg: any;
  protected unlock_children_subscription: any;

  subs: any;

  fieldSetDisplay = 'default';// default | carousel | stepper
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_unlock_title,
      class: 'dataset-unlock-title',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'key_file',
          placeholder: helptext.unlock_key_file_placeholder,
          tooltip: helptext.unlock_key_file_tooltip,
          width: '0%',
          isHidden: true,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'unlock_children',
          placeholder: helptext.unlock_children_placeholder,
          tooltip: helptext.unlock_children_tooltip,
          width: '50%',
          value: true,
        },
        {
          type: 'upload',
          name: 'file',
          placeholder: helptext.upload_key_file_placeholder,
          tooltip: helptext.upload_key_file_tooltip,
          message: this.messageService,
          hideButton: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'key_file',
                value: true,
              }],
            },
          ],
          width: '100%',
          updater: this.key_file_updater,
          parent: this,
        },
      ],
    },
    {
      name: 'top_divider',
      divider: true,
    },
    {
      name: 'encrypted_roots',
      label: false,
      class: 'encrypted_roots',
      config: [
        {
          type: 'list',
          name: 'datasets',
          placeholder: '',
          hideButton: true,
          templateListField: [
            {
              type: 'paragraph',
              name: 'name_text',
              paraText: '',
              width: '30%',
            },
            {
              type: 'textarea',
              name: 'key',
              placeholder: helptext.dataset_key_placeholder,
              tooltip: helptext.dataset_key_tooltip,
              validation: helptext.dataset_key_validation,
              disabled: true,
              isHidden: true,
              width: '0%',
              filereader: true,
            },
            {
              type: 'input',
              name: 'passphrase',
              placeholder: helptext.dataset_passphrase_placeholder,
              tooltip: helptext.dataset_passphrase_tooltip,
              validation: helptext.dataset_passphrase_validation,
              inputType: 'password',
              togglePw: true,
              disabled: true,
              isHidden: true,
              width: '0%',
            },
            {
              type: 'input',
              name: 'name',
              placeholder: 'name',
              isHidden: true,
              width: '100%',
            },
            {
              type: 'checkbox',
              name: 'is_passphrase',
              placeholder: 'type',
              isHidden: true,
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      name: 'encrypted_roots_divider',
      divider: true,
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected aroute: ActivatedRoute,
    protected messageService: MessageService,
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    private entityFormService: EntityFormService,
  ) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['path'];
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.datasets = entityEdit.formGroup.controls['datasets'];
    this.datasets_fc = _.find(this.fieldConfig, { name: 'datasets' });
    this.key_file_fc = _.find(this.fieldConfig, { name: 'key_file' });
    const listFields = this.datasets_fc.listFields;
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.fetching_encryption_summary_title }, disableClose: true });
    dialogRef.componentInstance.setDescription(helptext.fetching_encryption_summary_message + this.pk);
    dialogRef.componentInstance.setCall(this.queryCall, [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        dialogRef.close();
        if (res.result && res.result.length > 0) {
          for (let i = 0; i < res.result.length; i++) {
            if (this.datasets.controls[i] === undefined) {
              const templateListField = _.cloneDeep(this.datasets_fc.templateListField);
              const newfg = this.entityFormService.createFormGroup(templateListField);
              newfg.setParent(this.datasets);
              this.datasets.controls.push(newfg);
              this.datasets_fc.listFields.push(templateListField);
            }
            const controls = listFields[i];
            const passphrase_fc = _.find(controls, { name: 'passphrase' });
            const name_text_fc = _.find(controls, { name: 'name_text' });
            const result = res.result[i];

            this.datasets.controls[i].controls['name'].setValue(result['name']);
            name_text_fc.paraText = helptext.dataset_name_paratext + result['name'];
            const is_passphrase = (result.key_format === 'PASSPHRASE');
            if (!is_passphrase) { // hide key datasets by default
              name_text_fc.isHidden = true;
              if (this.key_file_fg.value === false) { // only show key_file checkbox and upload if keys encrypted datasets exist
                this.key_file_fg.setValue(true);
                this.key_file_fc.isHidden = false;
                this.key_file_fc.width = '50%';
              }
            }
            this.datasets.controls[i].controls['is_passphrase'].setValue(is_passphrase);
            this.setDisabled(passphrase_fc, this.datasets.controls[i].controls['passphrase'], !is_passphrase, !is_passphrase);
          }
        }
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
      if (err) {
        dialogRef.close();
        new EntityUtils().handleWSError(entityEdit, err, this.dialogService);
      }
    });

    this.key_file_fg = entityEdit.formGroup.controls['key_file'];
    this.unlock_children_fg = entityEdit.formGroup.controls['unlock_children'];

    this.key_file_subscription = this.key_file_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((hide_key_datasets: any) => {
      for (let i = 0; i < this.datasets.controls.length; i++) {
        const dataset_controls = this.datasets.controls[i].controls;
        const controls = listFields[i];
        const key_fc = _.find(controls, { name: 'key' });
        const name_text_fc = _.find(controls, { name: 'name_text' });

        const is_passphrase = dataset_controls['is_passphrase'].value;
        const unlock_children = this.unlock_children_fg.value;
        if (dataset_controls['name'].value === this.pk) {
          if (!is_passphrase) {
            name_text_fc.isHidden = hide_key_datasets;
            this.setDisabled(key_fc, dataset_controls['key'], hide_key_datasets, hide_key_datasets);
          }
        } else if (unlock_children && !is_passphrase) {
          name_text_fc.isHidden = hide_key_datasets;
          this.setDisabled(key_fc, dataset_controls['key'], hide_key_datasets, hide_key_datasets);
        }
      }
    });
    this.unlock_children_subscription = this.unlock_children_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((unlock_children: any) => {
      for (let i = 0; i < this.datasets.controls.length; i++) {
        const controls = listFields[i];
        const dataset_controls = this.datasets.controls[i].controls;
        if (dataset_controls['name'].value !== this.pk) {
          const key_fc = _.find(controls, { name: 'key' });
          const passphrase_fc = _.find(controls, { name: 'passphrase' });
          const name_text_fc = _.find(controls, { name: 'name_text' });
          const is_passphrase = dataset_controls['is_passphrase'].value;
          const hide_key_datasets = this.key_file_fg.value;
          if (is_passphrase) {
            name_text_fc.isHidden = !unlock_children;
            this.setDisabled(passphrase_fc, dataset_controls['passphrase'], !unlock_children, !unlock_children);
          } else if (hide_key_datasets) {
            name_text_fc.isHidden = true;
            this.setDisabled(key_fc, dataset_controls['key'], true, true);
          } else {
            name_text_fc.isHidden = !unlock_children;
            this.setDisabled(key_fc, dataset_controls['key'], !unlock_children, !unlock_children);
          }
        }
      }
    });
  }

  setDisabled(fieldConfig: FieldConfig, formControl: FormControl, disable: boolean, hide: boolean): void {
    fieldConfig.disabled = disable;
    fieldConfig['isHidden'] = hide;
    if (!hide) {
      fieldConfig['width'] = '50%';
    } else {
      fieldConfig['width'] = '0%';
    }
    if (formControl && formControl.disabled !== disable) {
      const method = disable ? 'disable' : 'enable';
      formControl[method]();
    }
  }

  ngOnDestroy(): void {
    this.key_file_subscription.unsubscribe();
    this.unlock_children_subscription.unsubscribe();
  }

  customSubmit(body: any): void {
    const datasets = [];
    let num = 1; // only unlock the first dataset (the root) if unlock_children is disabled
    if (body['unlock_children']) {
      num = body.datasets.length;
    }
    for (let i = 0; i < num; i++) {
      const dataset = body.datasets[i];
      const ds: any = { name: dataset.name };
      if (dataset.is_passphrase) {
        // don't pass empty passphrases, they won't work
        if (dataset.passphrase && dataset.passphrase !== '') {
          ds['passphrase'] = dataset.passphrase;
          datasets.push(ds);
        }
      }
      if (!dataset.is_passphrase && !body.key_file) {
        ds['key'] = dataset.key;
        datasets.push(ds);
      }
    }
    const payload = { key_file: body.key_file, datasets };
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.fetching_encryption_summary_title }, disableClose: true });
    dialogRef.componentInstance.setDescription(helptext.fetching_encryption_summary_message + this.pk);
    if (body.key_file && this.subs) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: this.queryCall,
        params: [this.pk, payload],
      }));
      formData.append('file', this.subs.file);
      dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
    } else {
      payload['key_file'] = false; // if subs is undefined the user never tried to upload a file
      dialogRef.componentInstance.setCall(this.queryCall, [this.pk, payload]);
      dialogRef.componentInstance.submit();
    }
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
      dialogRef.close();
      // show summary dialog;
      const errors = [];
      const unlock = [];
      if (res && res.result) {
        for (let i = 0; i < res.result.length; i++) {
          const result = res.result[i];
          if (result.unlock_successful) {
            unlock.push(result);
          } else {
            errors.push(result);
          }
        }
      }
      if (!this.dialogOpen) { // prevent dialog from opening more than once
        this.dialogOpen = true;
        const unlockDialogRef: MatDialogRef<UnlockDialogComponent> = this.dialog.open(UnlockDialogComponent, { disableClose: true });
        unlockDialogRef.componentInstance.parent = this;
        unlockDialogRef.componentInstance.unlock_datasets = unlock;
        unlockDialogRef.componentInstance.error_datasets = errors;
        unlockDialogRef.componentInstance.data = payload;
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
      dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, err, this.dialogService);
    });
  }

  unlockSubmit(payload: any): void {
    payload['recursive'] = this.unlock_children_fg.value;
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.unlocking_datasets_title }, disableClose: true });
    if (payload.key_file && this.subs) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        method: this.updateCall,
        params: [this.pk, payload],
      }));
      formData.append('file', this.subs.file);
      dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
    } else {
      dialogRef.componentInstance.setCall(this.updateCall, [this.pk, payload]);
      dialogRef.componentInstance.submit();
    }
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
      dialogRef.close();
      const errors = [];
      const skipped = [];
      const unlock = [];
      if (res && res.result) {
        if (res.result.failed) {
          const failed = res.result.failed;
          for (const err_ds in failed) {
            if (failed.hasOwnProperty(err_ds)) {
              const fail = failed[err_ds];
              const error = fail.error;
              const skip = fail.skipped;
              errors.push({ name: err_ds, unlock_error: error });
              for (let i = 0; i < skip.length; i++) {
                skipped.push({ name: skip[i] });
              }
            }
          }
        }
        for (let i = 0; i < res.result.unlocked.length; i++) {
          unlock.push({ name: res.result.unlocked[i] });
        }
        if (!this.dialogOpen) { // prevent dialog from opening more than once
          this.dialogOpen = true;
          const unlockDialogRef: MatDialogRef<UnlockDialogComponent> = this.dialog.open(UnlockDialogComponent, { disableClose: true });
          unlockDialogRef.componentInstance.parent = this;
          unlockDialogRef.componentInstance.show_final_results();
          unlockDialogRef.componentInstance.unlock_datasets = unlock;
          unlockDialogRef.componentInstance.error_datasets = errors;
          unlockDialogRef.componentInstance.skipped_datasets = skipped;
          unlockDialogRef.componentInstance.data = payload;
        }
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
      dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, err, this.dialogService);
    });
  }

  go_back(): void {
    this.router.navigate(this.route_success);
  }

  key_file_updater(file: any, parent: any): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }
}
