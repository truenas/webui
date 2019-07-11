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
              _.indexOf(entity.conf.advanced_field, i) > 0 &&
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

  handleWSError(entity: any, res: any, dialogService?: any) {
    let dialog;
    if (dialogService) {
      dialog = dialogService;
    } else {
      if (entity) {
        dialog = entity.dialog;
      }
    }

    if (res.extra && entity.fieldConfig) {
      let scroll = false;
      for (let i = 0; i < res.extra.length; i++) {
        const field = res.extra[i][0].split('.').pop();
        const error = res.extra[i][1];
        const fc = _.find(entity.fieldConfig, {'name' : field});
        if (fc && !fc['isHidden']) {
          const element = document.getElementById(field);
          if (element) {
            if (entity.conf && entity.conf.advanced_field && 
              _.indexOf(entity.conf.advanced_field, field) > 0 &&
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
        } else {
          entity.error = error;
        }
      }
    } else {
      if (res.trace && res.trace.formatted && dialog) {
        dialog.errorReport(res.trace.class, res.reason, res.trace.formatted);
      } else if (res.state && res.error && res.exception && dialog) {
        dialog.errorReport(res.state, res.error, res.exception);
      } else {
        // if it can't print the error at least put it on the console.
        console.log(res);
      }
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
}
