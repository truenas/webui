import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

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
export class ImportDiskComponent implements Formconfiguration {
  public initialized = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'volume',
      placeholder : T('Disk'),
      tooltip: T('Use the drop-down menu to select the disk to import.\
 The import will copy the data from the chosen disk to an existing ZFS dataset.\
 Only one disk can be imported at a time.'),
      options: []
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
                  ]
    },
    {
      type : 'explorer',
      name : 'dst_path',
      placeholder : T('Destination Path'),
      tooltip: T('Browse to the ZFS dataset that will hold the copied data.'),
      explorerType: 'directory',
      initial: '/mnt',
    },
  ];
  public volume: any;
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
    
    this.ws.call("disk.get_unused", [true]).subscribe((res)=>{
      let data = res;
      
      for (let i = 0; i < data.length; i++) {
        this.volume.options.push({label : data[i].name, value : data[i].name});
      }
      this.initialized = true;

    }, (res) => {
      this.dialogService.errorReport(T("Error getting disk data"), res.message, res.stack);
      this.initialized = true;
    });

  }

  customSubmit(payload){
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Importing Disk") }});
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDescription(T("Importing Disk..."));
    this.dialogRef.componentInstance.setCall('pool.import_disk', [payload.volume, payload.fs_type, payload.dst_path]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      this.entityForm.snackBar.open(T("Disk successfully imported"), T("Success"));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.entityForm.dialog.errorReport(res.error, res.reason, res.trace.formatted);
    });
    
  }

}
