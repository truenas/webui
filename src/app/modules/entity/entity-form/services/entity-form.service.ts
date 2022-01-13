import { Inject, Injectable } from '@angular/core';
import {
  AbstractControl, FormArray, FormBuilder, FormControl, FormGroup,
} from '@angular/forms';
import { TreeNode } from '@circlon/angular-tree-component';
import * as _ from 'lodash';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { ListdirChild } from 'app/interfaces/listdir-child.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { FieldType } from 'app/modules/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import {
  FieldConfig,
  FormArrayConfig,
  FormDictConfig,
  FormListConfig,
  InputUnitConfig,
  UnitType,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable()
export class EntityFormService {
  durationRegex = /^\s*((MINUTE|HOUR|DAY|WEEK|MONTH|YEAR){1}(S)?)|((M|h|d|w|m|y){1})\s*$/;
  sizeRegex = /^\s*(KIB|MIB|GIB|TIB|PIB|KB|MB|GB|TB|PB|K|M|G|T|P){1}\s*$/;

  shortDurationUnit = {
    M: 'MINUTE',
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    m: 'MONTH',
    y: 'YEAR',
  };

  defaultUnit = {
    size: 'KIB',
    duration: 'MINUTE',
  };
  constructor(
    @Inject(FormBuilder) private formBuilder: FormBuilder,
    protected ws: WebSocketService,
  ) {}

  createFormGroup(controls: FieldConfig[]): FormGroup {
    const formGroup: { [id: string]: AbstractControl } = {};

    if (controls) {
      controls.forEach((control) => {
        const formControl = this.createFormControl(control);

        if (formControl) {
          formGroup[control.name] = formControl;
        }

        // TODO: See if check was supposed to be for `control.relation`.
        if (control) {
          control.relation = Array.isArray(control.relation) ? control.relation : [];
        }
      });
    }

    return this.formBuilder.group(formGroup);
  }

  createFormControl(fieldConfig: FieldConfig): AbstractControl {
    let formControl: AbstractControl;
    const arrayConfig = fieldConfig as FormArrayConfig;
    const listConfig = fieldConfig as FormListConfig;
    const dictConfig = fieldConfig as FormDictConfig;

    if (fieldConfig) {
      if (arrayConfig.formarray) {
        if (arrayConfig.initialCount == null) {
          arrayConfig.initialCount = 1;
        }
        formControl = this.createFormArray(arrayConfig.formarray, arrayConfig.initialCount);
      } else if (listConfig.listFields) {
        formControl = this.formBuilder.array([]);
        listConfig.listFields.forEach((listField) => {
          (formControl as FormArray).push(this.createFormGroup(listField));
        });
      } else if (dictConfig.subFields) {
        formControl = this.createFormGroup(dictConfig.subFields);
      } else if (fieldConfig.type != 'label') {
        formControl = new FormControl(
          { value: fieldConfig.value, disabled: fieldConfig.disabled },
          fieldConfig.type === 'input-list' as FieldType ? [] : fieldConfig.validation,
          fieldConfig.asyncValidation,
        );
      }
    }

    return formControl;
  }

  createFormArray(controls: FieldConfig[], initialCount: number): FormArray {
    const formArray = this.formBuilder.array([]);

    for (let i = 0; i < initialCount; i++) {
      const subFormGroup = this.createFormGroup(controls);
      formArray.push(subFormGroup);
    }
    return formArray;
  }

  insertFormArrayGroup(index: number, formArray: FormArray, controls: FieldConfig[]): void {
    const formGroup = this.createFormGroup(controls);
    formArray.insert(index, formGroup);
  }

  removeFormArrayGroup(index: number, formArray: FormArray): void {
    formArray.removeAt(index);
  }

  /**
   * @deprecated Use FilesystemService.getFilesystemNodeProvider for all new code.
   */
  getFilesystemListdirChildren(
    node: TreeNode,
    explorerType?: ExplorerType,
    showHiddenFiles = false,
  ): Promise<ListdirChild[]> {
    let typeFilter: [QueryFilter<FileRecord>?] = [];
    if (explorerType === ExplorerType.Directory) {
      typeFilter = [['type', '=', FileType.Directory]];
    }

    return this.ws.call('filesystem.listdir', [node.data.name, typeFilter,
      { order_by: ['name'], limit: 1000 }]).toPromise().then((res) => {
      res = _.sortBy(res, (o) => o.name.toLowerCase());

      const children: ListdirChild[] = [];
      res.forEach((file) => {
        if (file.type === FileType.Symlink || !file.hasOwnProperty('name')) {
          return;
        }

        if (!showHiddenFiles && file.name.startsWith('.')) {
          return;
        }

        children.push({
          name: file.path,
          acl: file.acl,
          hasChildren: file.type === FileType.Directory,
          subTitle: file.name,
        });
      });
      if (children.length === 0) {
        node.data.hasChildren = false;
      }
      return children;
    });
  }

  getPoolDatasets(param: [DatasetType[]?] = []): Promise<ListdirChild[]> {
    const nodes: ListdirChild[] = [];
    return this.ws.call('pool.filesystem_choices', param).toPromise().then((res) => {
      res.forEach((filesystem) => {
        const pathArr = filesystem.split('/');
        if (pathArr.length === 1) {
          const node: ListdirChild = {
            name: filesystem,
            subTitle: pathArr[0],
            hasChildren: false,
            children: [],
          };
          nodes.push(node);
        } else {
          let parent = _.find(nodes, { name: pathArr[0] });
          let j = 1;
          while (_.find(parent.children, { subTitle: pathArr[j] })) {
            parent = _.find(parent.children, { subTitle: pathArr[j++] });
          }
          const node: ListdirChild = {
            name: filesystem,
            subTitle: pathArr[j],
            hasChildren: false,
            children: [],
          };
          parent.children.push(node);
          parent.hasChildren = true;
        }
      });
      return nodes;
    });
  }

  clearFormError(fieldConfig: FieldConfig[]): void {
    fieldConfig.forEach((config) => {
      config['errors'] = '';
      config['hasErrors'] = false;
    });
  }

  phraseInputData(value: any, config: InputUnitConfig): string | number {
    if (!value) {
      return value;
    }
    let num = 0;
    let unit = '';

    value = value.replace(/\s+/g, '');

    // get leading number
    let match = [];
    if (config.decimal === undefined || config.decimal) {
      match = value.match(/^(\d+(\.\d+)?)/);
    } else {
      match = value.match(/^(\d+)/);
    }

    if (match && match.length > 0) {
      num = match[1];
    } else {
      return NaN;
    }

    // get unit and return phrased string
    unit = value.replace(num, '');
    if (unit === '') {
      if (config.default) {
        unit = config.default;
      } else {
        unit = config.allowUnits ? config.allowUnits[0] : this.defaultUnit[config.type];
      }
    }
    if (config.allowUnits !== undefined) {
      config.allowUnits.forEach((item) => item.toUpperCase());
    }
    // do uppercase except when type is duration and unit is only one character (M is for minutes while m is for month)
    unit = (config.type === UnitType.Size || unit.length > 1) ? unit.toUpperCase() : unit;
    const matchUnits = unit.match(config.type === UnitType.Size ? this.sizeRegex : this.durationRegex);

    if (matchUnits && matchUnits[0] === unit) {
      const humanReableUnit = this.getHumanReadableUnit(num, unit, config.type);
      if (config.allowUnits) {
        const singleUnit = _.endsWith(humanReableUnit, 'S') ? humanReableUnit.substring(0, humanReableUnit.length - 1) : humanReableUnit;
        if (_.indexOf(config.allowUnits, singleUnit) < 0) {
          return NaN;
        }
      }
      return num + ' ' + humanReableUnit;
    }
    return NaN;
  }

  getHumanReadableUnit(num: number, unit: string, type: UnitType): string {
    if (type === UnitType.Duration) {
      let readableUnit = unit.length > 1 ? unit : (this.shortDurationUnit as any)[unit];
      if (num <= 1 && _.endsWith(readableUnit, 'S')) {
        readableUnit = readableUnit.substring(0, readableUnit.length - 1);
      } else if (num > 1 && !_.endsWith(readableUnit, 'S')) {
        readableUnit += 'S';
      }
      return readableUnit;
    }
    if (type === UnitType.Size) {
      return unit[0] + 'iB';
    }
  }
}
