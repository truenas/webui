import {
  Component,
  OnDestroy,
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';

import {WebSocketService, StorageService, DialogService} from '../../../../../services/';
import { MessageService } from '../../../../common/entity/entity-form/services/message.service';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-unlock';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../../common/entity/entity-job/entity-job.component';
import {EntityUtils} from '../../../../common/entity/utils';

@Component({
  selector : 'app-dataset-unlock',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetUnlockComponent implements OnDestroy {

  protected queryCall = 'pool.dataset.encryption_summary';
  protected updateCall = 'pool.dataset.unlock';
  public route_success: string[] = ['storage', 'pools'];
  protected isEntity = true;
  protected isNew = true;
  protected pk: string;
  protected path: string;
  protected entityForm: any;

  protected datasets: any;
  protected datasets_fc: any;

  protected key_file_fg: any;
  protected key_file_subscription: any;
  protected unlock_children_fg: any;
  protected unlock_children_subscription: any;

  public subs: any;

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_unlock_title,
      class: "dataset-unlock-title",
      label: true,
      config:[
        {
          type: 'checkbox',
          name : 'key_file',
          placeholder : helptext.unlock_key_file_placeholder,
          tooltip: helptext.unlock_key_file_tooltip,
          width: '30%',
          value: true,
        },
        {
          type: 'checkbox',
          name: 'unlock_children',
          placeholder: helptext.unlock_children_placeholder,
          tooltip: helptext.unlock_children_tooltip,
          width: '30%',
          value: true,
        },
        {
          type: 'checkbox',
          name: 'restart_services',
          placeholder: helptext.restart_services_placeholder,
          tooltip: helptext.restart_services_tooltip,
          width: '30%',
          value: true,
        },
        {
          type: 'upload',
          name: 'file',
          placeholder: helptext.upload_key_file_placeholder,
          tooltip: helptext.upload_key_file_tooltip,
          message: this.messageService,
          hideButton: true,
          relation : [
            {
              action : 'SHOW',
              when : [ {
                name : 'key_file',
                value : true,
              } ]
            },
          ],
          width: '100%',
          updater: this.key_file_updater
        }
      ]
    },
    {
      name: 'top_divider',
      divider: true
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
              disabled: true,
              isHidden: true,
              width: '0%'
            },
            {
              type: 'input',
              name: 'passphrase',
              placeholder: helptext.dataset_passphrase_placeholder,
              tooltip: helptext.dataset_passphrase_tooltip,
              inputType: 'password',
              disabled: true,
              isHidden: true,
              width: '0%'
            },
            {
              type: 'input',
              name: 'name',
              placeholder: 'name',
              isHidden: true,
              width: '100%'
            },
            {
              type: 'checkbox',
              name: 'is_passphrase',
              placeholder: 'type',
              isHidden: true,
            }
          ],
          listFields: []
        }
      ]
    },
    {
      name: 'encrypted_roots_divider',
      divider: true
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected messageService: MessageService,
              protected ws: WebSocketService,
              protected storageService: StorageService, protected dialogService: DialogService,
              protected loader: AppLoaderService, protected dialog: MatDialog) {}

  preInit(entityEdit: any) {
    this.aroute.params.subscribe(params => {
      this.pk = params['path'];
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.datasets = entityEdit.formGroup.controls['datasets'];
    this.datasets_fc = _.find(this.fieldConfig, {name: 'datasets'});
    const listFields = this.datasets_fc.listFields;
    const dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":helptext.fetching_encryption_summary_title}, disableClose: true});
    dialogRef.componentInstance.setDescription(helptext.fetching_encryption_summary_message + this.pk);
    dialogRef.componentInstance.setCall(this.queryCall, [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe(res=>{
      if (res) {
        dialogRef.close();
        if (res.result && res.result.length > 0) {
          for (let i = 0; i < res.result.length; i++) {
            if (this.datasets.controls[i] === undefined) {
              const templateListField = _.cloneDeep(this.datasets_fc.templateListField);
              const newfg = entityEdit.entityFormService.createFormGroup(templateListField);
              newfg.setParent(this.datasets);
              this.datasets.controls.push(newfg);
              this.datasets_fc.listFields.push(templateListField);
            }
            const controls = listFields[i];
            const key_fc = _.find(controls, {"name": "key"});
            const passphrase_fc = _.find(controls, {"name": "passphrase"});
            const name_text_fc = _.find(controls, {name: 'name_text'});
            const result = res.result[i];

            this.datasets.controls[i].controls['name'].setValue(result['name']);
            name_text_fc.paraText = helptext.dataset_name_paratext + result['name'];

            const is_passphrase = (result.key_format === 'PASSPHRASE');
            this.datasets.controls[i].controls['is_passphrase'].setValue(is_passphrase);
            this.setDisabled(passphrase_fc, this.datasets.controls[i].controls['passphrase'], !is_passphrase, !is_passphrase);
          }
        }
      }
    });
    dialogRef.componentInstance.failure.subscribe(err => {
      if (err) {
        dialogRef.close();
        new EntityUtils().handleWSError(entityEdit, err, this.dialogService);
      }
    });

    this.key_file_fg = entityEdit.formGroup.controls['key_file'];
    this.unlock_children_fg = entityEdit.formGroup.controls['unlock_children'];

    this.key_file_subscription = this.key_file_fg.valueChanges.subscribe(hide_key_datasets => {
      for (let i = 0; i < this.datasets.controls.length; i++) {
        const dataset_controls = this.datasets.controls[i].controls;
        const controls = listFields[i];
        const key_fc = _.find(controls, {"name": "key"});
        const name_text_fc = _.find(controls, {name: 'name_text'});
        const is_passphrase = dataset_controls['is_passphrase'];
        const unlock_children = this.unlock_children_fg.value;
        if (dataset_controls['name'].value !== this.pk && !is_passphrase && unlock_children) {
          name_text_fc.isHidden = hide_key_datasets;
          this.setDisabled(key_fc, dataset_controls['key'], hide_key_datasets, hide_key_datasets);
        }
        if (dataset_controls['name'].value === this.pk && !is_passphrase) {
          name_text_fc.isHidden = hide_key_datasets;
          this.setDisabled(key_fc, dataset_controls['key'], hide_key_datasets, hide_key_datasets);
        }
      }
    });
    this.unlock_children_subscription = this.unlock_children_fg.valueChanges.subscribe(unlock_children => {
      for (let i = 0; i < this.datasets.controls.length; i++) {
        const controls = listFields[i];
        const dataset_controls = this.datasets.controls[i].controls;
        if (dataset_controls['name'].value !== this.pk) {
          const key_fc = _.find(controls, {"name": "key"});
          const passphrase_fc = _.find(controls, {"name": "passphrase"});
          const name_text_fc = _.find(controls, {name: 'name_text'});
          const is_passphrase = dataset_controls['is_passphrase'];
          const hide_key_datasets = this.key_file_fg.value;
          if (is_passphrase || !hide_key_datasets) {
            name_text_fc.isHidden = !unlock_children;
          }
          if (is_passphrase) {
            this.setDisabled(passphrase_fc, dataset_controls['passphrase'], !unlock_children, !unlock_children);
          } else {
            if (hide_key_datasets) {
              this.setDisabled(key_fc, dataset_controls['key'], true, true);
            } else {
              this.setDisabled(key_fc, dataset_controls['key'], !unlock_children, !unlock_children);
            }
          }
        }
      }
    })
  }

  setDisabled(fieldConfig, formControl, disable, hide) {
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
      return;
    }
  }

  ngOnDestroy() {
    this.key_file_subscription.unsubscribe();
    this.unlock_children_subscription.unsubscribe();
  }

  customSubmit(body) {
    const datasets = [];
    for (let i = 0; i < body.datasets.length; i++) {
      const dataset = body.datasets[i];
      const ds = {name:dataset.name}
      if (dataset.is_passphrase) {
        ds['passphrase'] = dataset.passphrase;       
      }
      if (!dataset.is_passphrase && !body.key_file) {
        ds['key'] = dataset.key;
      }
      datasets.push(ds);
    }
    const payload = {key_file: body.key_file, datasets: datasets};
    const dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":helptext.fetching_encryption_summary_title}, disableClose: true});
    dialogRef.componentInstance.setDescription(helptext.fetching_encryption_summary_message + this.pk);
    if (body.key_file && this.subs) {
      const formData: FormData = new FormData();
      formData.append('data', JSON.stringify({
        "method": this.queryCall,
        "params": [this.pk, payload]
      }));
      formData.append('file', this.subs.file);
      dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData)
    } else {
      payload['key_file'] = false; // if subs is undefined the user never tried to upload a file
      dialogRef.componentInstance.setCall(this.queryCall, [this.pk, payload]);
      dialogRef.componentInstance.submit();
    }
    dialogRef.componentInstance.success.subscribe(res => {
      dialogRef.close();
      // show summary dialog;
    });
    dialogRef.componentInstance.failure.subscribe(err => {
      dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, err, this.dialogService);
    })
  }

  key_file_updater(file: any, parent: any){
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = {"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[0]}
    }
  }

}
