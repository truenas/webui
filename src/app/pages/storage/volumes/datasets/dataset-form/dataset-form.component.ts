import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
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
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';



interface DatasetFormData {
  id: string;
  name: string;
  comments: string;
  sync: string;
  compression: string;
  atime: string;
  refquota: string;
  quota: string;
  refreservation: string;
  reservation: string;
  deduplication: string;
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
  public route_success: string[] = ['storage', 'volumes'];
  public isBasicMode: boolean = true;
  public pk: any;

  public customFilter: any[] = [];

  //public resource_name = "storage/volume";

  public queryCall = "pool.dataset.query";
  //public addCall = "pool.dataset.create";
  //public editCall = "pool.dataset.update";
  public isEntity: boolean = true;
  public isNew: boolean = false;


  public parent: string;
  public data: any;
  public parent_data: any;

  
  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'id',
      isHidden: true
    },
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
      tooltip: 'Mandatory; enter a unique name for the dataset.',
      validation: [Validators.required]
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: 'Comments',
      tooltip: 'Enter comments or notes about this dataset here.',
    },
    {
      type: 'select',
      name: 'sync',
      placeholder: 'sync',
      tooltip: 'Read the section on <a href="http://doc.freenas.org/11/storage.html#sync" target="none">sync</a>\
 before making a change to this setting.',
      options: [
        { label: 'STANDARD', value: 'STANDARD' },
        { label: 'ALWAYS', value: 'ALWAYS' },
        { label: 'DISABLED', value: 'DISABLED' }
      ],
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
      name: 'refquota',
      placeholder: 'Quota for this dataset',
      tooltip: 'Only available in <b>Advanced Mode</b>; default of <i>0</i> disables\
 quotas; specifying a value means to use no more than the specified\
 size and is suitable for user datasets to prevent users from hogging available space. 0 == Unlimited.',
      value: "0",
    },
    {
      type: 'input',
      name: 'quota',
      placeholder: 'Quota for this dataset and all children',
      tooltip: 'Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets. 0 == Unlimited.',
      value: "0",
    },
    {
      type: 'input',
      name: 'refreservation',
      placeholder: 'Reserved space for this dataset',
      tooltip: 'Only available in <b>Advanced Mode</b>; default of <i>0</i> is\
 unlimited; specifying a value is suitable for datasets containing logs\
 which could take up all available free space.  0 == Unlimited.',
      value: "0",
    },
    {
      type: 'input',
      name: 'reservation',
      placeholder: 'Reserved space for this dataset and all children',
      tooltip: 'Only available in <b>Advanced Mode</b>; a specified\
 value applies to both this dataset and any child datasets. 0 == Unlimited.',
      value: "0",
    },
    {
      type: 'select',
      name: 'deduplication',
      label: 'ZFS deplication',
      placeholder: 'ZFS Deduplication',
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
    }

  ];

  public advanced_field: Array<any> = [
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
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      id: 'advanced_mode',
      name: 'Advanced Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService) { }



  afterInit(entityForm: EntityFormComponent) {

  }

  preInit(entityForm: EntityFormComponent) {
    let paramMap: any = (<any>this.aroute.params).getValue();

    this.volid = paramMap['volid'];

    if (paramMap['pk'] !== undefined) {
      this.pk = paramMap['pk'];

      let pk_parent = paramMap['pk'].split('/');
      this.parent = pk_parent.splice(0, pk_parent.length - 1).join('/');
      this.fieldConfig.pop();
      this.customFilter = [[['id', '=', this.pk]]];
    }
    // add new dataset
    if (paramMap['parent'] || paramMap['pk'] === undefined) {
      this.parent = paramMap['parent'];
      this.pk = this.parent;
      this.isNew = true;
    }


  }

  getFieldValueOrRaw(field): any {
    if( field.value === undefined && field.rawvalue === undefined) {
      return field;
    }
    return (field.value !== undefined && field.value !== null) ? field.value : field.rawvalue;
  }

  resourceTransformIncomingRestData(wsResponse): any {

     console.log("dataset-form-component", wsResponse );
     const returnValue: DatasetFormData = {
        id: this.getFieldValueOrRaw(wsResponse.id),
        name: this.getFieldValueOrRaw(wsResponse.name),
        atime: this.getFieldValueOrRaw(wsResponse.atime),
        casesensitivity: this.getFieldValueOrRaw(wsResponse.casesensitivity),
        comments: this.getFieldValueOrRaw(wsResponse.comments),
        compression: this.getFieldValueOrRaw(wsResponse.compression),
        copies: this.getFieldValueOrRaw(wsResponse.copies),
        deduplication: this.getFieldValueOrRaw(wsResponse.deduplication),
        quota: this.getFieldValueOrRaw(wsResponse.quota),
        readonly: this.getFieldValueOrRaw(wsResponse.readonly),
        recordsize: this.getFieldValueOrRaw(wsResponse.recordsize),
        refquota: this.getFieldValueOrRaw(wsResponse.refquota),
        refreservation: this.getFieldValueOrRaw(wsResponse.refreservation),
        reservation: this.getFieldValueOrRaw(wsResponse.reservation),
        snapdir: this.getFieldValueOrRaw(wsResponse.snapdir),
        sync: this.getFieldValueOrRaw(wsResponse.sync)
     };

     return returnValue;
  }


}
