import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from "@angular/router";
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as _ from 'lodash';

import { WebSocketService } from "../../../../services/ws.service";
import { RestService } from "../../../../services/rest.service";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { DialogService } from '../../../../services/dialog.service';


@Component({
  selector: 'app-disk-wipe',
  templateUrl: './disk-wipe.component.html',
  styleUrls: ['./disk-wipe.component.css'],
  providers: [ EntityFormService ],
})
export class DiskWipeComponent implements OnInit {

  protected pk: any;
  protected dialogRef: any;
  protected route_success: string[] = ['storage', 'disks'];
  protected disk_name: any;
  protected wipe_method: any;

  public job: any = {};
  public formGroup: FormGroup;
  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: 'Name',
      tooltip : 'Disk to wipe.',
      readonly: true
    },
    {
      type: 'select',
      name: 'wipe_method',
      placeholder: 'Method',
      tooltip : '<i>Quick</i> erases only the partitioning information\
 on a disk, making it easy to reuse, but without clearing other old\
 data. <i>Full with zeros</i> overwrites the entire disk with zeros.\
 <i>Full with random data</i> overwrites the entire disk with random\
 binary data.',
      options: [],
    }
  ];

  constructor(private ws: WebSocketService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService,
              public snackBar: MatSnackBar,
              protected dialog: MatDialog,
              private dialogService: DialogService) {
  }

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.preInit();
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
      duration: 5000
    });
  }

  preInit() {
    this.activatedRoute.params.subscribe(params => {
      this.pk = params['pk'];
      this.disk_name = _.find(this.fieldConfig, {name : 'disk_name'});
      this.formGroup.controls['disk_name'].setValue(this.pk);
    });

    let method = [
      {
        label: 'Quick',
        value: 'QUICK',
      }, {
        label: 'Full with zeros',
        value: 'FULL',
      }, {
        label: 'Full with random data',
        value: 'FULL_RANDOM',
      }];

    this.wipe_method = _.find(this.fieldConfig, {name : 'wipe_method'});
    method.forEach((item) => {
      this.wipe_method.options.push(
          {label : item.label, value : item.value});
    });
    this.formGroup.controls['wipe_method'].setValue(method[0].value);
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.dialogService.confirm("Wipe Disk", "Are you sure you want to wipe disk?").subscribe((res) => {
      if (res) {
        let formValue = _.cloneDeep(this.formGroup.value);

        if(!formValue.wipe_method) {
          return false;
        }

        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Wipe" }, disableClose: true });
        this.dialogRef.componentInstance.progressNumberType = "nopercent";
        this.dialogRef.componentInstance.setDiscription("Wiping Disk...");
        this.dialogRef.componentInstance.setCall('disk.wipe', [formValue.disk_name, formValue.wipe_method]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((res) => {
          this.dialogRef.close(false);
          this.openSnackBar("Disk successfully wiped", "Success");
        });
        this.dialogRef.componentInstance.failure.subscribe((res) => {
          this.dialogRef.componentInstance.setDiscription(res.error);
        });
      }
    });
  }
}
