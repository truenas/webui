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

  private title;
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

  parseSchemaFieldConfig(schemaConfig, parentName=null, parentIsList=false) {
    let results = [];
    let name = schemaConfig.variable;
    if (!parentIsList && parentName) {
      name = `${parentName}_${name}`;
    }

    let fieldConfig = {
      required: schemaConfig.schema.required,
      value: schemaConfig.schema.default,
      tooltip: schemaConfig.description,
      placeholder: schemaConfig.label,
      name: name,
    }
    
    if (schemaConfig.schema.editable === false) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.type == 'string') {
      if (schemaConfig.schema.enum) {
        fieldConfig['type'] = 'select';
        fieldConfig['options'] = schemaConfig.schema.enum.map(option => {
          return {
            value: option.value,
            label: option.description,
          }
        });
      } else {
        fieldConfig['type'] = 'input';
        if (schemaConfig.schema.private) {
          fieldConfig['inputType'] = 'password';
          fieldConfig['togglePw'] = true;
        }

        if (schemaConfig.schema.min_length !== undefined) {
          fieldConfig['min'] = schemaConfig.schema.min_length;
        }

        if (schemaConfig.schema.max_length !== undefined) {
          fieldConfig['max'] = schemaConfig.schema.max_length;
        }
      }

    } else if (schemaConfig.schema.type == 'int') {
      fieldConfig['type'] = 'input';
      fieldConfig['inputType'] = 'number';

    } else if (schemaConfig.schema.type == 'boolean') {
      fieldConfig['type'] = 'checkbox';

    } else if (schemaConfig.schema.type == 'hostpath') {
      fieldConfig['type'] = 'explorer';
      fieldConfig['explorerType'] = 'file';
      fieldConfig['initial'] = '/mnt';

    } else if (schemaConfig.schema.type == 'path') {
      fieldConfig['type'] = 'input';

    } else if (schemaConfig.schema.type == 'list') {
      fieldConfig['type'] = 'list';
      fieldConfig['box'] = true;
      fieldConfig['width'] = '100%';
      fieldConfig['listFields'] = [];

      let listFields = [];
      schemaConfig.schema.items.forEach(item => {
        const fields = this.parseSchemaFieldConfig(item, null, true);
        listFields = listFields.concat(fields);
      });

      fieldConfig['templateListField'] = listFields;

    } else if (schemaConfig.schema.type == 'dict') {
      fieldConfig = null;
      
      schemaConfig.schema.attrs.forEach(dictConfig => {
        const subResults = this.parseSchemaFieldConfig(dictConfig, name, parentIsList);

        if (schemaConfig.schema.show_if) {
          subResults.forEach(subResult => {
            const confidion = schemaConfig.schema.show_if[0];
            let conditionFieldName = confidion[0];
            if (parentName) {
              conditionFieldName = `${parentName}_${conditionFieldName}`;
            }

            subResult['relation'] = [{
              action: (confidion[1] == '=')?'SHOW':'HIDE',
              when: [{
                name: conditionFieldName,
                value: confidion[2],
              }]
            }];
          });
        }
        results = results.concat(subResults);
      });
    }

    if (fieldConfig) {

      if (fieldConfig['type']) {
        results.push(fieldConfig);
  
        if (schemaConfig.schema.subquestions) {
          schemaConfig.schema.subquestions.forEach(subquestion => {
    
            const subResults = this.parseSchemaFieldConfig(subquestion, parentName);
    
            if (schemaConfig.schema.show_subquestions_if !== undefined) {
              subResults.forEach(subFieldConfig => {
                subFieldConfig['isHidden'] = true;
                subFieldConfig['relation'] = [{
                  action: 'SHOW',
                  when: [{
                    name: name,
                    value: schemaConfig.schema.show_subquestions_if,
                  }]
                }];
              });
            }
    
            results = results.concat(subResults);
          });
        }  
      } else {
        console.error("Unsupported type=", schemaConfig);
      }
    }

    return results;
  }

  parseSchema(catalogApp) {
    try {
      this.catalogApp = catalogApp;
      this.title = this.catalogApp.name; 
  
      this.fieldSets = [
        {
          name: helptext.chartForm.release_name.name,
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
          const fieldConfigs = this.parseSchemaFieldConfig(question);
          fieldSet.config = fieldSet.config.concat(fieldConfigs);
        }
      });
  
      this.fieldSets = this.fieldSets.filter(fieldSet => fieldSet.config.length > 0);
      
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
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
    
    this.name = data.name;
    const configData = {};
    this.parseConfigData(data.config, null, configData);
    configData['release_name'] = data.name;
    
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
      const value = data[key];
      if (key == "release_name" || value == "" || value == undefined) {
        return;
      }
      
      const key_list = key.split('_');
      if (key_list.length > 1) {
        let parent = result;
        for(let i=0; i<key_list.length; i++) {
          const temp_key = key_list[i];
          if (i == key_list.length - 1) {
            if (Array.isArray(value)) {
              const arrayValues = value.map(item => {
                if (Object.keys(item).length > 1) {
                  let subValue = {};
                  this.setObjectValues(item, subValue);
                  return subValue;
                } else {
                  return item[Object.keys(item)[0]];
                }
              });
              if (arrayValues.length > 0) {
                parent[temp_key] = arrayValues;
              }
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
          const arrayValues = value.map(item => {
            if (Object.keys(item).length > 1) {
              let subValue = {};
              this.setObjectValues(item, subValue);
              return subValue;
            } else {
              return item[Object.keys(item)[0]];
            }
          });
          if (arrayValues.length > 0) {
            result[key] = arrayValues;
          }
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let values = {};
    this.setObjectValues(data, values);

    let payload = [];
    payload.push({
      catalog: this.catalogApp.catalog.id,
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
