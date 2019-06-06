import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService, NetworkService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { EntityJobComponent } from '../../common/entity/entity-job';
import { MatSnackBar, MatDialog } from '@angular/material';
import helptext from '../../../helptext/plugins/plugins';

@Component({
  selector: 'app-plugin-add',
  templateUrl: './plugin-add.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService, NetworkService],
})
export class PluginAddComponent implements OnInit {

  protected addCall: string = 'jail.fetch';
  public route_goback: string[] = ['plugins'];
  public route_success: string[] = ['plugins'];
  protected isEntity: boolean = false;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: helptext.name_placeholder,
      disabled: true,
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: helptext.dhcp_placeholder,
      tooltip: helptext.dhcp_tooltip,
      value: false,
      relation: [{
        action: "DISABLE",
        when: [{
          name: "nat",
          value: true
        }]
      }],
    },
    {
      type: 'checkbox',
      name: 'nat',
      placeholder: helptext.nat_placeholder,
      tooltip: helptext.nat_tooltip,
      value: true,
    },
    {
      type: 'select',
      name: 'ip4_interface',
      placeholder: helptext.ip4_interface_placeholder,
      tooltip: helptext.ip4_interface_tooltip,
      options: [
        {
          label: '---------',
          value: '',
        }
      ],
      value: '',
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: helptext.ip4_addr_placeholder,
      tooltip: helptext.ip4_addr_tooltip,
      validation : [ regexValidator(this.networkService.ipv4_regex) ],
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
      required: true,
      class: 'inline',
      width: '50%',
    },
    {
      type: 'select',
      name: 'ip4_netmask',
      placeholder: helptext.ip4_netmask_placeholder,
      tooltip: helptext.ip4_netmask_tooltip,
      options: this.networkService.getV4Netmasks(),
      value: '',
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
      class: 'inline',
      width: '20%',
    },
    {
      type: 'select',
      name: 'ip6_interface',
      placeholder: helptext.ip6_interface_placeholder,
      tooltip: helptext.ip6_interface_tooltip,
      options: [
        {
          label: '---------',
          value: '',
        }
      ],
      value: '',
      class: 'inline',
      width: '30%',
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: helptext.ip6_addr_placeholder,
      tooltip: helptext.ip6_addr_tooltip,
      validation : [ regexValidator(this.networkService.ipv6_regex) ],
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
      required: true,
      class: 'inline',
      width: '50%',
    },
    {
      type: 'select',
      name: 'ip6_prefix',
      placeholder: helptext.ip6_prefix_placeholder,
      tooltip: helptext.ip6_prefix_tooltip,
      options: this.networkService.getV6PrefixLength(),
      value: '',
      class: 'inline',
      width: '20%',
      relation: [{
        action: "ENABLE",
        connective: 'AND',
        when: [{
          name: "dhcp",
          value: false
        }, {
          name: 'nat',
          value: false,
        }]
      }],
    }
  ];

  protected pluginName: any;
  protected nameField: any;
  public formGroup: any;
  public error: string;
  public busy: Subscription;

  protected ip4_interfaceField: any;
  protected ip4_netmaskField: any;
  protected ip6_interfaceField: any;
  protected ip6_prefixField: any;

  protected dialogRef: any;
  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected networkService: NetworkService,
    protected snackBar: MatSnackBar,
    protected matdialog: MatDialog) {}

  updateIpValidation() {
    const ip4AddrField = _.find(this.fieldConfig, {'name': 'ip4_addr'});
    const ip6AddrField = _.find(this.fieldConfig, {'name': 'ip6_addr'});
    if (this.formGroup.controls['dhcp'].value == false && this.formGroup.controls['nat'].value == false) {
      if ((this.formGroup.controls['ip4_addr'].value == '' || this.formGroup.controls['ip4_addr'].value == undefined) &&
      (this.formGroup.controls['ip6_addr'].value == '' || this.formGroup.controls['ip6_addr'].value == undefined)) {
        if (ip4AddrField.required == false) {
          ip4AddrField.required = true;
          this.formGroup.controls['ip4_addr'].setValidators([Validators.required]);
          this.formGroup.controls['ip4_addr'].updateValueAndValidity();
        }
        if (ip6AddrField.required == false) {
          ip6AddrField.required = true;
          this.formGroup.controls['ip6_addr'].setValidators([Validators.required]);
          this.formGroup.controls['ip6_addr'].updateValueAndValidity();
        }
      } else {
        if (ip4AddrField.required == true) {
          ip4AddrField.required = false;
          this.formGroup.controls['ip4_addr'].clearValidators();
          this.formGroup.controls['ip4_addr'].updateValueAndValidity();
        }
        if (ip6AddrField.required == true) {
          ip6AddrField.required = false;
          this.formGroup.controls['ip6_addr'].clearValidators();
          this.formGroup.controls['ip6_addr'].updateValueAndValidity();
        }
      }
    }
  }

  ngOnInit() {
    this.ip4_interfaceField = _.find(this.fieldConfig, {'name': 'ip4_interface'});
    this.ip4_netmaskField = _.find(this.fieldConfig, {'name': 'ip4_netmask'});
    this.ip6_interfaceField = _.find(this.fieldConfig, {'name': 'ip6_interface'});
    this.ip6_prefixField = _.find(this.fieldConfig, {'name': 'ip6_prefix'});
    // get interface options
    this.ws.call('interfaces.query', [[["name", "rnin", "vnet0:"]]]).subscribe(
      (res)=>{
        for (let i in res) {
          this.ip4_interfaceField.options.push({ label: res[i].name, value: res[i].name});
          this.ip6_interfaceField.options.push({ label: res[i].name, value: res[i].name});
        }
      },
      (res)=>{
        new EntityUtils().handleError(this, res);
      }
    );

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.formGroup.controls['ip4_addr'].valueChanges.subscribe((res) => {
      this.updateIpValidation()
    });
    this.formGroup.controls['ip6_addr'].valueChanges.subscribe((res) => {
      this.updateIpValidation();
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
    this.router.navigate(new Array('').concat(this.route_goback));
  }

  onSubmit(event: Event) {
    this.error = null;
    let property: any = [];
    let value = _.cloneDeep(this.formGroup.value);

    if (value['ip4_addr'] != undefined) {
      value['ip4_addr'] = value['ip4_interface'] + '|' + value['ip4_addr'] + '/' + value['ip4_netmask'];
      delete value['ip4_interface'];
      delete value['ip4_netmask'];
    }

    if (value['ip6_addr'] != undefined) {
      value['ip6_addr'] = value['ip6_interface'] + '|' + value['ip6_addr'] + '/' + value['ip6_prefix'];
      delete value['ip6_interface'];
      delete value['ip6_prefix'];
    }

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] != undefined && value[i] != '') {
          if (value[i] == true) {
            if (i == 'dhcp') {
              property.push('bpf=1');
              property.push('dhcp=1');
              property.push('vnet=1');
            } else if (i == 'nat') {
              property.push('nat=1');
              property.push('vnet=1');
            }
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

    this.dialogRef = this.matdialog.open(EntityJobComponent, { data: { "title": T("Install") }, disableClose: true });
    this.dialogRef.componentInstance.setDescription(T("Installing plugin..."));
    this.dialogRef.componentInstance.setCall(this.addCall, [value]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.componentInstance.setTitle(T("Plugin installed successfully"));
      let install_notes = '<p><b>Install Notes:</b></p>';
      for (let i in res.result.install_notes) {
        if (res.result.install_notes[i] == "") {
          install_notes += '<br>';
        } else {
          install_notes += '<p>' + res.result.install_notes[i] + '</p>';
        }
      }
      this.dialogRef.componentInstance.setDescription(install_notes);
      this.dialogRef.componentInstance.showCloseButton = true;

      this.dialogRef.afterClosed().subscribe(result => {
        this.router.navigate(new Array('/').concat(this.route_success));
      });
    });
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

  goAdvanced() {
    this.router.navigate(
      new Array('').concat(["plugins", "advanced", this.pluginName])
    );
  }
}
