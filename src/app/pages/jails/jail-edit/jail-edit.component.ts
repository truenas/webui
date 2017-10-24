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
      placeholder: 'UUID',
      disabled: true,
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: 'Name',
    },
    {
      type: 'select',
      name: 'release',
      placeholder: 'Release',
      options: [],
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: 'IPv4 Address',
    },
    {
      type: 'input',
      name: 'defaultrouter',
      placeholder: 'Default Router',
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: 'IPv6 Address',
    },
    {
      type: 'input',
      name: 'defaultrouter6',
      placeholder: 'Default Router For IPv6',
    },
    {
      type: 'input',
      name: 'notes',
      placeholder: 'Note',
    },
    {
      type: 'checkbox',
      name: 'vnet',
      placeholder: 'Vnet',
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
    this.releaseField = _.find(this.fieldConfig, { 'name': 'release' });
    this.jailService.getLocalReleaseChoices().subscribe((res_local) => {
      for (let j in res_local) {
        this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
      }
      this.jailService.getRemoteReleaseChoices().subscribe((res_remote) => {
        for (let i in res_remote) {
          console.log(res_remote[i], _.indexOf(res_local, res_remote[i]));
          if (_.indexOf(res_local, res_remote[i]) < 0) {
            this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
          }
        }
      });
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
            if (i == 'vnet') {
              if (res[0][i] == 'on') {
                 res[0][i] = true;
              } else {
                res[0][i] = false;
              }
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

    let value = _.cloneDeep(this.formGroup.value);

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (i == 'release') {
          delete value[i];
        }
        if (i == 'vnet') {
          console.log(value[i]);
          if (value[i]) {
            value[i] = 'on';
          } else {
            value[i] ='off';
          }
        }
      }
    }

    this.loader.open();
    this.ws.call(this.updateCall, [this.pk, value]).subscribe(
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
