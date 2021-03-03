import { Component } from '@angular/core';
import { DialogService, WebSocketService, AppLoaderService } from '../../../../services';
import { Subscription } from 'rxjs';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_acme as helptext, helptext_system_acme } from 'app/helptext/system/acme';
import _ from 'lodash';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

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
  public fieldSets: FieldSet[] = []

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
      this.ws.call('acme.dns.authenticator.authenticator_schemas', []).subscribe((schemas) => {
        const authenticatorConfig: FieldConfig = {
          type : 'select',
          name : 'authenticator',
          placeholder : helptext.authenticator_provider_placeholder,
          tooltip : helptext.authenticator_provider_tooltip,
          options : [
          ],
          parent: this
        };
        const fieldSet: any = [
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
              authenticatorConfig 
            ]
          }]
        for(let schema of schemas) {
          authenticatorConfig.options.push({label: schema.key, value: schema.key});
          for(let input of schema.schema) {
            const conf = {
              name: input['_name_'],
              type: 'input',
              required: input['_required_'],
              placeholder: input['title'],
              parent: this,
              relation: [
                {
                  action: 'SHOW',
                  when: [{
                    name: 'authenticator',
                    value: schema.key,
                   }]
                }
              ]
            };
            fieldSet[0].config.push(conf);
          }
        }
        authenticatorConfig.value = schemas[0].key;
        this.fieldSets = fieldSet;
      });
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
