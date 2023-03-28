// eslint-disable-next-line @typescript-eslint/naming-convention
export const NULL_VALUE = 'null_value';

export type ItemBeforeFlattening = {
  id: string | number;
  children?: ItemBeforeFlattening[];
  [key: string]: unknown;
};

type DataBeforeFlattening = ItemBeforeFlattening | ItemBeforeFlattening[];

export interface FlattenedData extends Record<string, unknown> {
  _level?: number;
  _parent?: string | number;
}

/**
 * TODO: Likely outdated.
 */
// interface HttpError {
//   code: number;
//   error: {
//     [field: string]: string[];
//   };
// }

export class EntityUtils {
  // // TODO: error is probably of type HttpError
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // handleError(entity: any, error: any): void {
  //   if (error.code === 409) {
  //     this.handleObjError(entity, error);
  //   } else if (error.code === 400) {
  //     if (typeof error.error === 'object') {
  //       this.handleObjError(entity, error);
  //     } else {
  //       entity.error = error.error;
  //     }
  //   } else if (error.code === 500) {
  //     if (error.error.error_message) {
  //       entity.error = error.error.error_message;
  //     } else {
  //       entity.error = 'Server error: ' + error.error;
  //     }
  //   } else {
  //     entity.error = 'Fatal error! Check logs.';
  //     console.error('Unknown error code', error.code);
  //   }
  // }

  // handleObjError(entity: EntityErrorHandler, error: HttpError): void {
  //   let scroll = false;
  //   entity.error = '';
  //   Object.keys(error.error).forEach((i) => {
  //     const field = error.error[i];
  //     const fc = _.find(entity.fieldConfig, { name: i });
  //     if (fc) {
  //       const element = document.getElementById(i);
  //       if (element) {
  //         if (entity.conf && entity.conf.advancedFields
  //           && _.indexOf(entity.conf.advancedFields, i) > -1
  //           && entity.conf.isBasicMode) {
  //           entity.conf.isBasicMode = false;
  //         }
  //         if (!scroll) {
  //           element.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
  //           scroll = true;
  //         }
  //       }
  //       let errors = '';
  //       field.forEach((item: string) => { errors += item + ' '; });
  //       fc.hasErrors = true;
  //       fc.errors = errors;
  //     } else if (typeof field === 'string') {
  //       entity.error = field;
  //     } else {
  //       field.forEach((item: string) => { entity.error += item + '<br />'; });
  //     }
  //   });
  // }

  // // eslint-disable-next-line sonarjs/cognitive-complexity
  // handleWsError(
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   entity: any,
  //   errorOrJob: WebsocketError | Job,
  //   dialogService?: DialogService,
  //   targetFieldConfig?: FieldConfig[],
  // ): void {
  //   let dialog: DialogService;
  //   if (dialogService) {
  //     dialog = dialogService;
  //   } else if (entity) {
  //     dialog = entity.dialog;
  //   }
  //   if ('exc_info' in errorOrJob && errorOrJob.exc_info?.extra) {
  //     errorOrJob.extra = errorOrJob.exc_info.extra as Record<string, unknown>;
  //   }

  //   if (
  //     'extra' in errorOrJob
  //     && errorOrJob.extra &&
  //     (targetFieldConfig || entity.fieldConfig || entity.wizardConfig)
  //  ) {
  //     let scroll = false;
  //     if ((errorOrJob as Job).extra.excerpt) {
  //       this.errorReport(errorOrJob, dialog);
  //     } else if (Array.isArray(errorOrJob.extra)) {
  //       errorOrJob.extra.forEach((extraItem) => {
  //         const field = extraItem[0].split('.')[1];
  //         const error = extraItem[1];

  //         let fc = _.find(entity.fieldConfig, { name: field });
  //         let stepIndex;
  //         if (entity.wizardConfig) {
  //           _.find(entity.wizardConfig, (step, index) => {
  //             stepIndex = index;
  //             fc = _.find(step.fieldConfig, { name: field });
  //             return fc;
  //           });
  //         }
  //         if (targetFieldConfig) {
  //           fc = _.find(targetFieldConfig, { name: field });
  //         }

  //         if (fc && !fc.isHidden) {
  //           const element = document.getElementById(field);
  //           if (element) {
  //             if (
  //               entity.conf && entity.conf.advancedFields
  //               && _.indexOf(entity.conf.advancedFields, field) > -1
  //               && entity.conf.isBasicMode
  //             ) {
  //               entity.conf.isBasicMode = false;
  //             }
  //             if (!scroll) {
  //               element.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
  //               scroll = true;
  //             }
  //           }
  //           fc.hasErrors = true;
  //           fc.errors = error;
  //           if (entity.wizardConfig && entity.entityWizard) {
  //             entity.entityWizard.stepper.selectedIndex = stepIndex;
  //           }
  //         } else if (entity.error) {
  //           entity.error = error;
  //         } else {
  //           this.errorReport(errorOrJob, dialog);
  //         }
  //       });
  //     } else {
  //       this.errorReport(errorOrJob, dialog);
  //     }
  //   } else {
  //     this.errorReport(errorOrJob, dialog);
  //   }
  // }

  // errorReport(errorOrJob: WebsocketError | Job, dialog: DialogService): void {
  //   if ('trace' in errorOrJob && errorOrJob.trace?.formatted && dialog) {
  //     dialog.errorReport(errorOrJob.trace.class, errorOrJob.reason, errorOrJob.trace.formatted);
  //   } else if ('state' in errorOrJob && errorOrJob.error && errorOrJob.exception && dialog) {
  //     dialog.errorReport(errorOrJob.state, errorOrJob.error, errorOrJob.exception);
  //   } else {
  //     // if it can't print the error at least put it on the console.
  //     console.error(errorOrJob);
  //   }
  // }

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
        .map((element) => dowOptions[Number(element)] || element)
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
      result = data.map((item) => this.changeNullString2Null(item));
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
}
