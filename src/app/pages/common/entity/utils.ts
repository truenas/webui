import * as _ from 'lodash';

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

    if (res.extra && (targetFieldConfig || entity.fieldConfig || entity.wizardConfig)) {
      let scroll = false;
      if (res.extra.excerpt) {
        this.errorReport(res, dialog);
      }
      for (let i = 0; i < res.extra.length; i++) {
        const field = res.extra[i][0].split('.').pop();
        const error = res.extra[i][1];

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
          if (entity.formGroup && entity.formGroup.controls[field]) {
            entity.formGroup.controls[field].setErrors({'invalidValue': true});
          }
          if (entity.wizardConfig && entity.entityWizard) {
            entity.entityWizard.stepper.selectedIndex = stepIndex;
            entity.entityWizard.formGroup.controls.formArray.controls[stepIndex].controls[field].setErrors({'invalidValue': true});
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
}
