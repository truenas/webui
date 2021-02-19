import * as _ from 'lodash';

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

  filterArrayFunction(item) {
    let result = true;
    if (typeof item === 'object') {
      let isAllEmpty = true;
      Object.values(item).forEach(value => {
        if (value !== undefined && value !== null && value !== '') {
          isAllEmpty = false;
        }
      });

      if (isAllEmpty) {
        result = false;
      }

    } else if (item === undefined || item === null || item === '') {
      result = false;
    }

    return result;
  }

  parseFormControlValues(data, result) {
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
    let result = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === undefined || value === null || value === '') {
        result[key] = value;
      } else if (Array.isArray(value)) {
        const arrayValues = value.map(item => {
          return this.changeNullString2Null(item);
        });
        result[key] = arrayValues;
      } else if (typeof value === 'object') {
        result[key] = this.changeNullString2Null(value);
      } else if (value === NULL_VALUE) {
        result[key] = null;
      } else {
        result[key] = value;
      }
    });

    return result;
  }
}
