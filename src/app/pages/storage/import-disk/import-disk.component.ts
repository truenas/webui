import {ApplicationRef, Component, Injector, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Validators} from '@angular/forms';
import * as _ from 'lodash';

import {
  RestService,
  WebSocketService
} from '../../../services/';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { MatDialog, MatDialogRef } from '@angular/material';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { DialogService } from 'app/services/dialog.service';
import { EntityUtils } from '../../common/entity/utils';
import { Formconfiguration } from '../../common/entity/entity-form/entity-form.component';
import { T } from '../../../translate-marker';

@Component({
  selector : 'app-import-disk',
  templateUrl : './import-disk.component.html'
})
export class ImportDiskComponent implements OnDestroy, Formconfiguration {
  public initialized = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'volume',
      placeholder : T('Disk'),
      tooltip: T('Use the drop-down menu to select the disk to import.\
 The import will copy the data from the chosen disk to an existing ZFS dataset.\
 Only one disk can be imported at a time.'),
      options: [],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'radio',
      name : 'fs_type',
      placeholder : T('Filesystem type'),
      tooltip: T('Select the type of filesystem on the disk.\
 FreeNAS supports UFS, NTFS, MSDOS, and EXT2 filesystems. Imports of EXT3\
 or EXT4 filesystems are possible in some cases, although neither is fully supported.\
 Refer to the <a href="http://doc.freenas.org/11/storage.html#import-disk" target="_blank">FreeNAS User Guide</a>\
 to learn more about disk imports.'),
      options: [
                    {value:'ufs', label:'UFS'}, 
                    {value:'ntfs', label:'NTFS'}, 
                    {value:'msdosfs', label:'MSDOSFS'}, 
                    {value: 'ext2fs', label:'EXT2FS'}
                  ],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'msdosfs_locale',
      placeholder: T('MSDOSFS locale'),
      tooltip: T('Select the locale for your MSDOSFS device to be able to see \
      files of that locale properly'),
      options: [],
      isHidden: true,
    },
    {
      type : 'explorer',
      name : 'dst_path',
      placeholder : T('Destination Path'),
      tooltip: T('Browse to the ZFS dataset that will hold the copied data.'),
      explorerType: 'directory',
      initial: '/mnt',
      required: true,
      validation : [ Validators.required ]
    },
  ];
  public volume: any;
  public fs_type: any;
  private fs_type_subscription: any;
  public msdosfs_locale: any;
  private entityForm: any;
  protected dialogRef: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected dialog: MatDialog,
              protected _injector: Injector, protected _appRef: ApplicationRef, protected dialogService: DialogService
              ) {}

  preInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.isNew = true; // disable attempting to load data that doesn't exist
  }
  
  afterInit(entityForm: any) {
    this.volume = _.find(this.fieldConfig, {'name':'volume'});
    this.msdosfs_locale = _.find(this.fieldConfig, {'name':'msdosfs_locale'});
    this.fs_type = entityForm.formGroup.controls['fs_type'];

    this.ws.call("pool.import_disk_msdosfs_locales").subscribe((res) =>{
      for (let i =0; i< res.length; i++) {
        this.msdosfs_locale.options.push({label : res[i], value : res[i]});
      }
    }, (res) => {
        this.dialogService.errorReport(T("Error getting locales"), res.message, res.stack);
        this.initialized = true;
    });

    this.fs_type_subscription = this.fs_type.valueChanges.subscribe((value) => {
      if (value === 'msdosfs') {
        this.msdosfs_locale.isHidden = false;
      }
    });
    
    this.ws.call("disk.get_unused", [true]).subscribe((data)=>{

      for (let i = 0; i < data.length; i++) {
        if(data[i].partitions) {
          for (let p = 0; p < data[i].partitions.length; p++) {
            this.volume.options.push(
              {label : data[i].partitions[p].path, 
               value : data[i].partitions[p].path});
          }
        }
      }
      this.initialized = true;

    }, (res) => {
      this.dialogService.errorReport(T("Error getting disk data"), res.message, res.stack);
      this.initialized = true;
    });

  }

  customSubmit(payload){
    const fs_options = {}
    if (payload.fs_type === "msdosfs" && payload.msdosfs_locale) {
      fs_options["locale"] = payload.msdosfs_locale;
    }
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Importing Disk") }});
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDescription(T("Importing Disk..."));
    this.dialogRef.componentInstance.setCall('pool.import_disk', [payload.volume, payload.fs_type, fs_options ,payload.dst_path]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      this.entityForm.snackBar.open(T("Disk successfully imported"), T("Success"));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.entityForm.dialog.errorReport(res.error, res.reason, res.trace.formatted);
    });
    
  }

  ngOnDestroy() {
    this.fs_type_subscription.unsubscribe();
  }

}
