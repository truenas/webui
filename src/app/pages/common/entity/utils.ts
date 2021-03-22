import * as _ from 'lodash';
import { Relation } from '../entity/entity-form/models/field-relation.interface';

export const FORM_KEY_SEPERATOR = "__";
export const FORM_LABEL_KEY_PREFIX = "__label__";
export const NULL_VALUE = 'null_value';

export class EntityUtils {

  handleError(entity: any, res: any) {
    if (res.code === 409) {
      this.handleObjError(entity, res);
    } else if (res.code === 400) {
      if (typeof res.error === 'object') {
        this.handleObjError(entity, res);
      } else {
        entity.error = res.error;
      }
    } else if (res.code === 500) {
      if (res.error.error_message) {
        entity.error = res.error.error_message;
      } else {
        entity.error = 'Server error: ' + res.error;
      }
    } else {
      entity.error = 'Fatal error! Check logs.';
      console.log("Unknown error code", res.code);
    }
  }

  handleObjError(entity: any, res: any) {
    let scroll = false;
    entity.error = '';
    for (const i in res.error) {
      if (res.error.hasOwnProperty(i)) {
        const field = res.error[i];
        const fc = _.find(entity.fieldConfig, {'name' : i});
        if (fc) {
          const element = document.getElementById(i);
          if (element) {
            if (entity.conf && entity.conf.advanced_field && 
              _.indexOf(entity.conf.advanced_field, i) > -1 &&
              entity.conf.isBasicMode) {
                entity.conf.isBasicMode = false;
              }
            if (!scroll) {
              element.scrollIntoView({behavior: "auto", block: "end", inline: "nearest"});
              scroll = true;
            }
          }
          let errors = '';
          field.forEach((item, j) => { errors += item + ' '; });
          fc['hasErrors'] = true;
          fc['errors'] = errors;
        } else {
          if (typeof field === 'string') {
            entity.error = field;
          } else {
            field.forEach((item, j) => { entity.error += item + '<br />'; });
          }
        }
      }
    }
  }

  handleWSError(entity: any, res: any, dialogService?: any, targetFieldConfig?: any) {
    let dialog;
    if (dialogService) {
      dialog = dialogService;
    } else {
      if (entity) {
        dialog = entity.dialog;
      }
    }
    if (res.exc_info && res.exc_info.extra) {
      res.extra = res.exc_info.extra;
    }

    if (res.extra && (targetFieldConfig || entity.fieldConfig || entity.wizardConfig)) {
      let scroll = false;
      if (res.extra.excerpt) {
        this.errorReport(res, dialog);
      }
      for (let i = 0; i < res.extra.length; i++) {
        let field = res.extra[i][0].split('.');
        const error = res.extra[i][1];

        field = field[1];
        let fc = _.find(entity.fieldConfig, {'name' : field}) || (entity.getErrorField ? entity.getErrorField(field) : undefined);
        let stepIndex;
        if (entity.wizardConfig) {
            _.find(entity.wizardConfig, function(step, index) {
              stepIndex = index;
              fc = _.find(step.fieldConfig, {'name' : field});
              return fc;
            });
        }
        if (targetFieldConfig) {
          fc = _.find(targetFieldConfig, {'name' : field}) || (entity.getErrorField ? entity.getErrorField(field) : undefined);
        }

        if (fc && !fc['isHidden']) {
          const element = document.getElementById(field);
          if (element) {
            if (entity.conf && entity.conf.advanced_field && 
              _.indexOf(entity.conf.advanced_field, field) > -1 &&
              entity.conf.isBasicMode) {
                entity.conf.isBasicMode = false;
              }
            if (!scroll) {
              element.scrollIntoView({behavior: "auto", block: "end", inline: "nearest"});
              scroll = true;
            }
          }
          fc['hasErrors'] = true;
          fc['errors'] = error;
          if (entity.wizardConfig && entity.entityWizard) {
            entity.entityWizard.stepper.selectedIndex = stepIndex;
          }
        } else {
          if (entity.error) {
            entity.error = error;
          } else {
            this.errorReport(res, dialog);
          }
        }
      }
    } else {
      this.errorReport(res, dialog);
    }
  }

  errorReport(res, dialog) {
    if (res.trace && res.trace.formatted && dialog) {
      dialog.errorReport(res.trace.class, res.reason, res.trace.formatted);
    } else if (res.state && res.error && res.exception && dialog) {
      dialog.errorReport(res.state, res.error, res.exception);
    } else {
      // if it can't print the error at least put it on the console.
      console.log(res);
    }
  }

  isObject = function(a) {
    return (!!a) && (a.constructor === Object);
  };

  flattenData(data, level = 0, parent?: any) {
    let ndata = [];
    if (this.isObject(data)){
      data = [data]
    }
    data.forEach((item) => {
      item._level = level;
      if (parent) {
        item._parent = parent.id;
      }
      ndata.push(item);
      if (item.children) {
        ndata = ndata.concat(this.flattenData(item.children, level + 1, item));
      }
      delete item.children;
    });
    return ndata;
  }

  bool(v) {
    return v === "false" || v === "null" || v === "NaN" || v === "undefined" ||
                   v === "0"
               ? false
               : !!v;
  }

  array1DToLabelValuePair(arr: any[]): { label: string, value: any }[] {
    return arr.map(value => ({ label: value.toString(), value }))
  }

   /**
   * make cron time dow consistence
   */
  parseDOW(cron) {
    const dowOptions = ["sun","mon","tue","wed","thu","fri","sat","sun"];
    const cronArray = cron.replace(/00/g, '0').split(' ');
    if (cronArray[cronArray.length - 1] !== '*') {
      cronArray[cronArray.length - 1] = cronArray[cronArray.length - 1]
      .split(',')
      .map(element => dowOptions[element] || element).join(',');
    }
    return cronArray.join(' ');
  }

  filterArrayFunction(item: any) {
    /**
     * This function is for validation.
     * If the value of a control is invaild, we ignore it during sending payload
     */
    let result = true;
    
    if (item === undefined || item === null || item === '') {
      result = false;
    } else if (typeof item === 'object') {
      let isAllEmpty = true;
      Object.values(item).forEach(value => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(subValue => {
              if (this.filterArrayFunction(subValue)) {
                isAllEmpty = false;
              }
            });
          } else {
            isAllEmpty = false;
          }
        }
      });

      if (isAllEmpty) {
        result = false;
      }
    }

    return result;
  }

  parseFormControlValues(data: any, result: any) {
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (key == "release_name" || key == 'undefined' || key.startsWith(FORM_LABEL_KEY_PREFIX)) {
        return;
      }
      
      const key_list = key.split(FORM_KEY_SEPERATOR);
      if (key_list.length > 1) {
        let parent = result;
        for(let i=0; i<key_list.length; i++) {
          const temp_key = key_list[i];
          if (i == key_list.length - 1) {
            if (Array.isArray(value)) {
              const arrayValues = value.map(item => {
                if (Object.keys(item).length > 1) {
                  let subValue = {};
                  this.parseFormControlValues(item, subValue);
                  return subValue;
                } else {
                  return item[Object.keys(item)[0]];
                }
              });
              if (arrayValues.length > 0) {
                parent[temp_key] = arrayValues.filter(this.filterArrayFunction);
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
              this.parseFormControlValues(item, subValue);
              return subValue;
            } else {
              return item[Object.keys(item)[0]];
            }
          });
          if (arrayValues.length > 0) {
            result[key] = arrayValues.filter(this.filterArrayFunction);
          }
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }

  changeNull2String(value) {
    let result = value;
    if (value === null) {
      result = NULL_VALUE;
    }

    return result;
  }

  changeNullString2Null(data) {
    let result;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      const arrayValues = data.map(item => {
        return this.changeNullString2Null(item);
      });
      result = arrayValues;
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach(key => {
        const value = this.changeNullString2Null(data[key]);
        result[key] = value;
      });
    } else if (data === NULL_VALUE) {
      result = null;
    } else {
      result = data;
    }

    return result;
  }
  
  createRelations(relations:Relation[], parentName:string) {
    const result = relations.map(relation => {
      let relationFieldName = relation.fieldName;
      if (parentName) {
        relationFieldName = `${parentName}${FORM_KEY_SEPERATOR}${relationFieldName}`;
      }
  
      return {
        action: 'SHOW',
        when: [{
          name: relationFieldName,
          operator: relation.operatorName,
          value: relation.operatorValue,
        }]
      };
    });

    return result;    
  }

  parseSchemaFieldConfig(schemaConfig: any, parentName: string=null, parentIsList: boolean=false) {
    let results = [];

    if (schemaConfig.schema.hidden) {
      return results;
    }

    let name = schemaConfig.variable;
    if (!parentIsList && parentName) {
      name = `${parentName}${FORM_KEY_SEPERATOR}${name}`;
    }

    let fieldConfig = {
      required: schemaConfig.schema.required,
      value: schemaConfig.schema.default,
      tooltip: schemaConfig.description,
      placeholder: schemaConfig.label,
      name: name,
    }

    let relations: Relation[] = null;
    if (schemaConfig.schema.show_if) {
      relations = schemaConfig.schema.show_if.map(item => {
        return {
          fieldName: item[0],
          operatorName: item[1],
          operatorValue: item[2],
        };         
      })
    }
    
    if (schemaConfig.schema.editable === false) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.enum) {
      fieldConfig['type'] = 'select';
      fieldConfig['options'] = schemaConfig.schema.enum.map(option => {
        return {
          value: option.value,
          label: option.description,
        }
      });

    } else if (schemaConfig.schema.type == 'string') {
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
      fieldConfig['label'] = `Configure ${schemaConfig.label}`;
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
      
      if (schemaConfig.schema.attrs.length > 0) {
        const dictLabel = {
          label: schemaConfig.label,
          name: FORM_LABEL_KEY_PREFIX + name,
          type: 'label',
        };

        if (relations) {
          dictLabel['relation'] = this.createRelations(relations, parentName);
        }

        results = results.concat(dictLabel);
      }

      schemaConfig.schema.attrs.forEach(dictConfig => {
        const subResults = this.parseSchemaFieldConfig(dictConfig, name, parentIsList);

        if (relations) {
          subResults.forEach(subResult => {
            subResult['relation'] = this.createRelations(relations, parentName);
          });
        }
        results = results.concat(subResults);
      });
    }

    if (fieldConfig) {

      if (fieldConfig['type']) {
        if (relations) {
          fieldConfig['relation'] = this.createRelations(relations, parentName);
        }

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

  parseConfigData(configData:object, parentKey:string, result:object) {
    if (configData !== undefined && configData !== null) {
      Object.keys(configData).forEach(key => {
        const value = configData[key];
        let fullKey = key;
        if (parentKey) {
          fullKey = `${parentKey}${FORM_KEY_SEPERATOR}${key}`;
        }
        if (!Array.isArray(value) && typeof value === 'object') {
          this.parseConfigData(value, fullKey, result);
        } else {
          result[fullKey] = value;
        }
      });
    }
    
  }
}
