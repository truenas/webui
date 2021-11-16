import {
  Component,
} from '@angular/core';
import {
  AbstractControl, FormArray, FormControl, FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import {
  DatasetEncryptionSummary, DatasetEncryptionSummaryQueryParams, DatasetEncryptionSummaryQueryParamsDataset,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormCheckboxConfig, FormListConfig, FormParagraphConfig,
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
export class DatasetUnlockComponent implements FormConfiguration {
  queryCall = 'pool.dataset.encryption_summary' as const;
  updateCall = 'pool.dataset.unlock' as const;
  route_success: string[] = ['storage'];
  isEntity = true;
  isNew = true;
  pk: string;
  dialogOpen = false;
  protected path: string;
  protected entityForm: EntityFormComponent;

  protected datasets: FormArray;
  protected datasets_fc: FormListConfig;
  protected key_file_fc: FormCheckboxConfig;
  protected key_file_fg: FormControl;
  protected unlock_children_fg: FormControl;

  subs: Subs;

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
          updater: (file: FormUploadComponent) => this.keyFileUpdater(file),
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
              required: true,
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
    protected entityFormService: EntityFormService,
  ) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['path'];
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.datasets = entityEdit.formGroup.controls['datasets'] as FormArray;
    this.datasets_fc = _.find(this.fieldConfig, { name: 'datasets' }) as FormListConfig;
    this.key_file_fc = _.find(this.fieldConfig, { name: 'key_file' }) as FormCheckboxConfig;
    const listFields = this.datasets_fc.listFields;
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(helptext.fetching_encryption_summary_message + this.pk);
    dialogRef.componentInstance.setCall(this.queryCall, [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<DatasetEncryptionSummary[]>) => {
      if (!res) {
        return;
      }

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
          const passphraseConfig = _.find(controls, { name: 'passphrase' });
          const nameTextConfig: FormParagraphConfig = _.find(controls, { name: 'name_text' });
          const result = res.result[i];

          (this.datasets.controls[i] as FormGroup).controls['name'].setValue(result['name']);
          nameTextConfig.paraText = helptext.dataset_name_paratext + result['name'];
          const isPassphrase = result.key_format === DatasetEncryptionType.Passphrase;
          if (!isPassphrase) { // hide key datasets by default
            nameTextConfig.isHidden = true;
            // only show key_file checkbox and upload if keys encrypted datasets exist
            if (this.key_file_fg.value === false) {
              this.key_file_fg.setValue(true);
              this.key_file_fc.isHidden = false;
              this.key_file_fc.width = '50%';
            }
          }
          (this.datasets.controls[i] as FormGroup).controls['is_passphrase'].setValue(isPassphrase);
          this.setDisabled(
            passphraseConfig,
            (this.datasets.controls[i] as FormGroup).controls['passphrase'] as FormControl,
            !isPassphrase,
            !isPassphrase,
          );
        }
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      if (err) {
        dialogRef.close();
        new EntityUtils().handleWSError(entityEdit, err, this.dialogService);
      }
    });

    this.key_file_fg = entityEdit.formGroup.controls['key_file'] as FormControl;
    this.unlock_children_fg = entityEdit.formGroup.controls['unlock_children'] as FormControl;

    this.key_file_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((hideKeyDatasets: boolean) => {
      for (let i = 0; i < this.datasets.controls.length; i++) {
        const datasetControls = (this.datasets.controls[i] as FormGroup).controls;
        const controls = listFields[i];
        const keyConfig = _.find(controls, { name: 'key' });
        const nameTextConfig = _.find(controls, { name: 'name_text' });

        const isPassphrase = datasetControls['is_passphrase'].value;
        const unlockChildren = this.unlock_children_fg.value;
        if (datasetControls['name'].value === this.pk) {
          if (!isPassphrase) {
            nameTextConfig.isHidden = hideKeyDatasets;
            this.setDisabled(keyConfig, datasetControls['key'], hideKeyDatasets, hideKeyDatasets);
          }
        } else if (unlockChildren && !isPassphrase) {
          nameTextConfig.isHidden = hideKeyDatasets;
          this.setDisabled(keyConfig, datasetControls['key'], hideKeyDatasets, hideKeyDatasets);
        }
      }
    });
    this.unlock_children_fg.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((unlockChildren: boolean) => {
        for (let i = 0; i < this.datasets.controls.length; i++) {
          const controls = listFields[i];
          const datasetControls = (this.datasets.controls[i] as FormGroup).controls;
          if (datasetControls['name'].value !== this.pk) {
            const keyConfig = _.find(controls, { name: 'key' });
            const passphraseConfig = _.find(controls, { name: 'passphrase' });
            const nameTextConfig = _.find(controls, { name: 'name_text' });
            const isPassphrase = datasetControls['is_passphrase'].value;
            const hideKeyDatasets = this.key_file_fg.value;
            if (isPassphrase) {
              nameTextConfig.isHidden = !unlockChildren;
              this.setDisabled(passphraseConfig, datasetControls['passphrase'], !unlockChildren, !unlockChildren);
            } else if (hideKeyDatasets) {
              nameTextConfig.isHidden = true;
              this.setDisabled(keyConfig, datasetControls['key'], true, true);
            } else {
              nameTextConfig.isHidden = !unlockChildren;
              this.setDisabled(keyConfig, datasetControls['key'], !unlockChildren, !unlockChildren);
            }
          }
        }
      });
  }

  setDisabled(fieldConfig: FieldConfig, formControl: AbstractControl, disable: boolean, hide: boolean): void {
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

  customSubmit(body: any): void {
    const datasets = [];
    let num = 1; // only unlock the first dataset (the root) if unlock_children is disabled
    if (body['unlock_children']) {
      num = body.datasets.length;
    }
    for (let i = 0; i < num; i++) {
      const dataset = body.datasets[i];
      const ds = { name: dataset.name } as DatasetEncryptionSummaryQueryParamsDataset;
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
    const payload: DatasetEncryptionSummaryQueryParams = { key_file: body.key_file, datasets };
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<DatasetEncryptionSummary[]>) => {
      dialogRef.close();
      // show summary dialog;
      const errors: DatasetEncryptionSummary[] = [];
      const unlock: DatasetEncryptionSummary[] = [];
      if (res && res.result) {
        res.result.forEach((result) => {
          if (result.unlock_successful) {
            unlock.push(result);
          } else {
            errors.push(result);
          }
        });
      }
      if (!this.dialogOpen) { // prevent dialog from opening more than once
        this.dialogOpen = true;
        const unlockDialogRef = this.dialog.open(UnlockDialogComponent, { disableClose: true });
        unlockDialogRef.componentInstance.parent = this;
        unlockDialogRef.componentInstance.unlock_datasets = unlock;
        unlockDialogRef.componentInstance.error_datasets = errors;
        unlockDialogRef.componentInstance.data = payload as DatasetUnlockParams;
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, err, this.dialogService);
    });
  }

  unlockSubmit(payload: DatasetUnlockParams): void {
    payload['recursive'] = this.unlock_children_fg.value;
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.unlocking_datasets_title },
      disableClose: true,
    });
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<DatasetUnlockResult>) => {
      dialogRef.close();
      const errors = [];
      const skipped: { name: string }[] = [];
      const unlock: { name: string }[] = [];
      if (res && res.result) {
        if (res.result.failed) {
          const failed = res.result.failed;
          for (const errorDataset in failed) {
            if (failed.hasOwnProperty(errorDataset)) {
              const fail = failed[errorDataset];
              const error = fail.error;
              const skip = fail.skipped;
              errors.push({ name: errorDataset, unlock_error: error });
              for (const name of skip) {
                skipped.push({ name });
              }
            }
          }
        }
        res.result.unlocked.forEach((name) => {
          unlock.push({ name });
        });
        if (!this.dialogOpen) { // prevent dialog from opening more than once
          this.dialogOpen = true;
          const unlockDialogRef = this.dialog.open(UnlockDialogComponent, { disableClose: true });
          unlockDialogRef.componentInstance.parent = this;
          unlockDialogRef.componentInstance.showFinalResults();
          unlockDialogRef.componentInstance.unlock_datasets = unlock;
          unlockDialogRef.componentInstance.error_datasets = errors;
          unlockDialogRef.componentInstance.skipped_datasets = skipped;
          unlockDialogRef.componentInstance.data = payload;
        }
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, err, this.dialogService);
    });
  }

  goBack(): void {
    this.router.navigate(this.route_success);
  }

  keyFileUpdater(file: FormUploadComponent): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      this.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }
}
