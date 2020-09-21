import { Component } from '@angular/core';

import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { DialogService, WebSocketService, AppLoaderService, SystemGeneralService } from '../../../../services';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { shared, helptext_sharing_iscsi } from 'app/helptext/sharing';
import { T } from "app/translate-marker";

@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GlobalconfigurationComponent {

  protected queryCall = 'iscsi.global.config';
  protected editCall = 'iscsi.global.update';
  private getProdType: Subscription;

  public fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_globalconf,
      label: true,
      class: 'globalconf',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'basename',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_basename,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_basename,
          required: true,
          validation: helptext_sharing_iscsi.globalconf_validators_basename
        },
        {
          type: 'chip',
          name: 'isns_servers',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_isns_servers,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_isns_servers
        },
        {
          type: 'input',
          name: 'pool_avail_threshold',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_pool_avail_threshold,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_pool_avail_threshold,
          inputType: 'number',
        },
        {
          type: 'checkbox',
          name: 'alua',
          placeholder: helptext_sharing_iscsi.globalconf_placeholder_alua,
          tooltip: helptext_sharing_iscsi.globalconf_tooltip_alua,
          isHidden: true,
          disabled: true,
        }
      ]
    }
  ];

  public fieldConfig;

  constructor(
    protected dialogService: DialogService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService) {}

  afterInit(entityForm) {
    entityForm.submitFunction = entityForm.editCall;
    this.getProdType = this.sysGeneralService.getProductType.subscribe((res)=>{
      if (res === 'ENTERPRISE') {
        entityForm.setDisabled('alua', false, false);
      }
      this.getProdType.unsubscribe();
    });
  }

  beforeSubmit(value) {
    if (value.pool_avail_threshold == "") {
      value.pool_avail_threshold = null;
    }
  }

  afterSubmit(data) {
    this.ws.call('service.query', [[]]).subscribe((service_res) => {
      const service = _.find(service_res, {"service": "iscsitarget"});
      if (!service['enable']) {
        this.dialogService.confirm(shared.dialog_title, shared.dialog_message,
          true, shared.dialog_button).subscribe((dialogRes) => {
            if (dialogRes) {
              this.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  this.loader.close();
                  this.dialogService.Info(T('iSCSI') + shared.dialog_started_title, 
                  T('The iSCSI') + shared.dialog_started_message, '250px');
                }, (err) => {
                  this.loader.close();
                  this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
                });
               }, (err) => {
                this.loader.close();
                this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
               });
           }
        });
      }
    });
  }

}
