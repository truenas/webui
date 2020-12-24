import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'chart-form',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChartFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;
  protected utils: CommonUtils;

  private title = helptext.nextCloudForm.title;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [];
  private catalogApp: any;

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {

      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.queryCallOption = [["id", "=", rowName]];
        this.getRow.unsubscribe();
    })
    this.utils = new CommonUtils();
  }

  getType(schema) {
    let type;

    switch (schema.type) {
      case 'string':
        type = 'input';
        if (schema.enum) {
          type = 'select';
        }
        break;
      case 'boolean':
        type = 'checkbox';
        break;
      case 'list':
        type = 'list';
        break;
      case 'hostpath':
        type = 'explorer';
        break;
      default:
        type = 'input';
    }

    return type;
  }

  getSelectOptions(schema) {
    const options = [];
    schema.enum.forEach(option => {
      options.push({
        value: option.value,
        label: option.description,
      });
    });
    return options;
  }

  getFieldConfigs(config, parent=null) {
    let fieldConfigs = [];
    let name = config.variable;
    if (parent) {
      name = `${parent.variable}_${name}`;
    }
    const fieldConfig = {
      type: this.getType(config.schema),
      required: config.schema.required,
      value: config.schema.default,
      tooltip: config.description,
      placeholder: config.label,
      name: name,
    }

    if (fieldConfig.type == 'select') {
      fieldConfig['options'] = this.getSelectOptions(config.schema);
    }

    if (config.schema.private) {
      fieldConfig['togglePw'] = true;
    }

    if (fieldConfig.type == 'explorer') {
      fieldConfig['explorerType'] = 'directory';
      fieldConfig['initial'] = '/mnt';
    }

    if (fieldConfig.type == 'list') {
      const listFields = this.getTemplateListField(config, parent);
      fieldConfig['templateListField'] = listFields;
      fieldConfig['box'] = true;
      fieldConfig['listFields'] = [];
    }

    fieldConfigs.push(fieldConfig);

    if (config.schema.subquestions) {
      config.schema.subquestions.forEach(subquestion => {
        let sbu_name = subquestion.variable;
        if (parent) {
          sbu_name = `${parent.variable}_${sbu_name}`;
        }
        const subFieldConfig = {
          type: this.getType(subquestion.schema),
          name: sbu_name,
          placeholder: config.label,
        }

        if (config.schema.show_subquestions_if) {
          subFieldConfig['isHidden'] = true;
          subFieldConfig['relation'] = [{
            action: 'SHOW',
              when: [{
                name: name,
                value: true,
              }]
          }];
        }

        if (subFieldConfig.type == 'explorer') {
          subFieldConfig['explorerType'] = 'directory';
          subFieldConfig['initial'] = '/mnt';
        }

        fieldConfigs.push(subFieldConfig);
      });
    }

    return fieldConfigs;
  }

  getTemplateListField(config, parent) {
    let listFields = [];
    config.schema.items.forEach(item => {
      const fields = this.getFieldConfigs(item, parent);
      listFields = listFields.concat(fields);
    });
    return listFields;
  }

  parseSchema(catalogApp) {
    this.catalogApp = catalogApp;
    this.title = this.catalogApp.name; 

    this.fieldSets = [
      {
        name: helptext.nextCloudForm.release_name.name,
        width: '100%',
        config: [
          {
            type: 'input',
            name: 'release_name',
            placeholder: helptext.chartForm.release_name.placeholder,
            tooltip: helptext.chartForm.release_name.tooltip,
            required: true
          }
        ],
        colspan: 2
      },
    ];
    this.catalogApp.schema.groups.forEach(group => {
      this.fieldSets.push({
        name: group.name,
        width: '50%',
        label: true,
        config: [],
      })
    });
    this.catalogApp.schema.questions.forEach(question => {
      const fieldSet = this.fieldSets.find(fieldSet => fieldSet.name == question.group);
      if (fieldSet) {
        if (question.schema.attrs) {
          question.schema.attrs.forEach(config => {
            fieldSet.config = fieldSet.config.concat(this.getFieldConfigs(config, question));
          });
        } else {
          fieldSet.config = fieldSet.config.concat(this.getFieldConfigs(question));
        }
      }
    });

    this.fieldSets = this.fieldSets.filter(fieldSet => fieldSet.config.length > 0);
    console.log(this.fieldSets);
  }

  parseConfigData(configData, parentKey, result) {
    Object.keys(configData).forEach(key => {
      const value = configData[key];
      let fullKey = key;
      if (parentKey) {
        fullKey = `${parentKey}_${key}`;
      }
      if (!Array.isArray(value) && typeof value === 'object') {
        this.parseConfigData(value, fullKey, result);
      } else {
        result[fullKey] = value;
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    console.log(data);
    this.name = data.name;
    const configData = {};
    this.parseConfigData(data.config, null, configData);
    configData['release_name'] = data.name;
    console.log(configData);
    return configData;
  }

  afterInit(entityEdit: any) {
    if (this.rowName) {
      entityEdit.setDisabled('release_name', true, false);
    }

    let repositoryConfig = _.find(this.fieldConfig, {'name': 'image_repository'});
    if (repositoryConfig) {
      repositoryConfig.readonly = true;
    }
    
  }

  setObjectValues(data, result) {
    Object.keys(data).forEach(key => {
      const key_list = key.split('_');
      const value = data[key];
      if (key == "release_name" || value == "" || value == undefined) {
        return;
      }
      
      if (key_list.length > 1) {
        let parent = result;
        for(let i=0; i<key_list.length; i++) {
          const temp_key = key_list[i];
          if (i == key_list.length - 1) {
            if (Array.isArray(value)) {
              parent[temp_key] = this.setArrayValues(value);
            } else {
              parent[temp_key] = value;
            }            
          } else {
            if (!parent[temp_key]) {
              parent[temp_key] = {};
            }
            parent = parent[temp_key];
          }
        }        
      } else {
        if (Array.isArray(value)) {
          result[key] = this.setArrayValues(value);
        } else {
          result[key] = value;
        }
      }
      
    });

    return result;
  }

  setArrayValues(data) {
    const arrayVaules = [];
    data.forEach(item => {
      const oneItem = {};
      this.setObjectValues(item, oneItem);
      arrayVaules.push(oneItem);
    });

    return arrayVaules;
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let values = {};
    this.setObjectValues(data, values);

    let payload = [];
    payload.push({
      catalog: 'OFFICIAL',
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: 'charts',
      version: 'latest',
      values: values
    });

    if (this.rowName) {
      delete payload[0].catalog;
      delete payload[0].item;
      delete payload[0].release_name;
      delete payload[0].train;
      delete payload[0].version;
      payload.unshift(this.name);
      apiCall = this.editCall;
    }
console.log(payload);
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(apiCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }

}
