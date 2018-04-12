import { Component } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { IscsiService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { T } from '../../../../../translate-marker';

@Component({
  selector : 'app-iscsi-portal-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, EntityFormService ],
})
export class PortalEditComponent {
  protected resource_name: string = 'services/iscsi/portal';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'portals' ];
  protected isEntity: boolean = true;

  protected initialCount: number = 0;
  protected initialCount_default: number = 0;

  protected arrayControl: any;
  protected arrayModel: any;
  protected formArray: FormArray;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_target_portal_comment',
      placeholder : T('Comment'),
      tooltip: T('Optional description. Portals are automatically assigned\
 a numeric group ID.'),
    },
    {
      type : 'select',
      name : 'iscsi_target_portal_discoveryauthmethod',
      placeholder : T('Discovery Auth Method'),
      tooltip: T('Configures the authentication level required by the\
 target for discovery of valid devices, where <i>None</i> will allow\
 anonymous discovery while <i>CHAP</i> and <i>Mutual CHAP</i> require\
 authentication.'),
      options : [
        {
          label : 'NONE',
          value : 'None',
        },
        {
          label : 'CHAP',
          value : 'Chap',
        },
        {
          label : 'Mutual CHAP',
          value : 'mutual_chap',
        }
      ]
    },
    {
      type : 'select',
      name : 'iscsi_target_portal_discoveryauthgroup',
      placeholder : T('Discovery Auth Group'),
      tooltip: T('Select a user created in <b>Authorized Access</b> if\
 the <b>Discovery Auth Method</b> is set to <i>CHAP</i> or\
 <i>Mutual CHAP</i>.'),
      options : [ {
        label : 'NONE',
        value : '',
      } ]
    },
    {
      type : 'array',
      name : "iscsi_target_portal_ips",
      initialCount : 0,
      formarray : [
        {
          type : 'select',
          name : "ip",
          placeholder : T('IP Address'),
          tooltip: T('Select the IP address associated with an interface\
 or the wildcard address of <i>0.0.0.0</i> (any interface).'),
          value : '0.0.0.0',
          options : [],
          required: true,
          validation: [ Validators.required ],
        },
        {
          type : 'input',
          name : "port",
          placeholder : T('Port'),
          tooltip: T('TCP port used to access the iSCSI target. Default\
 is <i>3260</i>.'),
          value : '3260',
          required: true,
          validation: [ Validators.required ],
        },
        {
          type: 'checkbox',
          name: 'delete',
          placeholder: T('Delete'),
        }
      ]
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'add_extra_portal_ip',
      name : 'Add Extra Portal IP',
      function : () => {
        this.initialCount += 1;
        this.entityFormService.insertFormArrayGroup(this.initialCount, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_extra_portal_ip',
      name : 'Remove Extra Portal IP',
      function : () => {
        this.initialCount -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount,this.formArray);
      }
    },
  ];

  constructor(protected router: Router, protected iscsiService: IscsiService, protected entityFormService: EntityFormService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_portal_ip' &&
        this.initialCount <= this.initialCount_default) {
      return false;
    }
    return true;
  }

  afterInit(entityForm: any) {
    this.formArray =
        entityForm.formGroup.controls['iscsi_target_portal_ips'] as FormArray;
    this.arrayControl =
        _.find(this.fieldConfig, {'name' : 'iscsi_target_portal_ips'});
    this.arrayModel = _.find(this.arrayControl.formarray, {'name' : 'ip'});
    this.initialCount = this.arrayControl.initialCount;

    this.iscsiService.getIpChoices().subscribe((res) => {
      this.arrayModel.options.push({label : '0.0.0.0', value : '0.0.0.0'});
      res.forEach((item) => {
        this.arrayModel.options.push({label : item[1], value : item[0]});
      });
    });
  }

  preHandler(data: any[]): any[] {
    type IPAddress = {ip: string, port: string};
    let rs = [];

    for (let i in data) {
      let item: IPAddress;
      var ip_arr: any[] = _.split(data[i], ':');
      var ip = ip_arr[0];
      var port = ip_arr[1];
      item = {ip: ip, port: port};
      rs.push(item);
    }
    return rs;
  }

  getIPs(data: any[]): any[] {
    var IPs = new Array();
    for (let i in data) {
      if ('ip' in data[i] && 'port' in data[i] && 'delete' in data[i]) {
        if (!data[i]['delete']) {
          let ip = data[i]['ip'] + ':' + data[i]['port'];
          IPs.push(ip);
        }
      }
    }
    return IPs;
  }

  beforeSubmit(value: any) {
    for (let i in value) {
      if (Array.isArray(value[i])) {
        value[i] = this.getIPs(value[i]);
      }
    }
  }
}
