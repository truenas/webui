import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { Formconfiguration } from '../../../../common/entity/entity-form/entity-form.component';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
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
};


@Component({
  selector: 'app-dataset-form',
  template: '<entity-form [conf]="this"></entity-form>'
})
export class DatasetFormComponent implements Formconfiguration {

  public volid: string;
  public sub: Subscription;
  public route_success: string[] = ['storage', 'pools'];
  public isBasicMode = true;
  public pk: any;
  public customFilter: any[] = [];
  public queryCall = "pool.dataset.query";
  public isEntity = true;
  public isNew = false;


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
      tooltip: T('Mandatory; enter a unique name for the dataset.'),
      readonly: true,
      validation: [Validators.required]
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: T('Comments'),
      tooltip: T('Enter comments or notes about this dataset here.'),
    },
    {
      type: 'select',
      name: 'sync',
      placeholder: T('Sync'),
      tooltip: T('Read the section on <a href="http://doc.freenas.org/11/storage.html#sync" target="none">sync</a>\
 before making a change to this setting.'),
      options: [
        { label: 'Inherit (standard)', value: 'STANDARD' },
        { label: 'Standard', value: 'STANDARD' },
        { label: 'Always', value: 'ALWAYS' },
        { label: 'Disabled', value: 'DISABLED' }
      ],
      value: 'STANDARD'
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: T('Compression level')
      ,
      tooltip: T('For more information about the available compression algorithms,\
 refer to the <a href="http://doc.freenas.org/11/storage.html#compression" target="_blank">FreeNAS User Guide</a>.'),
      options: [
        { label: 'Inherit (lz4)', value: 'LZ4' },
        { label: 'off', value: 'OFF' },
        { label: 'lz4 (recommended)', value: 'LZ4' ,},
        { label: 'gzip (fastest)', value: 'GZIP-1' },
        { label: 'gzip (default level, 6)', value: 'GZIP-6' },
        { label: 'gzip (maximum, slow)', value: 'GZIP-9' },
        { label: 'zle (runs of zeros)', value: 'ZLE' },
        { label: 'lzjb (legacy, not recommended)', value: 'LZJB' }
      ],
      value: 'LZ4'
    },
    {
      type: 'select',
      name: 'atime',
      placeholder: T('Enable atime'),
      tooltip: T('Controls whether the access time for files is updated\
 when they are read; setting this property to <b>Off</b> avoids producing log\
 traffic when reading files, and can result in significant performance gains.'),
      options: [
        { label: 'Inherit (on)', value: 'ON' },
        { label: 'on', value: 'ON' },
        { label: 'off', value: 'OFF' }
      ],
      value: 'ON'
    },
    {
      type: 'radio',
      name: 'share_type',
      placeholder: T('Share Type'),
      tooltip: T('Choices are <b>Unix</b>, <b>Mac</b> or <b>Windows</b>. Select the\
                type that matches the type of client accessing the volume/dataset.'),
      options: [
        {label:'Unix', value: 'UNIX'},
        {label:'Windows', value: 'WINDOWS'},
        {label:'Mac', value: 'MAC'}],
      value: 'UNIX'
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refquota',
      placeholder: T('Quota for this dataset'),
      tooltip: T('Only available in <b>Advanced Mode</b>; default of <i>0</i> disables\
 quotas; specifying a value means to use no more than the specified\
 size and is suitable for user datasets to prevent users from hogging available space. 0 === Unlimited.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'refquota_unit',
      options: [ {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'G',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'quota',
      placeholder: 'Quota for this dataset and all children',
      tooltip: 'Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets. 0 === Unlimited.',
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'quota_unit',
      options: [ {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'G',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'refreservation',
      placeholder: T('Reserved space for this dataset'),
      tooltip: T('Only available in <b>Advanced Mode</b>; default of <i>0</i> is\
 unlimited; specifying a value is suitable for datasets containing logs\
 which could take up all available free space.  0 === Unlimited.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'refreservation_unit',
      options: [ {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'G',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'reservation',
      placeholder: T('Reserved space for this dataset and all children'),
      tooltip: T('Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets. 0 === Unlimited.'),
      class: 'inline',
      width: '70%',
      value: 0,
      min: 0,
      validation: [Validators.min(0)]
    },
    {
      type: 'select',
      name: 'reservation_unit',
      options: [ {
        label: 'KiB',
        value: 'K',
      }, {
        label: 'MiB',
        value: 'M',
      }, {
        label: 'GiB',
        value: 'G',
      }],
      value: 'G',
      class: 'inline',
      width: '30%',
    },
    {
      type: 'select',
      name: 'deduplication',
      label: T('ZFS deplication'),
      placeholder: T('ZFS Deduplication'),
      tooltip: T('Read the section on <a href="http://doc.freenas.org/11/storage.html#deduplication" target="none">Deduplication</a>\
 before making a change to this setting.'),
      options: [
        { label: 'Inherit (off)', value: 'OFF' },
        { label: 'on', value: 'ON' },
        { label: 'verify', value: 'VERIFY' },
        { label: 'off', value: 'OFF' }
      ],
      value: 'OFF'
    },
    {
      type: 'select',
      name: 'exec',
      placeholder: T('Exec'),
      tooltip: T('Only available in <b>Advanced Mode</b>;\
 choices are <b>Inherit (off)</b>, <b>On</b>, or <b>Off</b>.'),
      options: [
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' }
      ],
    },
    {
      type: 'select',
      name: 'readonly',
      placeholder: T('Read-only'),
      tooltip: T('Only available in <b>Advanced Mode</b>;\
 choices are <b>Inherit (off)</b>, <b>On</b>, or <b>Off</b>.'),
      options: [
        { label: 'Inherit (off)', value: 'OFF' },
        { label: 'On', value: 'ON' },
        { label: 'Off', value: 'OFF' }
      ],
      value: 'OFF'
    },
    {
      type: 'select',
      name: 'snapdir',
      placeholder: T('Snapshot directory'),
      tooltip: T('Only available in <b>Advanced Mode</b>;\
makes the .zfs snapshot directory <b>Visible</b> or <b>Invisible</b> on this dataset.'),
      options: [
        { label: 'Visible', value: 'VISIBLE' },
        { label: 'Invisible', value: 'HIDDEN' },
      ],
    },
    {
      type: 'select',
      name: 'copies',
      placeholder: T('Copies'),
      tooltip: T('Only available in <b>Advanced Mode</b>;\
 sets the number of data copies on this dataset.'),
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
      tooltip: T('Only available in <b>Advanced Mode</b>; while ZFS automatically\
 adapts the record size dynamically to adapt to data, if the data has a fixed size\
 for example, a database, matching that size may result in better performance.'),
      options: [
        { label: 'Inherit', value: 'INHERIT'},
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
      value : 'INHERIT'
    },
    {
      type: 'select',
      name: 'casesensitivity',
      placeholder: T('Case Sensitivity'),
      tooltip: T('Choices are: <b>sensitive</b> (default, assumes filenames are\
 case sensitive), <b>insensitive</b> (assumes filenames are not case sensitive), or\
 <b>mixed</b> (understands both types of filenames).'),
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
  ];

  protected byteMap: Object= {
    'G': 1073741824,
    'M': 1048576,
    'K': 1024,
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
    if(!entityForm.isNew){
      entityForm.setDisabled('casesensitivity',true);
      entityForm.setDisabled('name',true);
      _.find(this.fieldConfig, {name:'name'}).tooltip = "Dataset name (read-only)."
    }

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
     if( returnValue.recordsize !== undefined && returnValue.recordsize.indexOf("M") !== -1) {
       const value = Number.parseInt(returnValue.recordsize.replace("M", ""));
       returnValue.recordsize = "" + ( 1024 * value ) + "K";
     }

     if (quota || refquota || refreservation || reservation) {
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
    if (data.refreservation === 0) {
      data.refreservation = null;
    }
    if (data.reservation === 0) {
      data.reservation = null;
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
      this.dialogService.errorReport(T("Error saving dataset"), res.reason, res.trace.formatted);
    });
  }

}
