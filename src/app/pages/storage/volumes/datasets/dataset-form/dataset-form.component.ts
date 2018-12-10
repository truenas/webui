import { Component} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { Formconfiguration } from '../../../../common/entity/entity-form/entity-form.component';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { DialogService } from 'app/services/dialog.service';
import { T } from '../../../../../translate-marker';


interface DatasetFormData {
  name: string;
  comments: string;
  sync: string;
  compression: string;
  atime: string;
  share_type: string;
  refquota: number;
  refquota_unit?: string;
  quota: number;
  quota_unit?: string;
  refreservation: number;
  refreservation_unit?: string;
  reservation: number;
  reservation_unit?: string;
  deduplication: string;
  exec: string;
  readonly: string;
  snapdir: string;
  copies: string;
  recordsize: string;
  casesensitivity: string;
  quota_warning: number;
  quota_critical: number;
  refquota_warning: number;
  refquota_critical: number;
};


@Component({
  selector: 'app-dataset-form',
  template: '<entity-form [conf]="this"></entity-form>'
})
export class DatasetFormComponent implements Formconfiguration{

  public volid: string;
  public sub: Subscription;
  public route_success: string[] = ['storage', 'pools'];
  public isBasicMode = true;
  public pk: any;
  public customFilter: any[] = [];
  public queryCall = "pool.dataset.query";
  public isEntity = true;
  public isNew = false;
  public parent_dataset: any;
  protected entityForm: any;
  public recommended_size: any;


  public parent: string;
  public data: any;
  public parent_data: any;


  public custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: T('Basic Mode'),
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id: 'advanced_mode',
      name: T('Advanced Mode'),
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];


  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: T('Name'),
      tooltip: T('Enter a unique name for the dataset.'),
      readonly: true,
      required: true,
      validation: [Validators.required]
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: T('Comments'),
      tooltip: T('Enter any notes about this dataset.'),
    },
    {
      type: 'select',
      name: 'sync',
      placeholder: T('Sync'),
      tooltip: T('Read about <a href="guide" target="_blank">sync</a>\
                  before making any changes.'),
      options: [
        { label: 'Standard', value: 'STANDARD' },
        { label: 'Always', value: 'ALWAYS' },
        { label: 'Disabled', value: 'DISABLED' }
      ],
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: T('Compression level'),
      tooltip: T('For more information about the available compression\
                  algorithms, refer to the <a\
                  href="%%docurl%%/storage.html%%webversion%%#compression"\
                  target="_blank">Compression section</a> of the guide.'),
      options: [
        { label: 'off', value: 'OFF' },
        { label: 'lz4 (recommended)', value: 'LZ4' ,},
        { label: 'gzip (fastest)', value: 'GZIP-1' },
        { label: 'gzip (default level, 6)', value: 'GZIP' },
        { label: 'gzip (maximum, slow)', value: 'GZIP-9' },
        { label: 'zle (runs of zeros)', value: 'ZLE' },
        { label: 'lzjb (legacy, not recommended)', value: 'LZJB' }
      ],
    },
    {
      type: 'radio',
      name: 'share_type',
      placeholder: T('Share Type'),
      tooltip: T('Set the type of client that will most often use this dataset.'),
      options: [{label:'Unix', value: 'UNIX'},
                {label:'Windows', value: 'WINDOWS'},
                {label:'Mac', value: 'MAC'}],
      value: 'UNIX'
    },
    {
      type: 'select',
      name: 'atime',
      placeholder: T('Enable atime'),
      tooltip: T('Choose <i>ON</i> to update the access time for files\
                  when they are read. Choose <b>Off</b> to prevent\
                  producing log traffic when reading files. This can\
                  result in significant performance gains.'),
      options: [
        { label: 'on', value: 'ON' },
        { label: 'off', value: 'OFF' }
      ],
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota',
      placeholder: T('Quota for this dataset'),
      tooltip: T('<i>0</i> disables quotas. Specify a maximum allowed\
                  space for this dataset.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'refquota_unit',
      options: [
        {
          label: 'Bytes',
          value: 'B',
        },
      {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'M',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota_warning',
      placeholder: T('Quota warning alert at, %'),
      tooltip: T('0=Disabled, blank=inherit'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota_critical',
      placeholder: T('Quota critical alert at, %'),
      tooltip: T('0=Disabled, blank=inherit'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota',
      placeholder: 'Quota for this dataset and all children',
      tooltip: 'Define a maximum size for both the dataset and any child\
                datasets. Enter <i>0</i> to remove the quota.',
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'quota_unit',
      options: [
        {
          label: 'Bytes',
          value: 'B',
        },
        {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'M',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota_warning',
      placeholder: T('Quota warning alert at, %'),
      tooltip: T('0=Disabled, blank=inherit'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota_critical',
      placeholder: T('Quota critical alert at, %'),
      tooltip: T('0=Disabled, blank=inherit'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refreservation',
      placeholder: T('Reserved space for this dataset'),
      tooltip: T('<i>0</i> is unlimited. Reserve additional space for\
                  datasets containing logs which could take up all\
                  available free space.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'refreservation_unit',
      options: [
        {
          label: 'Bytes',
          value: 'B',
        },
        {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'M',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'reservation',
      placeholder: T('Reserved space for this dataset and all children'),
      tooltip: T('<i>0</i> is unlimited. A specified value applies to\
                  both this dataset and any child datasets.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'reservation_unit',
      options: [
        {
          label: 'Bytes',
          value: 'B',
        },
        {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'M',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'select',
      name: 'deduplication',
      label: T('ZFS deplication'),
      placeholder: T('ZFS Deduplication'),
      tooltip: T('Read about <a href="guide"\
                  target="_blank">Deduplication</a> before making\
                  changes to this setting.'),
      options: [
        { label: 'on', value: 'ON' },
        { label: 'verify', value: 'VERIFY' },
        { label: 'off', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'readonly',
      placeholder: T('Read-only'),
      tooltip: T('Set to prevent the dataset from being modified.'),
      options: [
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'exec',
      placeholder: T('Exec'),
      tooltip: T('Set whether processes can be executed from within this dataset.'),
      options: [
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'snapdir',
      placeholder: T('Snapshot directory'),
      tooltip: T('Choose if the .zfs snapshot directory is <b>Visible</b>\
                  or <b>Invisible</b> on this dataset.'),
      options: [
        { label: 'Visible', value: 'VISIBLE' },
        { label: 'Invisible', value: 'HIDDEN' },
      ],
    },
    {
      type: 'select',
      name: 'copies',
      placeholder: T('Copies'),
      tooltip: T('Set the number of data copies on this dataset.'),
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' }
      ],
      value: 1
    },
    {
      type: 'select',
      name: 'recordsize',
      placeholder: T('Record Size'),
      tooltip: T('Matching the fixed size of data, as in a database, may\
                  result in better performance.'),
      options: [
        { label: '512', value: '512', disable:true },
        { label: '1K', value: '1K', disable:true },
        { label: '2K', value: '2K', disable:true },
        { label: '4K', value: '4K' },
        { label: '8K', value: '8K' },
        { label: '16K', value: '16K' },
        { label: '32K', value: '32K' },
        { label: '64K', value: '64K' },
        { label: '128K', value: '128K' },
        { label: '256K', value: '256K' },
        { label: '512K', value: '512K' },
        { label: '1M', value: '1M' }
      ],
    },
    {
      type: 'select',
      name: 'casesensitivity',
      placeholder: T('Case Sensitivity'),
      tooltip: T('<i>Sensitive</i> assumes filenames are case sensitive.\
                  <i>Insensitive</i> assumes filenames are not case\
                  sensitive. <i>Mixed</b> understands both types of\
                  filenames.'),
      options: [
        { label: 'Sensitive', value: 'SENSITIVE' },
        { label: 'Insensitive', value: 'INSENSITIVE' },
        { label: 'Mixed', value: 'MIXED' }
      ],
      value: 'SENSITIVE'
    }

  ];

  public advanced_field: Array<any> = [
    'refquota',
    'refquota_unit',
    'quota',
    'quota_unit',
    'refreservation',
    'refreservation_unit',
    'reservation',
    'reservation_unit',
    'readonly',
    'snapdir',
    'copies',
    'recordsize',
    'exec',
    'quota_warning',
    'quota_critical',
    'refquota_warning',
    'refquota_critical'

  ];

  protected byteMap: Object= {
    'G': 1073741824,
    'M': 1048576,
    'K': 1024,
    'B': 1
  };
  protected recordSizeMap: Object= {
    '512': '512',
    '1024': '1K',
    '2048': '2K',
    '4096': '4K',
    '8192': '8K',
    '16384': '16K',
    '32768':'32K',
    '65536': '64K',
    '131072': '128K',
    '262144': '256K',
    '524288': '512K',
    '1048576': '1024K',
  };
  protected reverseRecordSizeMap: Object= {
    '512': '512',
    '1K' :'1024',
    '2K' : '2048',
    '4K': '4096',
    '8K': '8192',
    '16K':'16384',
    '32K': '32768',
    '64K': '65536',
    '128K': '131072',
    '256K': '262144',
    '512K': '524288',
    '1024K': '1048576',
    '1M':'1048576'
  };

  public sendAsBasicOrAdvanced(data: DatasetFormData): DatasetFormData {

    if( this.isNew === false ) {
        delete data.name;
    } else {
      data.name = this.parent + "/" + data.name;
    }

    if( this.isBasicMode === true ) {
      data.refquota = null;
      data.quota = null;
      data.refreservation = null;
      data.reservation = null;
      data.copies = ( data.copies !== undefined && data.copies !== null && data.name !== undefined) ? "1" : undefined;


    }
    // calculate and delete _unit
    data.refquota = data.refquota * this.byteMap[data.refquota_unit];
    data.quota = data.quota * this.byteMap[data.quota_unit];
    data.refreservation = data.refreservation * this.byteMap[data.refreservation_unit];
    data.reservation = data.reservation * this.byteMap[data.reservation_unit];
    delete data.refquota_unit;
    delete data.quota_unit;
    delete data.refreservation_unit;
    delete data.reservation_unit;

    return data;
  }




  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService, protected dialogService: DialogService ) { }



  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    if(!entityForm.isNew){
      entityForm.setDisabled('casesensitivity',true);
      entityForm.setDisabled('name',true);
      _.find(this.fieldConfig, {name:'name'}).tooltip = "Dataset name (read-only)."
    }
    this.entityForm.formGroup.controls['recordsize'].valueChanges.subscribe((res)=>{
      const res_number = parseInt(this.reverseRecordSizeMap[res],10);
      if(this.recommended_size){
        const recommended_size_number = parseInt(this.reverseRecordSizeMap[this.recommended_size],0);
        if (res_number < recommended_size_number){
          _.find(this.fieldConfig, {name:'recordsize'}).warnings = `
          Recommended record size based on pool topology: ${this.recommended_size}.
          Other sizes could reduce sequential I/O performance and space efficiency.`
        } else {
          _.find(this.fieldConfig, {name:'recordsize'}).warnings = null;
        };
      };
    });
  }

  preInit(entityForm: EntityFormComponent) {

    const paramMap: any = (<any>this.aroute.params).getValue();
    this.volid = paramMap['volid'];

    if (paramMap['pk'] !== undefined) {
      this.pk = paramMap['pk'];

      const pk_parent = paramMap['pk'].split('/');
      this.parent = pk_parent.splice(0, pk_parent.length - 1).join('/');
      this.customFilter = [[['id', '=', this.pk]]];
    }
    // add new dataset
    if (paramMap['parent'] || paramMap['pk'] === undefined) {
      this.parent = paramMap['parent'];
      this.pk = this.parent;
      this.isNew = true;
      this.fieldConfig[0].readonly = false;
    }
    if(this.parent){
      const root = this.parent.match(/^[a-zA-Z]+/)[0];
      this.ws.call('pool.dataset.recommended_zvol_blocksize',[root]).subscribe(res=>{
        this.entityForm.formGroup.controls['recordsize'].setValue(res);
        this.recommended_size = res;
      });
      this.ws.call('pool.dataset.query', [[["id", "=", this.pk]]]).subscribe((pk_dataset)=>{
      if(this.isNew){
        const sync = _.find(this.fieldConfig, {name:'sync'});
        const compression = _.find(this.fieldConfig, {name:'compression'});
        const deduplication = _.find(this.fieldConfig, {name:'deduplication'});
        const exec = _.find(this.fieldConfig, {name:'exec'});
        const readonly = _.find(this.fieldConfig, {name:'readonly'});
        const atime = _.find(this.fieldConfig, {name:'atime'});
        const recordsize = _.find(this.fieldConfig, {name:'recordsize'});
        const sync_inherit = [{label:`Inherit (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT'}];
        const compression_inherit = [{label:`Inherit (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT'}];
        const deduplication_inherit = [{label:`Inherit (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT'}];
        const exec_inherit = [{label:`Inherit (${pk_dataset[0].exec.rawvalue})`, value: 'INHERIT'}];
        const readonly_inherit = [{label:`Inherit (${pk_dataset[0].readonly.rawvalue})`, value: 'INHERIT'}];
        const atime_inherit = [{label:`Inherit (${pk_dataset[0].atime.rawvalue})`, value: 'INHERIT'}];
        const recordsize_inherit = [{label:`Inherit (${pk_dataset[0].recordsize.value})`, value: 'INHERIT'}];


        sync.options = sync_inherit.concat(sync.options);
        compression.options = compression_inherit.concat(compression.options);        
        deduplication.options = deduplication_inherit.concat(deduplication.options);
        exec.options = exec_inherit.concat(exec.options);
        readonly.options = readonly_inherit.concat(readonly.options);
        atime.options = atime_inherit.concat(atime.options);
        recordsize.options = recordsize_inherit.concat(recordsize.options);


        entityForm.formGroup.controls['sync'].setValue('INHERIT');
        entityForm.formGroup.controls['compression'].setValue('INHERIT');
        entityForm.formGroup.controls['deduplication'].setValue('INHERIT');
        entityForm.formGroup.controls['exec'].setValue('INHERIT');
        entityForm.formGroup.controls['readonly'].setValue('INHERIT');
        entityForm.formGroup.controls['atime'].setValue('INHERIT');
        entityForm.formGroup.controls['recordsize'].setValue('INHERIT');
        }
        else {
          this.ws.call('pool.dataset.query', [[["id", "=", this.parent]]]).subscribe((parent_dataset)=>{
            this.parent_dataset = parent_dataset[0];
            if (parent_dataset[0].quota.rawvalue === '0') {
              entityForm.formGroup.controls['quota_unit'].setValue('B');
            }
            if (parent_dataset[0].refquota.rawvalue === '0') {
              entityForm.formGroup.controls['refquota_unit'].setValue('B');
            }
            if (parent_dataset[0].reservation.rawvalue === '0') {
              entityForm.formGroup.controls['reservation_unit'].setValue('B');
            }
            if (parent_dataset[0].refreservation.rawvalue === '0') {
              entityForm.formGroup.controls['refreservation_unit'].setValue('B');
            }
            const edit_sync = _.find(this.fieldConfig, {name:'sync'});
            const edit_compression = _.find(this.fieldConfig, {name:'compression'});
            const edit_deduplication = _.find(this.fieldConfig, {name:'deduplication'});
            const edit_exec = _.find(this.fieldConfig, {name:'exec'});
            const edit_readonly = _.find(this.fieldConfig, {name:'readonly'});
            const edit_atime = _.find(this.fieldConfig, {name:'atime'});
            const edit_recordsize = _.find(this.fieldConfig, {name:'recordsize'});
            let edit_sync_collection = [{label: pk_dataset[0].sync.value, value: pk_dataset[0].sync.value}];
            let edit_compression_collection = [{label:pk_dataset[0].compression.value, value: pk_dataset[0].compression.value}];
            let edit_deduplication_collection = [{label:pk_dataset[0].deduplication.value, value: pk_dataset[0].deduplication.value}];
            let edit_exec_collection = [{label:pk_dataset[0].exec.value, value: pk_dataset[0].exec.value}];
            let edit_readonly_collection = [{label:pk_dataset[0].readonly.value, value: pk_dataset[0].readonly.value}];
            let edit_atime_collection = [{label:pk_dataset[0].readonly.value, value: pk_dataset[0].readonly.value}];
            let edit_recordsize_collection = [{label: this.parent_dataset.recordsize.value, value:  this.parent_dataset.recordsize.value}];

            edit_sync_collection = [{label:`Inherit (${this.parent_dataset.sync.rawvalue})`, value: this.parent_dataset.sync.value}];
            edit_sync.options = edit_sync_collection.concat(edit_sync.options);

            edit_compression_collection = [{label:`Inherit (${this.parent_dataset.compression.rawvalue})`, value: this.parent_dataset.compression.value}];
            edit_compression.options = edit_compression_collection.concat(edit_compression.options);

            edit_deduplication_collection = [{label:`Inherit (${this.parent_dataset.deduplication.rawvalue})`, value: this.parent_dataset.deduplication.value}];
            edit_deduplication.options = edit_deduplication_collection.concat(edit_deduplication.options);

            edit_exec_collection = [{label:`Inherit (${this.parent_dataset.exec.rawvalue})`, value: this.parent_dataset.exec.value}];
            edit_exec.options = edit_exec_collection.concat(edit_exec.options);


            edit_readonly_collection = [{label:`Inherit (${this.parent_dataset.readonly.rawvalue})`, value: this.parent_dataset.readonly.value}];
            edit_readonly.options = edit_readonly_collection.concat(edit_readonly.options);

            edit_atime_collection = [{label:`Inherit (${this.parent_dataset.atime.rawvalue})`, value: this.parent_dataset.atime.value}];
            edit_atime.options = edit_atime_collection.concat(edit_atime.options);

            edit_recordsize_collection = [{label:`Inherit`, value: this.parent_dataset.recordsize.value}];
            edit_recordsize.options = edit_recordsize_collection.concat(edit_recordsize.options);
            entityForm.formGroup.controls['sync'].setValue(pk_dataset[0].sync.value);
            if (pk_dataset[0].compression.value === 'GZIP') {
              entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value+'-6');
            }
            else{
              entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value);

            }

            entityForm.formGroup.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
            entityForm.formGroup.controls['exec'].setValue(pk_dataset[0].exec.  value);
            entityForm.formGroup.controls['readonly'].setValue(pk_dataset[0].readonly.value);
            entityForm.formGroup.controls['atime'].setValue(pk_dataset[0].atime.value);
            entityForm.formGroup.controls['recordsize'].setValue(pk_dataset[0].recordsize.value);
            this.parent_dataset = parent_dataset[0];
          })

        }
      });

    }

  }

  getFieldValueOrRaw(field): any {
    if( field === undefined || field.value === undefined) {
      return field;
    }
    return field.value;
  }

  resourceTransformIncomingRestData(wsResponse): any {
     const refquota = this.getFieldValueOrRaw(wsResponse.refquota);
     const quota = this.getFieldValueOrRaw(wsResponse.quota);
     const refreservation = this.getFieldValueOrRaw(wsResponse.refreservation);
     const reservation = this.getFieldValueOrRaw(wsResponse.reservation);
     const quota_warning = this.getFieldValueOrRaw(wsResponse.quota_warning);
     const quota_critical = this.getFieldValueOrRaw(wsResponse.quota_critical);
     const refquota_warning = this.getFieldValueOrRaw(wsResponse.refquota_warning);
     const refquota_critical = this.getFieldValueOrRaw(wsResponse.refquota_critical);

     const returnValue: DatasetFormData = {
        name: this.getFieldValueOrRaw(wsResponse.name),
        atime: this.getFieldValueOrRaw(wsResponse.atime),
        share_type: this.getFieldValueOrRaw(wsResponse.share_type),
        casesensitivity: this.getFieldValueOrRaw(wsResponse.casesensitivity),
        comments: this.getFieldValueOrRaw(wsResponse.comments),
        compression: this.getFieldValueOrRaw(wsResponse.compression),
        copies: this.getFieldValueOrRaw(wsResponse.copies),
        deduplication: this.getFieldValueOrRaw(wsResponse.deduplication),
        quota: quota ? quota.substring(0, quota.length - 1) : 0,
        quota_warning: quota_warning,
        quota_critical: quota_critical,
        refquota_warning: refquota_warning,
        refquota_critical: refquota_critical,
        quota_unit: quota ? quota.substr(-1, 1) : quota,
        readonly: this.getFieldValueOrRaw(wsResponse.readonly),
        exec: this.getFieldValueOrRaw(wsResponse.exec),
        recordsize: this.getFieldValueOrRaw(wsResponse.recordsize),
        refquota: refquota ? refquota.substring(0, refquota.length - 1) : 0,
        refquota_unit: refquota ? refquota.substr(-1, 1) : refquota,
        refreservation: refreservation ? refreservation.substring(0, refreservation.length - 1) : 0,
        refreservation_unit: refreservation ? refreservation.substr(-1, 1) : refreservation,
        reservation: reservation ? reservation.substring(0, reservation.length - 1) : 0,
        reservation_unit: reservation ? reservation.substr(-1, 1) : reservation,
        snapdir: this.getFieldValueOrRaw(wsResponse.snapdir),
        sync: this.getFieldValueOrRaw(wsResponse.sync)
     };

     // If combacks as Megabytes... Re-convert it to K.  Oddly enough.. It only takes K as an input.
    //  if( returnValue.recordsize !== undefined && returnValue.recordsize.indexOf("M") !== -1) {
    //    const value = Number.parseInt(returnValue.recordsize.replace("M", ""));
    //    returnValue.recordsize = "" + ( 1024 * value ) + "K";
    //  }

     if (quota || refquota || refreservation || reservation || quota_warning ||quota_critical ||refquota_warning||refquota_critical) {
       this.isBasicMode = false;
     }

     return returnValue;
  }

  editSubmit(body: any) {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data.quota === 0) {
      data.quota = null;
    }
    if (data.refquota === 0) {
      data.refquota = null;
    }
    // if (data.refreservation === 0) {
    //   data.refreservation = null;
    // }
    // if (data.reservation === 0) {
    //   data.reservation = null;
    // }
    if (data.recordsize === "1M") {
      data.recordsize = "1024K";
    }
    return this.ws.call('pool.dataset.update', [this.pk, data]);
  }

  addSubmit(body: any) {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data.quota === 0) {
      delete data.quota;
    }
    if (data.refquota === 0) {
      delete data.refquota;
    }
    if (data.refreservation === 0) {
      delete data.refreservation;
    }
    if (data.reservation === 0) {
      delete data.reservation;
    }
    if (data.recordsize === 'INHERIT') {
      delete(data.recordsize);
    }
    if (data.sync === 'INHERIT') {
      delete(data.sync);
    }
    if (data.compression === 'INHERIT') {
      delete(data.compression);
    }
    if (data.atime === 'INHERIT') {
      delete(data.atime);
    }
    if (data.exec === 'INHERIT') {
      delete(data.exec);
    }
    if (data.readonly === 'INHERIT') {
      delete(data.readonly);
    }
    if (data.deduplication === 'INHERIT') {
      delete(data.deduplication);
    }
    return this.ws.call('pool.dataset.create', [ data ]);
  }

  customSubmit(body) {
    this.loader.open();

    return ((this.isNew === true ) ? this.addSubmit(body) : this.editSubmit(body)).subscribe((restPostResp) => {
      this.loader.close();

      this.router.navigate(new Array('/').concat(
        this.route_success));
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

}
