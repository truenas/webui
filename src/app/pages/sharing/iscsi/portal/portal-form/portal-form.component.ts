import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormListConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { selectedOptionValidator } from 'app/pages/common/entity/entity-form/validators/invalid-option-selected';
import { ipValidator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { IscsiService, WebSocketService, AppLoaderService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-portal-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService],
})
export class PortalFormComponent implements FormConfiguration {
  addCall: 'iscsi.portal.create' = 'iscsi.portal.create';
  queryCall: 'iscsi.portal.query' = 'iscsi.portal.query';
  editCall: 'iscsi.portal.update' = 'iscsi.portal.update';
  route_success: string[] = ['sharing', 'iscsi', 'portals'];
  customFilter: any[] = [[['id', '=']]];
  isEntity = true;

  protected getValidOptions = this.iscsiService.getIpChoices().toPromise().then((ips) => {
    const options: Option[] = [];
    for (const ip in ips) {
      options.push({ label: ips[ip], value: ip });
    }
    return options;
  });
  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_portal_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_iscsi.portal_form_placeholder_comment,
          tooltip: helptext_sharing_iscsi.portal_form_tooltip_comment,
        },
      ],
    },
    {
      name: helptext_sharing_iscsi.fieldset_portal_authgroup,
      label: true,
      class: 'authgroup',
      width: '100%',
      config: [
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
            },
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
      ],
    },
    {
      name: helptext_sharing_iscsi.fieldset_portal_ip,
      label: true,
      class: 'ip',
      width: '100%',
      config: [
        {
          type: 'list',
          name: 'listen',
          templateListField: [
            {
              type: 'select',
              multiple: true,
              name: 'ip',
              placeholder: helptext_sharing_iscsi.portal_form_placeholder_ip,
              tooltip: helptext_sharing_iscsi.portal_form_tooltip_ip,
              options: [],
              class: 'inline',
              width: '60%',
              required: true,
              validation: [Validators.required, ipValidator('all')],
              asyncValidation: [selectedOptionValidator(this.getValidOptions)],
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
            },
          ],
          listFields: [],
        },
      ],
    },
  ];

  fieldConfig: FieldConfig[];
  pk: any;
  protected authgroup_field: FormSelectConfig;
  protected entityForm: EntityFormComponent;
  protected ip: any;

  constructor(protected router: Router,
    protected iscsiService: IscsiService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    protected ws: WebSocketService) { }

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const listenIpFieldConfig: FormListConfig = _.find(this.fieldSets[2].config, { name: 'listen' });
      const listenIpField: FormSelectConfig = listenIpFieldConfig.templateListField[0];
      await this.iscsiService.getIpChoices().toPromise().then((ips) => {
        for (const ip in ips) {
          listenIpField.options.push({ label: ips[ip], value: ip });
        }
        const listenListFields = listenIpFieldConfig.listFields;
        for (const listenField of listenListFields) {
          const ipField: FormSelectConfig = _.find(listenField, { name: 'ip' });
          ipField.options = listenIpField.options;
        }
        resolve(true);
      }, () => {
        resolve(false);
      });
    });
  }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
    const authgroupFieldset = _.find(this.fieldSets, { class: 'authgroup' });
    this.authgroup_field = _.find(authgroupFieldset.config, { name: 'discovery_authgroup' });
    this.iscsiService.getAuth().pipe(untilDestroyed(this)).subscribe((accessRecords) => {
      for (let i = 0; i < accessRecords.length; i++) {
        if (_.find(this.authgroup_field.options, { value: accessRecords[i].tag }) == undefined) {
          this.authgroup_field.options.push({ label: String(accessRecords[i].tag), value: accessRecords[i].tag });
        }
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    entityForm.formGroup.controls['listen'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.genPortalAddress(res);
    });
  }

  customEditCall(value: any): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      },
    );
  }

  genPortalAddress(data: any): void {
    let ips: any[] = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i]['ip']) {
        const samePortIps = data[i]['ip'].reduce(
          (fullIps: any[], currip: any) => fullIps.concat({ ip: currip, port: data[i]['port'] }),
          [],
        );
        ips = ips.concat(samePortIps);
      }
    }
    this.ip = ips;
  }

  beforeSubmit(data: any): void {
    data['listen'] = this.ip;
  }

  resourceTransformIncomingRestData(data: IscsiPortal): any {
    const ports = new Map() as any;
    const groupedIp = [];
    for (let i = 0; i < data.listen.length; i++) {
      // TODO: Incorrect usage of map. Update to .get
      if (ports[data.listen[i].port] === undefined) {
        ports[data.listen[i].port] = [];
        groupedIp.push({
          ip: ports[data.listen[i].port],
          port: data.listen[i].port,
        });
      }
      ports[data.listen[i].port].push(data.listen[i]['ip']);
    }
    return {
      ...data,
      listen: groupedIp,
    };
  }
}
