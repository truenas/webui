import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared, helptextSharingIscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  DialogService, WebSocketService, AppLoaderService, SystemGeneralService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class GlobalconfigurationComponent implements FormConfiguration {
  queryCall = 'iscsi.global.config' as const;
  editCall = 'iscsi.global.update' as const;

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingIscsi.fieldset_globalconf,
      label: true,
      class: 'globalconf',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'basename',
          placeholder: helptextSharingIscsi.globalconf_placeholder_basename,
          tooltip: helptextSharingIscsi.globalconf_tooltip_basename,
          required: true,
          validation: helptextSharingIscsi.globalconf_validators_basename,
        },
        {
          type: 'chip',
          name: 'isns_servers',
          placeholder: helptextSharingIscsi.globalconf_placeholder_isns_servers,
          tooltip: helptextSharingIscsi.globalconf_tooltip_isns_servers,
        },
        {
          type: 'input',
          name: 'pool_avail_threshold',
          placeholder: helptextSharingIscsi.globalconf_placeholder_pool_avail_threshold,
          tooltip: helptextSharingIscsi.globalconf_tooltip_pool_avail_threshold,
          inputType: 'number',
        },
        {
          type: 'checkbox',
          name: 'alua',
          placeholder: helptextSharingIscsi.globalconf_placeholder_alua,
          tooltip: helptextSharingIscsi.globalconf_tooltip_alua,
          isHidden: true,
          disabled: true,
        },
      ],
    },
  ];

  constructor(
    protected dialogService: DialogService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    private translate: TranslateService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.submitFunction = entityForm.editCall;
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res === ProductType.Enterprise) {
        entityForm.setDisabled('alua', false, false);
      }
    });
  }

  beforeSubmit(value: any): void {
    if (value.pool_avail_threshold == '') {
      value.pool_avail_threshold = null;
    }
  }

  afterSubmit(): void {
    this.ws.call('service.query', [[]]).pipe(untilDestroyed(this)).subscribe((services) => {
      const service = _.find(services, { service: ServiceName.Iscsi });
      if (service.enable) {
        return;
      }

      this.dialogService.confirm({
        title: shared.dialog_title,
        message: shared.dialog_message,
        hideCheckBox: true,
        buttonMsg: shared.dialog_button,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.ws.call('service.update', [service.id, { enable: true }]).pipe(untilDestroyed(this)).subscribe(() => {
          this.ws.call('service.start', [service.service]).pipe(untilDestroyed(this)).subscribe(() => {
            this.loader.close();
            this.dialogService.info(
              this.translate.instant('{service} Service', { service: 'iSCSI' }),
              this.translate.instant('The {service} service has been enabled.', { service: 'iSCSI' }),
              '250px',
              'info',
            );
          }, (err) => {
            this.loader.close();
            this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
          });
        }, (err) => {
          this.loader.close();
          this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
        });
      });
    });
  }
}
