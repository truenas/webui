import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from "@angular/router";
import { FormArray, FormGroup } from '@angular/forms';
import { MdSnackBar } from '@angular/material';
import * as _ from 'lodash';

import { WebSocketService } from "../../../../../services/ws.service";
import { RestService } from "../../../../../services/rest.service";
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';


@Component({
  selector: 'app-disk-wipe',
  templateUrl: './disk-wipe.component.html',
  styleUrls: ['./disk-wipe.component.css'],
  providers: [ EntityFormService ],
})
export class DiskWipeComponent implements OnInit {

  protected pk: any;
  protected route_success: string[] = ['storage', 'volumes', 'disks'];
  public formGroup: FormGroup;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: 'Name',
      readonly: true
    },
    {
      type: 'select',
      name: 'wipe_method',
      placeholder: 'Method',
      options: [{
        label: 'Quick',
        value: 'QUICK',
      }, {
        label: 'Full with zeros',
        value: 'FULL',
      }, {
        label: 'Full with random data',
        value: 'FULL_RANDOM',
      }],
    }
  ];

  protected disk_name: any;
  protected wipe_method: any;

  constructor(private ws: WebSocketService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService,
              public snackBar: MdSnackBar) {
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
      this.disk_name.value = this.pk;
    });
  }

  ngOnInit() {
    this.preInit();
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);    
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.loader.open();

    let formValue = _.cloneDeep(this.formGroup.value);

    this.ws.job('disk.wipe', [formValue.disk_name, formValue.wipe_method]).subscribe(
      (res) => {
        this.loader.close();
        if (res.progress) {
          console.log(res.progress.percent);
        }
        if (res.state == 'SUCCESS') {
          this.openSnackBar("Disk successfully wiped", "Success");
        } else if (res.state == 'FAILED') {
          this.openSnackBar("Please retry.", "Failed");
        }
      },
      (res) => {
        console.log("Wipe disk error: ", res);
        this.loader.close();
      });
  }

}
