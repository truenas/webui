import * as _ from 'lodash';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  FieldConfig,
  FormCheckboxConfig,
  FormDictConfig,
  FormExplorerConfig,
  FormInputConfig,
  FormIpWithNetmaskConfig,
  FormListConfig,
  FormSelectConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { DialogService } from 'app/services';
import { Relation, RelationGroup } from './entity-form/models/field-relation.interface';

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

  handleWSError(
    entity: any,
    res: WebsocketError | Job,
    dialogService?: DialogService,
    targetFieldConfig?: FieldConfig[],
  ): void {
    let dialog;
    if (dialogService) {
      dialog = dialogService;
    } else if (entity) {
      dialog = entity.dialog;
    }
    if ('exc_info' in res && res.exc_info && res.exc_info.extra) {
      (res as any).extra = res.exc_info.extra;
    }

    if ('extra' in res && res.extra && (targetFieldConfig || entity.fieldConfig || entity.wizardConfig)) {
      let scroll = false;
      if ((res.extra as any).excerpt) {
        this.errorReport(res, dialog);
      }
      for (let i = 0; i < res.extra.length; i++) {
        const field = res.extra[i][0].split('.')[1];
        const error = res.extra[i][1];

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

  errorReport(res: WebsocketError | Job, dialog: DialogService): void {
    if ('trace' in res && res.trace.formatted && dialog) {
      dialog.errorReport(res.trace.class, res.reason, res.trace.formatted);
    } else if ('state' in res && res.error && res.exception && dialog) {
      dialog.errorReport(res.state, res.error, res.exception);
    } else {
      // if it can't print the error at least put it on the console.
      console.error(res);
    }
  }

  isObject = (a: unknown): a is Record<string, unknown> => {
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

  bool(value: unknown): boolean {
    return value === 'false' || value === 'null' || value === 'NaN' || value === 'undefined' || value === '0'
      ? false
      : !!value;
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

  changeNull2String<T>(value: T): T | typeof NULL_VALUE {
    if (value === null) {
      return NULL_VALUE;
    }

    return value;
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

  createRelations(relations: Relation[]): RelationGroup[] {
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

  parseSchemaFieldConfig(schemaConfig: ChartSchemaNode): FieldConfig[] {
    let results: FieldConfig[] = [];

    if (schemaConfig.schema.hidden) {
      return results;
    }

    const name = schemaConfig.variable;

    let fieldConfig: FieldConfig = {
      name,
    } as FieldConfig;

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
      relations = schemaConfig.schema.show_if.map((item) => ({
        fieldName: item[0],
        operatorName: item[1],
        operatorValue: item[2],
      }));
    }

    if (!schemaConfig.schema.editable) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.enum) {
      const selectConfig = fieldConfig as FormSelectConfig;
      selectConfig['type'] = 'select';
      selectConfig['enableTextWrapForOptions'] = true;
      selectConfig['options'] = schemaConfig.schema.enum.map((option) => ({
        value: option.value,
        label: option.description,
      }));
    } else if (schemaConfig.schema.type == 'string') {
      const inputConfig = fieldConfig as FormInputConfig;
      inputConfig['type'] = 'input';
      if (schemaConfig.schema.private) {
        inputConfig['inputType'] = 'password';
        inputConfig['togglePw'] = true;
      }

      if (schemaConfig.schema.min_length !== undefined) {
        inputConfig['min'] = schemaConfig.schema.min_length;
      }

      if (schemaConfig.schema.max_length !== undefined) {
        inputConfig['max'] = schemaConfig.schema.max_length;
      }
    } else if (schemaConfig.schema.type == 'int') {
      const inputConfig = fieldConfig as FormInputConfig;
      inputConfig['type'] = 'input';
      inputConfig['inputType'] = 'number';
      if (schemaConfig.schema.min !== undefined) {
        inputConfig['min'] = schemaConfig.schema.min;
      }

      if (schemaConfig.schema.max !== undefined) {
        inputConfig['max'] = schemaConfig.schema.max;
      }
    } else if (schemaConfig.schema.type == 'boolean') {
      const checkboxConfig = fieldConfig as FormCheckboxConfig;
      checkboxConfig['type'] = 'checkbox';
    } else if (schemaConfig.schema.type == 'ipaddr') {
      if (!schemaConfig.schema.cidr) {
        const ipInputConfig = fieldConfig as FormInputConfig;
        ipInputConfig['type'] = 'input';
      } else {
        const ipConfig = fieldConfig as FormIpWithNetmaskConfig;
        ipConfig['type'] = 'ipwithnetmask';
      }
    } else if (schemaConfig.schema.type == 'hostpath') {
      const conf = { ...fieldConfig } as FormExplorerConfig;
      conf['type'] = 'explorer';
      conf['initial'] = '/mnt';
      conf['explorerType'] = 'file';
      fieldConfig = conf;
    } else if (schemaConfig.schema.type == 'path') {
      const inputConfig = fieldConfig as FormInputConfig;
      inputConfig['type'] = 'input';
    } else if (schemaConfig.schema.type == 'list') {
      const listConfig = fieldConfig as FormListConfig;
      listConfig['type'] = 'list';
      listConfig['label'] = `Configure ${schemaConfig.label}`;
      listConfig['width'] = '100%';
      listConfig['listFields'] = [];

      let listFields: FieldConfig[] = [];
      schemaConfig.schema.items.forEach((item) => {
        const fields = this.parseSchemaFieldConfig(item);
        listFields = listFields.concat(fields);
      });

      listConfig['templateListField'] = listFields;
    } else if (schemaConfig.schema.type == 'dict') {
      const dictConfig = fieldConfig as FormDictConfig;
      dictConfig['type'] = 'dict';
      dictConfig['label'] = schemaConfig.label;
      dictConfig['width'] = '100%';

      if (schemaConfig.schema.attrs.length > 0) {
        if (relations) {
          dictConfig['relation'] = this.createRelations(relations);
        }

        let subFields: FieldConfig[] = [];
        schemaConfig.schema.attrs.forEach((dictConfig) => {
          const fields = this.parseSchemaFieldConfig(dictConfig);
          subFields = subFields.concat(fields);
        });
        dictConfig['subFields'] = subFields;
      }
    }

    if (fieldConfig) {
      if (fieldConfig['type']) {
        if (fieldConfig && relations) {
          fieldConfig['relation'] = this.createRelations(relations);
        }

        results.push(fieldConfig);

        if (schemaConfig.schema.subquestions) {
          schemaConfig.schema.subquestions.forEach((subquestion) => {
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

  remapOneConfigData(data: any, fieldConfig: FieldConfig): any {
    let result;
    if (!fieldConfig || data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      result = [];
      data.forEach((item) => {
        const listConfig = fieldConfig as FormListConfig;
        let value = item;
        const subFieldConfig = listConfig.templateListField[0];
        if (subFieldConfig.type === 'dict') {
          value = this.remapOneConfigData(item, subFieldConfig);
        }
        result.push({
          [subFieldConfig.name]: value,
        });
      });
    } else if (typeof data === 'object') {
      result = {} as any;
      for (const key in data) {
        const dictConfig = fieldConfig as FormDictConfig;
        const subValue = data[key];
        const subFieldConfig = dictConfig.subFields.find((fg) => fg.name === key);
        const newValue = this.remapOneConfigData(subValue, subFieldConfig);
        result[key] = newValue;
      }
    } else {
      result = data;
    }

    return result;
  }

  remapAppConfigData(data: any, fieldConfigs: FieldConfig[]): any {
    const result = {} as any;
    for (const key in data) {
      const value = data[key];
      const fieldConfig = fieldConfigs.find((fg) => fg.name === key);
      const newValue = this.remapOneConfigData(value, fieldConfig);
      result[key] = newValue;
    }
    return result;
  }

  snakeToPascal(str: string): string {
    return str.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }

  snakeToHuman(str: string): string {
    return str.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  getCleanMethod(str: string): string {
    return 'clean' + this.snakeToPascal(str);
  }
}
