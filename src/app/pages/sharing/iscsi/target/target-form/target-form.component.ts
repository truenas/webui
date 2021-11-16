import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiTargetUpdate } from 'app/interfaces/iscsi.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormListConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  IscsiService, WebSocketService, AppLoaderService, ModalService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-target-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService],
})
export class TargetFormComponent implements FormConfiguration {
  queryCall = 'iscsi.target.query' as const;
  addCall = 'iscsi.target.create' as const;
  editCall = 'iscsi.target.update' as const;
  customFilter: any[] = [[['id', '=']]];
  isEntity = true;

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingIscsi.fieldset_target_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSharingIscsi.target_form_placeholder_name,
          tooltip: helptextSharingIscsi.target_form_tooltip_name,
          required: true,
          validation: helptextSharingIscsi.target_form_validators_name,
        },
        {
          type: 'input',
          name: 'alias',
          placeholder: helptextSharingIscsi.target_form_placeholder_alias,
          tooltip: helptextSharingIscsi.target_form_tooltip_alias,
        },
        {
          type: 'select',
          name: 'mode',
          placeholder: helptextSharingIscsi.target_form_placeholder_mode,
          tooltip: helptextSharingIscsi.target_form_tooltip_mode,
          options: [
            {
              label: 'iSCSI',
              value: 'ISCSI',
            },
            {
              label: 'Fibre Channel',
              value: 'FC',
            },
            {
              label: 'Both',
              value: 'BOTH',
            },
          ],
          value: 'ISCSI',
          isHidden: true,
        },
      ],
    },
    {
      name: helptextSharingIscsi.fieldset_target_group,
      label: true,
      class: 'group',
      width: '100%',
      config: [
        {
          type: 'list',
          name: 'groups',
          width: '100%',
          templateListField: [
            {
              type: 'select',
              name: 'portal',
              placeholder: helptextSharingIscsi.target_form_placeholder_portal,
              tooltip: helptextSharingIscsi.target_form_tooltip_portal,
              value: '',
              options: [],
              required: true,
              validation: helptextSharingIscsi.target_form_validators_portal,
              width: '100%',
            },
            {
              type: 'select',
              name: 'initiator',
              placeholder: helptextSharingIscsi.target_form_placeholder_initiator,
              tooltip: helptextSharingIscsi.target_form_tooltip_initiator,
              value: null,
              options: [],
              width: '100%',
            },
            {
              type: 'select',
              name: 'authmethod',
              placeholder: helptextSharingIscsi.target_form_placeholder_authmethod,
              tooltip: helptextSharingIscsi.target_form_tooltip_authmethod,
              width: '100%',
              value: 'NONE',
              options: [
                {
                  label: 'None',
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
            },
            {
              type: 'select',
              name: 'auth',
              placeholder: helptextSharingIscsi.target_form_placeholder_auth,
              tooltip: helptextSharingIscsi.target_form_tooltip_auth,
              value: null,
              width: '100%',
              options: [],
            },
          ],
          listFields: [],
        },
      ],
    },
  ];
  fieldConfig: FieldConfig[];
  title: string = this.translate.instant('Add ISCSI Target');
  pk: number;
  protected entityForm: EntityFormComponent;
  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected iscsiService: IscsiService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected ws: WebSocketService,
    private modalService: ModalService) {
    this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.customFilter = [[['id', '=', rowId]]];
      this.pk = rowId;
    });
    const basicFieldset = _.find(this.fieldSets, { class: 'basic' });
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe(
      (systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.includes(LicenseFeature.FibreChannel)) {
          _.find(basicFieldset.config, { name: 'mode' }).isHidden = false;
        }
      },
    );
  }

  async prerequisite(): Promise<boolean> {
    const targetGroupFieldset = _.find(this.fieldSets, { class: 'group' });
    const targetGroupFieldConfig = _.find(targetGroupFieldset.config, { name: 'groups' }) as FormListConfig;
    const portalGroupField = targetGroupFieldConfig.templateListField[0] as FormSelectConfig;
    const initiatorGroupField = targetGroupFieldConfig.templateListField[1] as FormSelectConfig;
    const authGroupField = targetGroupFieldConfig.templateListField[3] as FormSelectConfig;
    const promise1 = new Promise((resolve) => {
      this.iscsiService.listPortals().toPromise().then(
        (portals) => {
          portals.forEach((portal) => {
            let label = String(portal.tag);
            if (portal.comment) {
              label += ' (' + portal.comment + ')';
            }
            portalGroupField.options.push({ label, value: portal.id });
          });
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });
    const promise2 = new Promise((resolve) => {
      this.iscsiService.listInitiators().toPromise().then(
        (initiatorsRes) => {
          initiatorGroupField.options.push({ label: 'None', value: null });
          initiatorsRes.forEach((initiator) => {
            const optionLabel = initiator.id
              + ' ('
              + (initiator.initiators.length === 0 ? 'ALL Initiators Allowed' : initiator.initiators.toString())
              + ')';
            initiatorGroupField.options.push({ label: optionLabel, value: initiator.id });
          });
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });
    const promise3 = new Promise((resolve) => {
      this.iscsiService.getAuth().toPromise().then(
        (accessRecords) => {
          const tags = _.uniq(accessRecords.map((item) => item.tag));
          authGroupField.options.push({ label: 'None', value: null });
          for (const tag of tags) {
            authGroupField.options.push({ label: String(tag), value: tag });
          }
          resolve(true);
        },
        () => {
          resolve(false);
        },
      );
    });

    return Promise.all([promise1, promise2, promise3]).then(
      () => true,
    );
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    this.title = entityForm.isNew ? this.translate.instant('Add ISCSI Target') : this.translate.instant('Edit ISCSI Target');
  }

  customEditCall(value: IscsiTargetUpdate): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.modalService.closeSlideIn();
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      },
    );
  }

  afterSubmit(): void {
    this.modalService.closeSlideIn();
  }
}
