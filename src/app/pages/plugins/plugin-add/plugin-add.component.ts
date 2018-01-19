import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-plugin-add',
  templateUrl: './plugin-add.component.html',
  providers: [EntityFormService, FieldRelationService],
})
export class PluginAddComponent implements OnInit {

  protected addCall: string = 'jail.fetch';
  public route_success: string[] = ['plugins', 'available'];
  protected isEntity: boolean = false;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: 'Plugin Name',
      disabled: true,
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: 'IPv4 Address',
      relation: [{
        action: "DISABLE",
        when: [{
          name: "dhcp",
          value: true
        }]
      }]
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: 'IPv6 Address',
      relation: [{
        action: "DISABLE",
        when: [{
          name: "dhcp",
          value: true
        }]
      }]
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: 'dhcp',
    },
  ];

  protected pluginName: any;
  protected nameField: any;
  public formGroup: any;
  public error: string;
  public busy: Subscription;

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.formGroup.controls['ip4_addr'].valueChanges.subscribe((res) => {
      if (res != '' && res != undefined) {
        if (this.formGroup.controls['ip6_addr'].disabled == false) {
          this.formGroup.controls['ip6_addr'].disable();
        }
      } else {
        if (this.formGroup.controls['ip6_addr'].disabled == true && this.formGroup.controls['dhcp'].value != true) {
          this.formGroup.controls['ip6_addr'].enable();
        }
      }
    });
    this.formGroup.controls['ip6_addr'].valueChanges.subscribe((res) => {
      if (res != '' && res != undefined) {
        if (this.formGroup.controls['ip4_addr'].disabled == false) {
          this.formGroup.controls['ip4_addr'].disable();
        }
      } else {
        if (this.formGroup.controls['ip4_addr'].disabled == true && this.formGroup.controls['dhcp'].value != true) {
          this.formGroup.controls['ip4_addr'].enable();
        }
      }
    });


    for (let i in this.fieldConfig) {
      let config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    }

    this.aroute.params.subscribe(params => {
      this.pluginName = params['name'];
      this.formGroup.controls['name'].setValue(this.pluginName);
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    this.error = null;
    let property: any = [];
    let value = _.cloneDeep(this.formGroup.value);

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] != undefined && value[i] != '') {
          if (value[i] == true) {
            property.push('bpf=yes');
            property.push('dhcp=on');
            property.push('vnet=on');
          } else {
            property.push(i + '=' + value[i]);
          }
        }
        delete value[i];
      }
    }
    value['name'] = this.pluginName;
    value['props'] = property;

    // only for plugin bru-server
    if (this.pluginName == 'bru-server') {
      value['accept'] = true;
    }

    this.loader.open();
    this.ws.job(this.addCall, [value]).subscribe(
      (res) => {
        this.loader.close();
        if (res.error) {
          this.error = res.error;
          this.ws.call('jail.delete', [this.pluginName]).subscribe(
            (jailDeleteRes) => {},
            (jailDeleteRes) => {
              new EntityUtils().handleError(this, jailDeleteRes);
            }
          );
        } else {
          this.router.navigate(new Array('/').concat(this.route_success));
        }
      },
      (res) => {
        new EntityUtils().handleError(this, res);
      }
    );
  }

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
      }
      return item;
    });
  }

  setRelation(config: FieldConfig) {
    let activations =
      this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
        .forEach(control => {
          control.valueChanges.subscribe(
            () => { this.relationUpdate(config, activations); });
        });
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled);
  }
}
