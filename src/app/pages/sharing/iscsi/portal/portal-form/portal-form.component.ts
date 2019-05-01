import { Component } from '@angular/core';
import { FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { IscsiService, WebSocketService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector : 'app-iscsi-portal-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, EntityFormService ],
})
export class PortalFormComponent {

  protected addCall: string = 'iscsi.portal.create';
  protected queryCall: string = 'iscsi.portal.query';
  protected editCall = 'iscsi.portal.update';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'portals' ];
  protected customFilter: Array<any> = [[["id", "="]]];
  protected isEntity: boolean = true;

  protected initialCount: number = 1;
  protected initialCount_default: number = 0;

  protected arrayControl: any;
  protected arrayModel: any;
  protected formArray: FormArray;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'comment',
      placeholder : helptext_sharing_iscsi.portal_form_placeholder_comment,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_comment,
    },
    {
      type : 'select',
      name : 'discovery_authmethod',
      placeholder : helptext_sharing_iscsi.portal_form_placeholder_discovery_authmethod,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authmethod,
      options : [
        {
          label : 'NONE',
          value : 'NONE',
        },
        {
          label : 'CHAP',
          value : 'CHAP',
        },
        {
          label : 'Mutual CHAP',
          value : 'CHAP_MUTUAL',
        }
      ],
      value: 'NONE',
    },
    {
      type : 'select',
      name : 'discovery_authgroup',
      placeholder : helptext_sharing_iscsi.portal_form_placeholder_discovery_authgroup,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authgroup,
      options : [],
      value: null,
    },
    {
      type : 'array',
      name : "listen",
      initialCount : 1,
      formarray : [
        {
          type : 'select',
          name : 'ip',
          placeholder : helptext_sharing_iscsi.portal_form_placeholder_ip,
          tooltip: helptext_sharing_iscsi.portal_form_tooltip_ip,
          value : '0.0.0.0',
          options : [],
          required: true,
          validation: helptext_sharing_iscsi.portal_form_validators_ip,
        },
        {
          type : 'input',
          name : 'port',
          placeholder : helptext_sharing_iscsi.portal_form_placeholder_port,
          tooltip: helptext_sharing_iscsi.portal_form_tooltip_port,
          value : '3260',
          required: true,
          validation: helptext_sharing_iscsi.portal_form_validators_port,
        },
        {
          type: 'checkbox',
          name: 'delete',
          placeholder: helptext_sharing_iscsi.portal_form_placeholder_delete,
          isHidden: true,
          disabled: true,
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
        this.entityFormService.removeFormArrayGroup(this.initialCount, this.formArray);
      }
    },
  ];

  protected pk: any;
  protected authgroup_field: any;
  protected entityForm: any;

  constructor(protected router: Router,
              protected iscsiService: IscsiService,
              protected entityFormService: EntityFormService,
              protected aroute: ActivatedRoute,
              protected loader: AppLoaderService,
              protected ws: WebSocketService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_portal_ip' && this.initialCount <= 1) {
      return false;
    }
    return true;
  }

  preInit() {
    this.arrayControl = _.find(this.fieldConfig,{'name' : 'listen'});

    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
        this.initialCount = 0;
        this.arrayControl.initialCount = 0;
        this.arrayControl.formarray[2]['isHidden'] = false;
        this.arrayControl.formarray[2].disabled = false;
      }
    });

    this.authgroup_field = _.find(this.fieldConfig,{'name' : 'discovery_authgroup'});
    this.iscsiService.getAuth().subscribe((res) => {
      this.authgroup_field.options.push({label : 'None', value : null});
      for (let i = 0; i < res.length; i++) {
        this.authgroup_field.options.push({label: res[i].id, value: res[i].id});
      }
    })
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.formArray = entityForm.formGroup.controls['listen'] as FormArray;
    this.arrayModel = _.find(this.arrayControl.formarray, {'name' : 'ip'});

    this.iscsiService.getIpChoices().subscribe((res) => {
      for (const item in res) {
        this.arrayModel.options.push({label : item, value : res[item]});
      };
    });
  }

  getIPs(data: any[]): any[] {
    var ips = new Array();
    for (let i in data) {
      if (!data[i]['delete']) {
        delete data[i]['delete'];
        ips.push(data[i]);
      }
    }
    return ips;
  }

  beforeSubmit(value: any) {
    for (let i in value) {
      if (Array.isArray(value[i])) {
        value[i] = this.getIPs(value[i]);
      }
    }
  }

  customEditCall(value) {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );
  }

}
