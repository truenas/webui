import * as _ from 'lodash';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityErrorHandler } from 'app/modules/entity/entity-form/interfaces/entity-error-handler.interface';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const NULL_VALUE = 'null_value';

// eslint-disable-next-line @typescript-eslint/ban-types
export type ItemBeforeFlattening = object & {
  id: string | number;
  children?: ItemBeforeFlattening[];
};

type DataBeforeFlattening = ItemBeforeFlattening | ItemBeforeFlattening[];

export interface FlattenedData extends Record<string, unknown> {
  _level?: number;
  _parent?: string | number;
}

export class EntityUtils {
  handleError(entity: any, error: any): void {
    if (error.code === 409) {
      this.handleObjError(entity, error);
    } else if (error.code === 400) {
      if (typeof error.error === 'object') {
        this.handleObjError(entity, error);
      } else {
        entity.error = error.error;
      }
    } else if (error.code === 500) {
      if (error.error.error_message) {
        entity.error = error.error.error_message;
      } else {
        entity.error = 'Server error: ' + error.error;
      }
    } else {
      entity.error = 'Fatal error! Check logs.';
      console.error('Unknown error code', error.code);
    }
  }

  handleObjError(entity: EntityErrorHandler, error: any): void {
    let scroll = false;
    entity.error = '';
    for (const i in error.error) {
      if (error.error.hasOwnProperty(i)) {
        const field = error.error[i];
        const fc = _.find(entity.fieldConfig, { name: i });
        if (fc) {
          const element = document.getElementById(i);
          if (element) {
            if (entity.conf && entity.conf.advancedFields
              && _.indexOf(entity.conf.advancedFields, i) > -1
              && entity.conf.isBasicMode) {
              entity.conf.isBasicMode = false;
            }
            if (!scroll) {
              element.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
              scroll = true;
            }
          }
          let errors = '';
          field.forEach((item: string) => { errors += item + ' '; });
          fc['hasErrors'] = true;
          fc['errors'] = errors;
        } else if (typeof field === 'string') {
          entity.error = field;
        } else {
          field.forEach((item: string) => { entity.error += item + '<br />'; });
        }
      }
    }
  }

  handleWsError(
    entity: any,
    res: WebsocketError | Job,
    dialogService?: DialogService,
    targetFieldConfig?: FieldConfig[],
  ): void {
    let dialog: DialogService;
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
      } else if (Array.isArray(res.extra)) {
        res.extra.forEach((extraItem) => {
          const field = extraItem[0].split('.')[1];
          const error = extraItem[1];

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
              if (entity.conf && entity.conf.advancedFields
                && _.indexOf(entity.conf.advancedFields, field) > -1
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
        });
      } else {
        this.errorReport(res, dialog);
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

  isObject = (something: unknown): something is Record<string, unknown> => {
    return (!!something) && (something.constructor === Object);
  };

  flattenData(data: DataBeforeFlattening, level = 0, parent?: { id: string | number }): FlattenedData[] {
    let ndata: FlattenedData[] = [];
    if (this.isObject(data)) {
      data = [data];
    }
    data.forEach((item) => {
      (item as FlattenedData)._level = level;
      if (parent) {
        (item as FlattenedData)._parent = parent.id;
      }
      ndata.push(item);
      if (item.children) {
        ndata = ndata.concat(this.flattenData(item.children, level + 1, item));
      }
      delete item.children;
    });
    return ndata;
  }

  array1dToLabelValuePair(arr: (string | number)[]): Option[] {
    return arr.map((value) => ({ label: value.toString(), value }));
  }

  /**
   * make cron time dow consistence
   */
  parseDow(cron: string): string {
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

  filterArrayFunction(item: unknown): boolean {
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

  changeNullString2Null(data: unknown): unknown {
    let result: unknown;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      const arrayValues = data.map((item) => this.changeNullString2Null(item));
      result = arrayValues;
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach((key) => {
        const value = this.changeNullString2Null((data as Record<string, unknown>)[key]);
        (result as Record<string, unknown>)[key] = value;
      });
    } else if (data === NULL_VALUE) {
      result = null;
    } else {
      result = data;
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
