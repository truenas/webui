import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService } from '../../../services/';

import { WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'jail-add',
  templateUrl: './jail-add.component.html',
  providers: [JailService, EntityFormService]
})
export class JailAddComponent implements OnInit {

  protected addCall = 'jail.create';
  public route_success: string[] = ['jails', 'jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;
  public custActions: any;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'uuid',
      placeholder: 'Jails Name',
    },
    {
      type: 'input',
      name: 'release',
      placeholder: 'Release',
    },
  ];

  constructor(protected router: Router,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;

    this.loader.open();
    this.ws.job(this.addCall, [this.formGroup.value]).subscribe(
      (res) => {
        this.loader.close();
        if (res.error) {
          this.error = res.error;
        } else {
          this.router.navigate(new Array('/').concat(this.route_success));
        }
      }
    );
  }
}
