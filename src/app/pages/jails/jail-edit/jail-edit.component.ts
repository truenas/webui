import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService } from '../../../services/';

import { WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'jail-edit',
  templateUrl: './jail-edit.component.html',
  providers: [JailService, EntityFormService]
})
export class JailEditComponent implements OnInit {

  protected updateCall = 'jail.update';
  protected queryCall = 'jail.query';
  public route_success: string[] = ['jails', 'jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;
  public custActions: any;
  public pk: any;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'host_hostuuid',
      placeholder: 'Jails Name',
    },
    {
      type: 'select',
      name: 'release',
      placeholder: 'Release',
      options: [],
    },
  ];

  protected releaseField: any;
  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.jailService.getReleaseChoices().subscribe((res) => {
      this.releaseField = _.find(this.fieldConfig, { 'name': 'release' });
      for (let i in res) {
        this.releaseField.options.push({ label: res[i], value: res[i] });
      }
    });
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.ws.call(this.queryCall, [
        [
          ["host_hostuuid", "=", this.pk]
        ]
      ]).subscribe((res) => {
        for (let i in res[0]) {
          if (this.formGroup.controls[i]) {
            if (i == 'release') {
              _.find(this.fieldConfig, { 'name': 'release' }).options.push({ label: res[0][i], value: res[0][i] });
            }
            this.formGroup.controls[i].setValue(res[0][i]);
          }
        }
      });
    });

  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;

    // this.loader.open();
    // this.ws.job(this.addCall, [this.formGroup.value]).subscribe(
    //   (res) => {
    //     this.loader.close();
    //     if (res.error) {
    //       this.error = res.error;
    //     } else {
    //       this.router.navigate(new Array('/').concat(this.route_success));
    //     }
    //   }
    // );
  }
}
