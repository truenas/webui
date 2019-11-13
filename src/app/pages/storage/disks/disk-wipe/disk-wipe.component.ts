import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import * as _ from 'lodash';

import { WebSocketService } from "../../../../services/ws.service";
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { DialogService } from '../../../../services/dialog.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/disks/disk-wipe';

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
      placeholder: helptext.dw_disk_name_placeholder,
      tooltip : helptext.dw_disk_name_tooltip,
      readonly: true
    },
    {
      type: 'select',
      name: 'wipe_method',
      placeholder: helptext.dw_wipe_method_placeholder,
      tooltip : helptext.dw_wipe_method_tooltip,
      options: [],
    }
  ];

  constructor(private ws: WebSocketService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService,
              protected dialog: MatDialog,
              private dialogService: DialogService) {
  }

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.preInit();
  }

  preInit() {
    this.activatedRoute.params.subscribe(params => {
      this.pk = params['pk'];
      this.disk_name = _.find(this.fieldConfig, {name : 'disk_name'});
      this.formGroup.controls['disk_name'].setValue(this.pk);
    });

    let method = [
      {
        label: T('Quick'),
        value: 'QUICK',
      }, {
        label: T('Full with zeros'),
        value: 'FULL',
      }, {
        label: T('Full with random data'),
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

    this.dialogService.confirm(T("Wipe Disk"), T("Wipe this disk?")).subscribe((res) => {
      if (res) {
        let formValue = _.cloneDeep(this.formGroup.value);

        if(!formValue.wipe_method) {
          return false;
        }

        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Wipe") }, disableClose: true });
        this.dialogRef.componentInstance.setDescription(T("Wiping Disk..."));
        this.dialogRef.componentInstance.setCall('disk.wipe', [formValue.disk_name, formValue.wipe_method]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((res) => {
          this.dialogRef.close(false);
          this.router.navigate(new Array('/').concat([
            "storage", "disks"
          ]));
        });
        this.dialogRef.componentInstance.failure.subscribe((res) => {
          this.dialogRef.componentInstance.setDescription(res.error);
        });
      }
    });
  }
}
