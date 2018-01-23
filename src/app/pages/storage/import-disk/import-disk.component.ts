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

@Component({
  selector : 'app-import-disk',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ ],
})
export class ImportDiskComponent {
  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'volume',
      placeholder : 'Disk',
      options: []
    },
    {
      type : 'radio',
      name : 'fs_type',
      placeholder : 'Filesystem type',
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
      placeholder : 'Destination Path',
      explorerType: 'directory',
      initial: '/mnt',
    },
  ];
  public volume: any;
  private entityForm: any;
  protected dialogRef: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected dialog: MatDialog,
              protected _injector: Injector, protected _appRef: ApplicationRef
              ) {}

  preInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.isNew = true; // disable attempting to load data that doesn't exist
  }
  
  afterInit(entityForm: any) {
    this.volume = _.find(this.fieldConfig, {'name':'volume'});
    this.ws.call('disk.get_unused', [true]).subscribe((res)=>{
      res.forEach((item) => {
        let partitions = item['partitions'];
        for (let i = 0; i < partitions.length; i++) {
          let name = partitions[i].path.replace(/^\/dev\//, '');
          this.volume.options.push({label : name, value : partitions[i].path});
        }
      });
    });
  }

  customSubmit(payload){
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Importing Disk" }});
    this.dialogRef.componentInstance.progressNumberType = "nopercent";
    this.dialogRef.componentInstance.setDiscription("Importing Disk...");
    this.dialogRef.componentInstance.setCall('pool.import_disk', [payload.volume, payload.fs_type, payload.dst_path]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      this.entityForm.snackBar.open("Disk successfully imported", "Success");
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.entityForm.dialog.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

}
