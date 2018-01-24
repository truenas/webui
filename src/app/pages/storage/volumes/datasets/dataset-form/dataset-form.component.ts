import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup, Validators } from '@angular/forms';
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

  protected volid: string;
  public sub: Subscription;
  public route_success: string[] = [ 'storage', 'volumes' ];
  protected isBasicMode: boolean = true;

  protected resourceName: string;
  protected parent: string;
  public submitFunction = this.editSubmit;
  private isNew: boolean = false;
  public formGroup: FormGroup;
  protected data: any;
  protected parent_data: any;

  public error: string;
  public success: boolean = false;
  public busy: Subscription;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
      tooltip: 'Mandatory; enter a unique name for the dataset.',
      validation : [ Validators.required ]
    }, 
    {
      type: 'input',
      name: 'comments',
      placeholder: 'Comments',
      tooltip: 'Enter comments or notes about this dataset here.',
    },
    {  
      type: 'select',
      name: 'compression',
      placeholder: 'Compression level',
      tooltip: 'For more information about the available compression algorithms,\
 refer to the <a href="http://doc.freenas.org/11/storage.html#compression" target="_blank">FreeNAS User Guide</a>.',
      options: [
        { label: 'OFF', value: 'OFF' },
        { label: 'LZ4', value: 'LZ4' },
        { label: 'GZIP-1', value: 'GZIP-1' },
        { label: 'GZIP-6', value: 'GZIP-6' },
        { label: 'GZIP-9', value: 'GZIP-9' },
        { label: 'ZLE', value: 'ZLE' },
        { label: 'LZJB', value: 'LZJB' }
      ],
    },
    {
      type: 'select',
      name: 'atime',
      placeholder: 'Enable atime',
      tooltip: 'Controls whether the access time for files is updated\
 when they are read; setting this property to <b>Off</b> avoids producing log\
 traffic when reading files, and can result in significant performance gains.',
      options: [
        { label: 'ON', value: 'ON' },
        { label: 'OFF', value: 'OFF' }
      ],
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota',
      placeholder: 'Quota for this dataset',
      tooltip: 'Only available in <b>Advanced Mode</b>; default of <i>0</i> disables\
 quotas; specifying a value means to use no more than the specified\
 size and is suitable for user datasets to prevent users from hogging available space.',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota',
      placeholder: 'Quota for this dataset and all children',
      tooltip: 'Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets.',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refreservation',
      placeholder: 'Reserved space for this dataset',
      tooltip: 'Only available in <b>Advanced Mode</b>; default of <i>0</i> is\
 unlimited; specifying a value is suitable for datasets containing logs\
 which could take up all available free space',
      value: 0,
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'reservation',
      placeholder: 'Reserved space for this dataset and all children',
      tooltip: 'Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets.',
      value: 0,
    },
    {
      type: 'select',
      name: 'deduplication',
      placeholder: 'Deduplication',
      tooltip: 'Read the section on <a href="http://doc.freenas.org/11/storage.html#deduplication" target="none">Deduplication</a>\
 before making a change to this setting.',
      options: [
        { label: 'ON', value: 'ON' },
        { label: 'VERIFY', value: 'VERIFY' },
        { label: 'OFF', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'readonly',
      placeholder: 'Read-only',
      tooltip: 'Only available in <b>Advanced Mode</b>;\
 choices are <b>Inherit (off)</b>, <b>On</b>, or <b>Off</b>.',
      options: [
        { label: 'ON', value: 'ON' },
        { label: 'OFF', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'snapdir',
      placeholder: 'Snapshot directory',
      tooltip: 'Only available in <b>Advanced Mode</b>;\
makes the .zfs snapshot directory <b>Visible</b> or <b>Invisible</b> on this dataset.',
      options: [
        { label: 'Visible', value: 'VISIBLE' },
        { label: 'Invisible', value: 'HIDDEN' },
      ],
    },
    {
      type: 'select',
      name: 'copies',
      placeholder: 'Copies',
      tooltip: 'Only available in <b>Advanced Mode</b>;\
 sets the number of data copies on this dataset.',
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' }
      ],
    },
    {
      type: 'select',
      name: 'recordsize',
      placeholder: 'Record Size',
      tooltip: 'Only available in <b>Advanced Mode</b>; while ZFS automatically\
 adapts the record size dynamically to adapt to data, if the data has a fixed size\
 for example, a database, matching that size may result in better performance.',
      options: [
        { label: '512', value: '512' },
        { label: '1K', value: '1K' },
        { label: '2K', value: '2K' },
        { label: '4K', value: '4K' },
        { label: '8K', value: '8K' },
        { label: '16K', value: '16K' },
        { label: '32K', value: '32K' },
        { label: '64K', value: '64K' },
        { label: '128K', value: '128K' },
        { label: '256K', value: '256K' },
        { label: '512K', value: '512K' },
        { label: '1024K', value: '1024K' }
      ],
    },
    {
      type: 'select',
      name: 'casesensitivity',
      placeholder: 'Case Sensitivity',
      tooltip: 'Choices are: <b>sensitive</b> (default, assumes filenames are\
 case sensitive), <b>insensitive</b> (assumes filenames are not case sensitive), or\
 <b>mixed</b> (understands both types of filenames).',
      options: [
        { label: 'SENSITIVE', value: 'SENSITIVE' },
        { label: 'INSENSITIVE', value: 'INSENSITIVE' },
        { label: 'MIXED', value: 'MIXED' }
      ],
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
        this.resourceName = params['pk'];
        let pk_parent = params['pk'].split('/');
        this.parent = pk_parent.splice(0, pk_parent.length - 1).join('/');
        this.fieldConfig.pop();
      }
      // add new dataset
      if (params['parent']) {
        this.parent = params['parent'];
        this.resourceName = this.parent;
        this.submitFunction = this.addSubmit;
        this.isNew = true;
      }
    });
  }

  ngOnInit() {
    this.preInit();
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    this.ws.call('pool.dataset.query', [ [['id', '=', this.resourceName]] ]).subscribe((res) => {
      this.data = res[0];
      this.parent_data = res[0];

      for (let i in this.data) {
        let fg = this.formGroup.controls[i];

        if (fg && !this.isNew) {
          let value = "";

          if(i === "name") {
            value = this.data[i];
          }
          else {
            value = this.data[i].value;
          }

          if(
            i == "compression" || 
            i == "atime" || 
            i == "dedup" || 
            i == "readonly" || 
            i == "snapdir" || 
            i == "casesensitivity") {
            value = value.toUpperCase();
          }

          fg.setValue(value);
        }
      }

      if (!this.isNew) {
        this.setDisabled('name', true);

        if(this.parent) {
          this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).subscribe((res) => {
            this.parent_data = res[0];
          });
        }
      }
    });
  }

  editSubmit(body: any) {
    return this.ws.call('pool.dataset.update', [this.resourceName, body]);
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

    if(this.isNew) {
      value['name'] = this.resourceName + '/' + value['name'];
    }    
    if(value['quota'] == 0) {
      value['quota'] = null;
    }
    if(value['refquota'] == 0) {
      value['refquota'] = null;
    }
    if(value['reservation'] == 0) {
      value['reservation'] = null;
    }
    if(value['refreservation'] == 0) {
      value['refreservation'] = null;
    }
    if(value['copies'] > 0) {
      value['copies'] = value['copies'].toString();
    }
    
    this.loader.open();
    this.busy = this.submitFunction(value)
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
                          this.error = res.reason;
                        });
  }
}
