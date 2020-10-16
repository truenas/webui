import { Component } from '@angular/core';
import { DialogService, WebSocketService, AppLoaderService } from '../../../../services';
import { Subscription } from 'rxjs';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_acme as helptext, helptext_system_acme } from 'app/helptext/system/acme';

@Component({
  selector: 'app-acmedns-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class AcmednsFormComponent {

  protected addCall: string = 'acme.dns.authenticator.create';
  protected queryCall: string = 'acme.dns.authenticator.query';
  protected editCall = 'acme.dns.authenticator.update';
  protected isEntity: boolean = true;
  protected isOneColumnForm = true;
  public title: string;

  protected fieldConfig: FieldConfig[];
    public fieldSets: FieldSet[] = [
      {
        name: 'Add DNS Authenticator',
        label: true,
        config:[
          {
            type : 'input',
            name : 'name',
            placeholder : helptext.authenticator_name_placeholder,
            tooltip : helptext.authenticator_name_tooltip,
            required: true,
            validation : helptext.authenticator_name_validation,
            parent: this
          },
          {
            type : 'select',
            name : 'authenticator',
            placeholder : helptext.authenticator_provider_placeholder,
            tooltip : helptext.authenticator_provider_tooltip,
              options : [
                {label: 'Route53', value: 'route53'},
              ],
              value: 'route53',
            parent: this
          },
          {
            type : 'input',
            name : 'access_key_id',
            placeholder : helptext.auth_credentials_1_placeholder,
            tooltip : helptext.auth_credentials_1_tooltip,
            required: true,
            validation : helptext.auth_credentials_1_validation,
            parent: this,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'authenticator',
                  value: 'route53',
                 }]
              }
            ]
          },
          {
            type : 'input',
            name : 'secret_access_key',
            placeholder : helptext.auth_credentials_2_placeholder,
            tooltip : helptext.auth_credentials_2_tooltip,
            required: true,
            validation : helptext.auth_credentials_2_validation,
            parent: this,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'authenticator',
                  value: 'route53',
                 }]
              }
            ]
          }
        ]
      }]

  protected entityForm: any;
  private rowNum: any;
  protected queryCallOption: any;
  private getRow = new Subscription;

  constructor(protected ws: WebSocketService, protected loader: AppLoaderService, 
    protected dialog: DialogService, private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [['id', '=', rowId]]
        this.getRow.unsubscribe();
      })
  }

  resourceTransformIncomingRestData(data) {
    for (let item in data.attributes) {
      data[item] = data.attributes[item];
    }
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.title = this.rowNum ? helptext_system_acme.edit_title : helptext_system_acme.add_title;
  }

  beforeSubmit(value) {
    const attributes = {};
    for (let item in value) {
      if (item != 'name' && item != 'authenticator') {
        attributes[item] = value[item];
        delete value[item]
      }
    }
    value.attributes = attributes;

    if (this.rowNum) {
      delete value.authenticator;
    }
  }

  afterSubmit() {
    this.modalService.refreshTable();
  }
}
