import { Component } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { IscsiService, WebSocketService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { T } from '../../../../../translate-marker';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';

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
      placeholder : T('Comment'),
      tooltip: T('Optional description. Portals are automatically\
                  assigned a numeric group ID.'),
    },
    {
      type : 'select',
      name : 'discovery_authmethod',
      placeholder : T('Discovery Auth Method'),
      tooltip: T('<a href="%%docurl%%/sharing.html%%webversion%%#block-iscsi"\
                  target="_blank">iSCSI</a> supports multiple\
                  authentication methods that are used by the target to\
                  discover valid devices. <i>None</i> allows anonymous\
                  discovery while <i>CHAP</i> and <i>Mutual CHAP</i>\
                  require authentication.'),
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
      placeholder : T('Discovery Auth Group'),
      tooltip: T('Select a user created in <b>Authorized Access</b> if\
                  the <b>Discovery Auth Method</b> is set to\
                  <i>CHAP</i> or <i>Mutual CHAP</i>.'),
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
          placeholder : T('IP Address'),
          tooltip: T('Select the IP address associated with an interface\
                      or the wildcard address of <i>0.0.0.0</i>\
                      (any interface).'),
          value : '0.0.0.0',
          options : [],
          required: true,
          validation: [ Validators.required ],
        },
        {
          type : 'input',
          name : 'port',
          placeholder : T('Port'),
          tooltip: T('TCP port used to access the iSCSI target.\
                      Default is <i>3260</i>.'),
          value : '3260',
          required: true,
          validation: [ Validators.required ],
        },
        {
          type: 'checkbox',
          name: 'delete',
          placeholder: T('Delete'),
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
      this.arrayModel.options.push({label : '0.0.0.0', value : '0.0.0.0'});
      res.forEach((item) => {
        this.arrayModel.options.push({label : item[1], value : item[0]});
      });
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
