import {ApplicationRef, Component, Injector, OnDestroy} from '@angular/core';
import { Router} from '@angular/router';
import * as _ from 'lodash';
import helptext from '../../../helptext/storage/import-disk/import-disk';

import {
  RestService,
  WebSocketService,
  JobService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { MatDialog } from '@angular/material';
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
      placeholder : helptext.import_disk_volume_placeholder,
      tooltip: helptext.import_disk_volume_tooltip,
      options: [],
      required: true,
      validation : helptext.import_disk_volume_validation
    },
    {
      type : 'radio',
      name : 'fs_type',
      placeholder : helptext.import_disk_fs_type_placeholder,
      tooltip: helptext.import_disk_fs_type_tooltip,
      options: [
                    {value:'ufs', label:'UFS'},
                    {value:'ntfs', label:'NTFS'},
                    {value:'msdosfs', label:'MSDOSFS'},
                    {value: 'ext2fs', label:'EXT2FS'}
                  ],
      required: true,
      validation : helptext.import_disk_fs_type_validation
    },
    {
      type: 'select',
      name: 'msdosfs_locale',
      placeholder: helptext.import_disk_msdosfs_locale_placeholder,
      tooltip: helptext.import_disk_msdosfs_locale_tooltip,
      options: [],
      isHidden: true,
    },
    {
      type : 'explorer',
      name : 'dst_path',
      placeholder : helptext.import_disk_dst_path_placeholder,
      tooltip: helptext.import_disk_dst_path_tooltip,
      explorerType: 'directory',
      initial: '/mnt',
      required: true,
      validation : helptext.import_disk_dst_path_validation
    },
  ];
  public volume: any;
  public fs_type: any;
  private fs_type_subscription: any;
  private fs_type_list: any;
  public msdosfs_locale: any;
  private entityForm: any;
  protected dialogRef: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected dialog: MatDialog,
              protected _injector: Injector, protected _appRef: ApplicationRef, protected dialogService: DialogService,
              protected job: JobService
              ) {}

  preInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.isNew = true; // disable attempting to load data that doesn't exist
  }

  afterInit(entityForm: any) {
    this.volume = _.find(this.fieldConfig, {'name':'volume'});
    this.fs_type_list = _.find(this.fieldConfig, {'name':'fs_type'});
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
        this.msdosfs_locale['isHidden'] = false;
      } else {
        this.msdosfs_locale['isHidden'] = true;
      }
    });

    entityForm.formGroup.controls['volume'].valueChanges.subscribe((res) => {
      this.ws.call('pool.import_disk_autodetect_fs_type', [res]).subscribe((res) => {
        // If ws call fails to return type, no type is selected; otherwise, type is autoselected.
        for ( let option of this.fs_type_list.options) {
          if (res === option.value) {
            this.fs_type.setValue(option.value);
          };
        };
      })
    })

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
    this.dialogRef.componentInstance.setDescription(T("Importing Disk..."));
    this.dialogRef.componentInstance.setCall('pool.import_disk', [payload.volume, payload.fs_type, fs_options ,payload.dst_path]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((job_res) => {
      this.dialogRef.close();
      this.entityForm.success = true;
      this.job.showLogs(job_res.id, T('Disk Imported: Log Summary'), T('Close'));
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });

  }

  ngOnDestroy() {
    this.fs_type_subscription.unsubscribe();
  }

}
