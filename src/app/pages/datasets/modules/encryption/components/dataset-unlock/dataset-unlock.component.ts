import {
  Component,
} from '@angular/core';
import {
  AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import {
  DatasetEncryptionSummary, DatasetEncryptionSummaryQueryParams, DatasetEncryptionSummaryQueryParamsDataset,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams, DatasetUnlockResult } from 'app/interfaces/dataset-lock.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormCheckboxConfig, FormListConfig, FormParagraphConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { UnlockDialogComponent } from 'app/pages/datasets/modules/encryption/components/unlock-dialog/unlock-dialog.component';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  template: '<ix-entity-form [conf]="this"></ix-entity-form>',
})
export class DatasetUnlockComponent implements FormConfiguration {
  queryCall = 'pool.dataset.encryption_summary' as const;
  updateCall = 'pool.dataset.unlock' as const;
  routeSuccess: string[] = ['datasets'];
  isEntity = true;
  isNew = true;
  pk: string;
  dialogOpen = false;
  protected path: string;
  protected entityForm: EntityFormComponent;

  protected datasets: UntypedFormArray;
  protected datasetsField: FormListConfig;
  protected keyFileField: FormCheckboxConfig;
  protected keyFileControl: UntypedFormControl;
  protected unlockChildrenControl: UntypedFormControl;

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
    {
      name: 'force',
      label: false,
      config: [
        {
          type: 'checkbox',
          name: 'force',
          placeholder: this.translate.instant('Force'),
          value: false,
          tooltip: helptext.dataset_force_tooltip,
        },
      ],
    },
  ];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected messageService: MessageService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    protected entityFormService: EntityFormService,
    private translate: TranslateService,
  ) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['datasetId'];
    });
  }

  handleError = (error: WebsocketError | Job<null, unknown[]>): void => {
    new EntityUtils().handleWsError(this.entityForm, error, this.dialogService);
  };

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.datasets = entityEdit.formGroup.controls['datasets'] as UntypedFormArray;
    this.datasetsField = _.find(this.fieldConfig, { name: 'datasets' }) as FormListConfig;
    this.keyFileField = _.find(this.fieldConfig, { name: 'key_file' }) as FormCheckboxConfig;
    const listFields = this.datasetsField.listFields;
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(
      this.translate.instant(helptext.fetching_encryption_summary_message) + this.pk,
    );
    dialogRef.componentInstance.setCall(this.queryCall, [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetEncryptionSummary[]>) => {
        if (!job) {
          return;
        }

        dialogRef.close();
        if (job.result && job.result.length > 0) {
          for (let i = 0; i < job.result.length; i++) {
            if (this.datasets.controls[i] === undefined) {
              const templateListField = _.cloneDeep(this.datasetsField.templateListField);
              const newFormGroup = this.entityFormService.createFormGroup(templateListField);
              newFormGroup.setParent(this.datasets);
              this.datasets.controls.push(newFormGroup);
              this.datasetsField.listFields.push(templateListField);
            }
            const controls = listFields[i];
            const passphraseConfig = _.find(controls, { name: 'passphrase' });
            const nameTextConfig = _.find(controls, { name: 'name_text' }) as FormParagraphConfig;
            const result = job.result[i];

            (this.datasets.controls[i] as UntypedFormGroup).controls['name'].setValue(result['name']);
            nameTextConfig.paraText = helptext.dataset_name_paratext + result['name'];
            const isPassphrase = result.key_format === DatasetEncryptionType.Passphrase;
            if (!isPassphrase) { // hide key datasets by default
              nameTextConfig.isHidden = true;
              // only show key_file checkbox and upload if keys encrypted datasets exist
              if (this.keyFileControl.value === false) {
                this.keyFileControl.setValue(true);
                this.keyFileField.isHidden = false;
                this.keyFileField.width = '50%';
              }
            }
            (this.datasets.controls[i] as UntypedFormGroup).controls['is_passphrase'].setValue(isPassphrase);
            this.setDisabled(
              passphraseConfig,
              (this.datasets.controls[i] as UntypedFormGroup).controls['passphrase'] as UntypedFormControl,
              !isPassphrase,
              !isPassphrase,
            );
          }
        }
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (error) => {
        if (error) {
          dialogRef.close();
          this.handleError(error);
        }
      },
      error: this.handleError,
    });

    this.keyFileControl = entityEdit.formGroup.controls['key_file'] as UntypedFormControl;
    this.unlockChildrenControl = entityEdit.formGroup.controls['unlock_children'] as UntypedFormControl;

    this.keyFileControl.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (hideKeyDatasets: boolean) => {
        for (let i = 0; i < this.datasets.controls.length; i++) {
          const datasetControls = (this.datasets.controls[i] as UntypedFormGroup).controls;
          const controls = listFields[i];
          const keyConfig = _.find(controls, { name: 'key' });
          const nameTextConfig = _.find(controls, { name: 'name_text' });

          const isPassphrase = datasetControls['is_passphrase'].value;
          const unlockChildren = this.unlockChildrenControl.value;
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
      },
      error: this.handleError,
    });
    this.unlockChildrenControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((unlockChildren: boolean) => {
        for (let i = 0; i < this.datasets.controls.length; i++) {
          const controls = listFields[i];
          const datasetControls = (this.datasets.controls[i] as UntypedFormGroup).controls;
          if (datasetControls['name'].value !== this.pk) {
            const keyConfig = _.find(controls, { name: 'key' });
            const passphraseConfig = _.find(controls, { name: 'passphrase' });
            const nameTextConfig = _.find(controls, { name: 'name_text' });
            const isPassphrase = datasetControls['is_passphrase'].value;
            const hideKeyDatasets = this.keyFileControl.value;
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
    const payload: DatasetEncryptionSummaryQueryParams = {
      key_file: body.key_file,
      force: body.force,
      datasets,
    };
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(
      this.translate.instant(helptext.fetching_encryption_summary_message) + this.pk,
    );
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetEncryptionSummary[]>) => {
        dialogRef.close();
        // show summary dialog;
        const errors: DatasetEncryptionSummary[] = [];
        const unlock: DatasetEncryptionSummary[] = [];
        if (job && job.result) {
          job.result.forEach((result) => {
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
          unlockDialogRef.componentInstance.unlockDatasets = unlock;
          unlockDialogRef.componentInstance.errorDatasets = errors;
          unlockDialogRef.componentInstance.data = payload as DatasetUnlockParams;
        }
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (error) => {
        dialogRef.close();
        this.handleError(error);
      },
      error: this.handleError,
    });
  }

  unlockSubmit(payload: DatasetUnlockParams): void {
    payload['recursive'] = this.unlockChildrenControl.value;
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetUnlockResult>) => {
        dialogRef.close();
        const errors = [];
        const skipped: { name: string }[] = [];
        const unlock: { name: string }[] = [];
        if (job && job.result) {
          if (job.result.failed) {
            const failed = job.result.failed;
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
          job.result.unlocked.forEach((name) => {
            unlock.push({ name });
          });
          if (!this.dialogOpen) { // prevent dialog from opening more than once
            this.dialogOpen = true;
            const unlockDialogRef = this.dialog.open(UnlockDialogComponent, { disableClose: true });
            unlockDialogRef.componentInstance.parent = this;
            unlockDialogRef.componentInstance.showFinalResults();
            unlockDialogRef.componentInstance.unlockDatasets = unlock;
            unlockDialogRef.componentInstance.errorDatasets = errors;
            unlockDialogRef.componentInstance.skippedDatasets = skipped;
            unlockDialogRef.componentInstance.data = payload;
          }
        }
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (error) => {
        dialogRef.close();
        this.handleError(error);
      },
      error: this.handleError,
    });
  }

  goBack(): void {
    this.router.navigate(this.routeSuccess);
  }

  keyFileUpdater(file: FormUploadComponent): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      this.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }
}
