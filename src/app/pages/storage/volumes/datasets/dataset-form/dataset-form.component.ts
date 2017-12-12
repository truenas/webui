import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';

@Component({
  selector : 'app-dataset-form',
  templateUrl : './dataset-form.component.html',
  providers: [ EntityFormService ],
})
export class DatasetFormComponent implements OnInit{

  protected pk: any;
  protected volid: string;
  public sub: Subscription;
  public route_success: string[] = [ 'storage', 'volumes' ];
  protected isBasicMode: boolean = true;

  public submitFunction = this.editSubmit;
  private isNew: boolean = false;
  public formGroup: FormGroup;
  protected data: any;

  public error: string;
  public success: boolean = false;
  public busy: Subscription;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: 'Comments',
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: 'Compression level',
      options: [],
    },
    {
      type: 'select',
      name: 'atime',
      placeholder: 'Enable atime',
      options: [],
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota',
      placeholder: 'Quota for this dataset',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota',
      placeholder: 'Quota for this dataset and all children',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refreservation',
      placeholder: 'Reserved space for this dataset',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'reservation',
      placeholder: 'Reserved space for this dataset and all children',
      value: 0,
    },

    {
      type: 'select',
      name: 'dedup',
      placeholder: 'Deduplication',
      options: [],
    },
    {
      type: 'select',
      name: 'readonly',
      placeholder: 'Read-only',
      options: [],
    },
    {
      type: 'select',
      name: 'snapdir',
      placeholder: 'Snapshot directory',
      options: [
        { label: 'Visible', value: "visible" },
        { label: 'Invisible', value: "hidden" },
      ],
    },
    {
      type: 'select',
      name: 'copies',
      placeholder: 'Copies',
      options: [
        { label: '1', value: "1" },
        { label: '2', value: "2" },
        { label: '3', value: "3" }
      ],
      tooltip: 'How many copies of data does ZFS allow?',
    },
    {
      type: 'select',
      name: 'recordsize',
      placeholder: 'Record Size',
      options: [],
    },
    {
      type: 'select',
      name: 'case_sensitivity',
      placeholder: 'Case Sensitivity',
      options: [],
    },
  ];

  protected advanced_field: Array<any> = [
    'refquota',
    'quota',
    'refreservation',
    'reservation',
    'readonly',
    'snapdir',
    'copies',
    'recordsize',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  protected RecordSizeMap: any = {
    '512': '512',
    '1024': '1K',
    '2048': '2K',
    '4096': '4K',
    '8192': '8K',
    '16384': '16K',
    '32768': '32K',
    '65536': '64K',
    '131072': '128K',
    '262144': '256K',
    '524288': '512K',
    '1048576': '1024K',
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService, 
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  preInit() {
    this.sub = this.aroute.params.subscribe(params => {
      this.volid = params['volid'];
      // edit dataset
      if(params['pk']) {
        this.pk = params['pk'];
        this.fieldConfig.pop();
      }
      // add new dataset
      if (params['parent']) {
        this.submitFunction = this.addSubmit;
        this.isNew = true;
      }
    });
  }

  setFieldValue(endpoint: string, field: string) {
    this.ws.call('notifier.choices', [ endpoint ]).subscribe((res) => {
      let target_field = _.find(this.fieldConfig, {name: field});
      if (target_field) {
        if (field == 'recordsize') {
          target_field.options.push({label: 'Inherit', value: 'inherit'});
        }

        for (let item of res) {
          let label = item[1];
          let value = item[0];
          target_field.options.push({label: label, value: value});
        }

        // set default value
        if (this.isNew) {
          let default_value = 'inherit';
          let fg = this.formGroup.controls[field];
          if (field == 'case_sensitivity') {
            default_value = 'sensitive';
          }

          if (fg) {
            fg.setValue(default_value);
          }
        }
      }
    });
  }

  afterInit() {
    this.setFieldValue('ZFS_CompressionChoices', 'compression');
    this.setFieldValue('ZFS_AtimeChoices', 'atime');
    this.setFieldValue('ZFS_DEDUP_INHERIT', 'dedup');
    this.setFieldValue('CASE_SENSITIVITY_CHOICES', 'case_sensitivity');
    this.setFieldValue('ZFS_ReadonlyChoices', 'readonly');
    this.setFieldValue('ZFS_RECORDSIZE', 'recordsize');

    if (!this.isNew) {
      this.setDisabled('name', true);
    }
  }

  ngOnInit() {
    this.preInit();
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    if(!this.isNew) {
      this.ws.call('pool.dataset.query', [ [["id", "=", this.pk]] ]).subscribe((res) => {
        this.data = res[0].properties;

        for (let i in this.data) {
          let fg = this.formGroup.controls[i];

          if (fg) {
            let value = this.data[i].rawvalue;

            if (i == 'recordsize') {
              value = this.RecordSizeMap[value];
            }

            if (_.indexOf(this.data['inherit_props'], i) > -1) {
              value = 'inherit';
            }

            if (i == 'comments' && _.indexOf(this.data['inherit_props'], 'org.freenas:description') > -1) {
              value = '';
            }

            fg.setValue(value);
          }
        }

        this.afterInit();
      });
    }
  }

  editSubmit(body: any) {
    return this.ws.call('pool.dataset.update', [this.pk, body]);
  }

  addSubmit(body: any) {
    return this.ws.call('pool.dataset.create', [body]);
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f].errors = '';
      this.fieldConfig[f].hasErrors = false;
    }
  }

  isShow(id: any): any {
    if (this.isBasicMode) {
      if (this.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
      }
      return item;
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);

    this.loader.open();
    this.busy = this.submitFunction({body : JSON.stringify(value)})
                    .subscribe(
                        (res) => {
                          this.loader.close();
                          if (this.route_success) {
                            this.router.navigate(new Array('').concat(
                                this.route_success));
                          } else {
                            this.success = true;
                          }
                        },
                        (res) => {
                          this.loader.close();
                          new EntityUtils().handleError(this, res); });
  }
}
