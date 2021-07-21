import * as _ from 'lodash';
import { Option } from 'app/interfaces/option.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { Relation } from './entity-form/models/field-relation.interface';

export const NULL_VALUE = 'null_value';

export class EntityUtils {
  handleError(entity: any, res: any): void {
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
      console.error('Unknown error code', res.code);
    }
  }

  handleObjError(entity: any, res: any): void {
    let scroll = false;
    entity.error = '';
    for (const i in res.error) {
      if (res.error.hasOwnProperty(i)) {
        const field = res.error[i];
        const fc = _.find(entity.fieldConfig, { name: i });
        if (fc) {
          const element = document.getElementById(i);
          if (element) {
            if (entity.conf && entity.conf.advanced_field
              && _.indexOf(entity.conf.advanced_field, i) > -1
              && entity.conf.isBasicMode) {
              entity.conf.isBasicMode = false;
            }
            if (!scroll) {
              element.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
              scroll = true;
            }
          }
          let errors = '';
          field.forEach((item: any) => { errors += item + ' '; });
          fc['hasErrors'] = true;
          fc['errors'] = errors;
        } else if (typeof field === 'string') {
          entity.error = field;
        } else {
          field.forEach((item: any) => { entity.error += item + '<br />'; });
        }
      }
    }
  }

  handleWSError(entity: any, res: any, dialogService?: any, targetFieldConfig?: any): void {
    let dialog;
    if (dialogService) {
      dialog = dialogService;
    } else if (entity) {
      dialog = entity.dialog;
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
        let fc = _.find(entity.fieldConfig, { name: field })
          || (entity.getErrorField ? entity.getErrorField(field) : undefined);
        let stepIndex;
        if (entity.wizardConfig) {
          _.find(entity.wizardConfig, (step, index) => {
            stepIndex = index;
            fc = _.find(step.fieldConfig, { name: field });
            return fc;
          });
        }
        if (targetFieldConfig) {
          fc = _.find(targetFieldConfig, { name: field })
            || (entity.getErrorField ? entity.getErrorField(field) : undefined);
        }

        if (fc && !fc['isHidden']) {
          const element = document.getElementById(field);
          if (element) {
            if (entity.conf && entity.conf.advanced_field
              && _.indexOf(entity.conf.advanced_field, field) > -1
              && entity.conf.isBasicMode) {
              entity.conf.isBasicMode = false;
            }
            if (!scroll) {
              element.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
              scroll = true;
            }
          }
          fc['hasErrors'] = true;
          fc['errors'] = error;
          if (entity.wizardConfig && entity.entityWizard) {
            entity.entityWizard.stepper.selectedIndex = stepIndex;
          }
        } else if (entity.error) {
          entity.error = error;
        } else {
          this.errorReport(res, dialog);
        }
      }
    } else {
      this.errorReport(res, dialog);
    }
  }

  errorReport(res: any, dialog: any): void {
    if (res.trace && res.trace.formatted && dialog) {
      dialog.errorReport(res.trace.class, res.reason, res.trace.formatted);
    } else if (res.state && res.error && res.exception && dialog) {
      dialog.errorReport(res.state, res.error, res.exception);
    } else {
      // if it can't print the error at least put it on the console.
      console.error(res);
    }
  }

  isObject = function (a: unknown): a is Record<string, unknown> {
    return (!!a) && (a.constructor === Object);
  };

  flattenData(data: any | any[], level = 0, parent?: any): any[] {
    let ndata: any[] = [];
    if (this.isObject(data)) {
      data = [data];
    }
    (data as any[]).forEach((item) => {
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

  bool(v: any): boolean {
    return v === 'false' || v === 'null' || v === 'NaN' || v === 'undefined'
      || v === '0'
      ? false
      : !!v;
  }

  array1DToLabelValuePair(arr: (string | number)[]): Option[] {
    return arr.map((value) => ({ label: value.toString(), value }));
  }

  /**
   * make cron time dow consistence
   */
  parseDOW(cron: string): string {
    const dowOptions = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const cronArray = cron.replace(/00/g, '0').split(' ');
    if (cronArray[cronArray.length - 1] !== '*') {
      cronArray[cronArray.length - 1] = cronArray[cronArray.length - 1]
        .split(',')
        // TODO: Probably a bug
        .map((element) => (dowOptions as any)[element] || element)
        .join(',');
    }
    return cronArray.join(' ');
  }

  filterArrayFunction(item: any): boolean {
    /**
     * This function is for validation.
     * If the value of a control is invaild, we ignore it during sending payload
     */
    let result = true;
    if (item === undefined || item === null || item === '') {
      result = false;
    } else if (Array.isArray(item)) {
      let isAllEmpty = true;
      item.forEach((subValue) => {
        if (this.filterArrayFunction(subValue)) {
          isAllEmpty = false;
        }
      });
      if (isAllEmpty) {
        result = false;
      }
    } else if (typeof item === 'object') {
      let isAllEmpty = true;
      Object.values(item).forEach((value) => {
        if (this.filterArrayFunction(value)) {
          isAllEmpty = false;
        }
      });
      if (isAllEmpty) {
        result = false;
      }
    }

    return result;
  }

  changeNull2String(value: any): any {
    let result = value;
    if (value === null) {
      result = NULL_VALUE;
    }

    return result;
  }

  changeNullString2Null(data: any): any {
    let result: any;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      const arrayValues = data.map((item) => this.changeNullString2Null(item));
      result = arrayValues;
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach((key) => {
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

  createRelations(relations: Relation[]): { action: string; when: { name: string; operator: string; value: any }[] }[] {
    const result = relations.map((relation) => {
      const relationFieldName = relation.fieldName;

      return {
        action: RelationAction.Show,
        when: [{
          name: relationFieldName,
          operator: relation.operatorName,
          value: relation.operatorValue,
        }],
      };
    });

    return result;
  }

  parseSchemaFieldConfig(schemaConfig: any): FieldConfig[] {
    let results: FieldConfig[] = [];

    if (schemaConfig.schema.hidden) {
      return results;
    }

    const name = schemaConfig.variable;

    const fieldConfig: any = {
      name,
    };

    if (schemaConfig.schema.required !== undefined) {
      fieldConfig.required = schemaConfig.schema.required;
    }
    if (schemaConfig.schema.default !== undefined) {
      fieldConfig.value = schemaConfig.schema.default;
    }
    if (schemaConfig.description !== undefined) {
      fieldConfig.tooltip = schemaConfig.description;
    }
    if (schemaConfig.label !== undefined) {
      fieldConfig.placeholder = schemaConfig.label;
    }

    let relations: Relation[] = null;
    if (schemaConfig.schema.show_if) {
      relations = (schemaConfig.schema.show_if as any[]).map((item) => ({
        fieldName: item[0],
        operatorName: item[1],
        operatorValue: item[2],
      }));
    }

    if (schemaConfig.schema.editable === false) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.enum) {
      fieldConfig['type'] = 'select';
      fieldConfig['options'] = (schemaConfig.schema.enum as any[]).map((option) => ({
        value: option.value,
        label: option.description,
      }));
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
      if (schemaConfig.schema.min !== undefined) {
        fieldConfig['min'] = schemaConfig.schema.min;
      }

      if (schemaConfig.schema.max !== undefined) {
        fieldConfig['max'] = schemaConfig.schema.max;
      }
    } else if (schemaConfig.schema.type == 'boolean') {
      fieldConfig['type'] = 'checkbox';
    } else if (schemaConfig.schema.type == 'ipaddr') {
      fieldConfig['type'] = 'ipwithnetmask';
      if (!schemaConfig.schema.cidr) {
        fieldConfig['type'] = 'input';
      }
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

      let listFields: any[] = [];
      (schemaConfig.schema.items as any[]).forEach((item) => {
        const fields = this.parseSchemaFieldConfig(item);
        listFields = listFields.concat(fields);
      });

      fieldConfig['templateListField'] = listFields;
    } else if (schemaConfig.schema.type == 'dict') {
      fieldConfig['type'] = 'dict';
      fieldConfig['label'] = schemaConfig.label;
      fieldConfig['width'] = '100%';

      if (schemaConfig.schema.attrs.length > 0) {
        if (relations) {
          fieldConfig['relation'] = this.createRelations(relations);
        }

        let subFields: any[] = [];
        (schemaConfig.schema.attrs as any[]).forEach((dictConfig) => {
          const fields = this.parseSchemaFieldConfig(dictConfig);
          subFields = subFields.concat(fields);
        });
        fieldConfig['subFields'] = subFields;
      }
    }

    if (fieldConfig) {
      if (fieldConfig['type']) {
        if (relations) {
          fieldConfig['relation'] = this.createRelations(relations);
        }

        results.push(fieldConfig);

        if (schemaConfig.schema.subquestions) {
          (schemaConfig.schema.subquestions as any[]).forEach((subquestion) => {
            const subResults = this.parseSchemaFieldConfig(subquestion);

            if (schemaConfig.schema.show_subquestions_if !== undefined) {
              subResults.forEach((subFieldConfig) => {
                subFieldConfig['isHidden'] = true;
                subFieldConfig['relation'] = [{
                  action: RelationAction.Show,
                  when: [{
                    name,
                    value: schemaConfig.schema.show_subquestions_if,
                  }],
                }];
              });
            }

            results = results.concat(subResults);
          });
        }
      } else {
        console.error('Unsupported type=', schemaConfig);
      }
    }

    return results;
  }

  remapAppSubmitData(data: any): any {
    let result: any;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      result = data.map((item) => {
        if (Object.keys(item).length > 1) {
          return this.remapAppSubmitData(item);
        }
        return this.remapAppSubmitData(item[Object.keys(item)[0]]);
      });
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach((key) => {
        result[key] = this.remapAppSubmitData(data[key]);
      });
    } else {
      result = data;
    }

    return result;
  }

  remapAppConfigData(data: any, fieldConfigs: FieldConfig[]): any {
    let result: any;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        let newValue: any = {};
        if (Array.isArray(value)) {
          const name = this.findKeyOfList(fieldConfigs, key);
          newValue = value.map((item) => {
            const remapedValue = this.remapAppConfigData(item, fieldConfigs);
            if (name) {
              return { [name]: remapedValue };
            }
            return remapedValue;
          });
        } else {
          newValue = this.remapAppConfigData(value, fieldConfigs);
        }
        result[key] = newValue;
      });
    } else {
      result = data;
    }

    return result;
  }

  findKeyOfList(fieldConfigs: FieldConfig[], key: string): string {
    if (!fieldConfigs) {
      return null;
    }
    for (let i = 0; i < fieldConfigs.length; i++) {
      const fieldConfig = fieldConfigs[i];

      if (fieldConfig.type == 'list') {
        if (fieldConfig.name == key) {
          return fieldConfig.templateListField[0].name;
        }
        const result = this.findKeyOfList(fieldConfig.templateListField, key);
        if (result) {
          return result;
        }
      } else if (fieldConfig.type == 'dict') {
        const result = this.findKeyOfList(fieldConfig.subFields, key);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
