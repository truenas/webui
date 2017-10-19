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
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;
    let property: any = [];
    let value = _.cloneDeep(this.formGroup.value);

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (i != 'uuid' && i != 'release' && i != 'vnet') {
          property.push(i + '=' + value[i]);
          delete value[i];
        }
        if (i == 'vnet') {
          if (value[i]) {
            property.push(i + '=on');
          } else {
            property.push(i + '=off');
          }
          delete value[i];
        }
      }
    }
    value['props'] = property;

    this.loader.open();
    this.ws.job(this.addCall, [value]).subscribe(
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
