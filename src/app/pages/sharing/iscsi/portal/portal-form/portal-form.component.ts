import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { IscsiService, WebSocketService, AppLoaderService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../../common/entity/utils';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector: 'app-iscsi-portal-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [IscsiService],
})
export class PortalFormComponent {

  protected addCall = 'iscsi.portal.create';
  protected queryCall = 'iscsi.portal.query';
  protected editCall = 'iscsi.portal.update';
  protected route_success: string[] = ['sharing', 'iscsi', 'portals'];
  protected customFilter: Array<any> = [[["id", "="]]];
  protected isEntity = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'comment',
      placeholder: helptext_sharing_iscsi.portal_form_placeholder_comment,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_comment,
    },
    {
      type: 'select',
      name: 'discovery_authmethod',
      placeholder: helptext_sharing_iscsi.portal_form_placeholder_discovery_authmethod,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authmethod,
      options: [
        {
          label: 'NONE',
          value: 'NONE',
        },
        {
          label: 'CHAP',
          value: 'CHAP',
        },
        {
          label: 'Mutual CHAP',
          value: 'CHAP_MUTUAL',
        }
      ],
      value: 'NONE',
    },
    {
      type: 'select',
      name: 'discovery_authgroup',
      placeholder: helptext_sharing_iscsi.portal_form_placeholder_discovery_authgroup,
      tooltip: helptext_sharing_iscsi.portal_form_tooltip_discovery_authgroup,
      options: [{ label: '---', value: null }],
      value: null,
    },
    {
      type: 'list',
      name: 'listen',
      templateListField: [
        {
          type: 'select',
          name: 'ip',
          placeholder: helptext_sharing_iscsi.portal_form_placeholder_ip,
          tooltip: helptext_sharing_iscsi.portal_form_placeholder_ip,
          options: [],
          class: 'inline',
          width: '60%',
          required: true,
          validation: helptext_sharing_iscsi.portal_form_validators_ip,
        },
        {
          type: 'input',
          name: 'port',
          placeholder: helptext_sharing_iscsi.portal_form_placeholder_port,
          tooltip: helptext_sharing_iscsi.portal_form_tooltip_port,
          value: '3260',
          validation: helptext_sharing_iscsi.portal_form_validators_port,
          class: 'inline',
          width: '30%',
        }
      ],
      listFields: [],
    }
  ];

  protected pk: any;
  protected authgroup_field: any;
  protected entityForm: any;

  constructor(protected router: Router,
    protected iscsiService: IscsiService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected ws: WebSocketService) { }

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });

    this.authgroup_field = _.find(this.fieldConfig, { 'name': 'discovery_authgroup' });
    this.iscsiService.getAuth().subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        if (_.find(this.authgroup_field.options, { value: res[i].tag }) == undefined) {
          this.authgroup_field.options.push({ label: res[i].tag, value: res[i].tag });
        }
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;

    const listenIpField = _.find(this.fieldConfig, { 'name': 'listen' }).templateListField[0];
    this.iscsiService.getIpChoices().subscribe((ips) => {
      for (const ip in ips) {
        listenIpField.options.push({ label: ips[ip], value: ip });
      }

      const listenListFields = _.find(this.fieldConfig, { 'name': 'listen' }).listFields;
      for (const listenField of listenListFields) {
        const ipField = _.find(listenField, { name: 'ip' });
        ipField.options = listenIpField.options;
      }
    });
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
