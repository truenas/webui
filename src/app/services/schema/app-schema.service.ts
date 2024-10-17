import { Injectable } from '@angular/core';
import {
  Validators, AbstractControl, FormGroup, ValidatorFn,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { parseString } from 'cron-parser';
import { isArray, isEqual, isPlainObject } from 'lodash-es';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import {
  CommonSchemaAddControl,
  CommonSchemaTransform,
  FormControlPayload,
  FormListItemPayload,
  KeysRestoredFromFormGroup,
  SerializeFormValue,
} from 'app/interfaces/app-schema.interface';
import {
  ChartFormValue, ChartSchema, ChartSchemaNode, ChartSchemaNodeConf,
} from 'app/interfaces/app.interface';
import {
  DeleteListItemEvent, DynamicFormSchemaDict, DynamicFormSchemaNode, DynamicWizardSchema,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Relation } from 'app/interfaces/field-relation.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { Option } from 'app/interfaces/option.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import {
  CustomUntypedFormArray,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-array';
import {
  CustomUntypedFormControl,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-control';
import {
  CustomUntypedFormField,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { CustomUntypedFormGroup } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-group';
import { cronValidator } from 'app/modules/forms/ix-forms/validators/cron-validation';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FilesystemService } from 'app/services/filesystem.service';
import { findAppSchemaNode } from 'app/services/schema/app-schema.helpers';
import {
  isCommonSchemaType,
  transformBooleanSchemaType,
  transformCronSchemaType,
  transformDictSchemaType,
  transformHostPathSchemaType,
  transformIntSchemaType,
  transformIpaddrSchemaType,
  transformListSchemaType,
  transformPathSchemaType,
  transformStringSchemaType,
  transformTextSchemaType,
  transformUriSchemaType,
} from 'app/services/schema/app-schema.transformer';
import { UrlValidationService } from 'app/services/url-validation.service';

interface ToggleFieldHiddenOrDisabledValue {
  formField: CustomUntypedFormField;
  value: unknown;
  schema: ChartSchemaNodeConf;
  subquestion: ChartSchemaNode;
  isParentImmutable: boolean;
  isNew: boolean;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AppSchemaService {
  constructor(
    protected filesystemService: FilesystemService,
    private urlValidationService: UrlValidationService,
  ) {}

  transformNode(chartSchemaNode: ChartSchemaNode, isNew: boolean, isParentImmutable: boolean): DynamicFormSchemaNode[] {
    const schema = chartSchemaNode.schema;

    let newSchema: DynamicFormSchemaNode[] = [];
    const transformPayload: CommonSchemaTransform = {
      schema, chartSchemaNode, isNew, isParentImmutable, newSchema,
    };

    if (schema.hidden) {
      return newSchema;
    }

    if (isCommonSchemaType(schema.type)) {
      switch (schema.type) {
        case ChartSchemaType.Int:
          newSchema.push(transformIntSchemaType(transformPayload));
          break;
        case ChartSchemaType.Uri:
          newSchema.push(transformUriSchemaType(transformPayload));
          break;
        case ChartSchemaType.String:
          newSchema.push(transformStringSchemaType(transformPayload));
          break;
        case ChartSchemaType.Path:
          newSchema.push(transformPathSchemaType(transformPayload));
          break;
        case ChartSchemaType.Hostpath:
          newSchema.push(transformHostPathSchemaType(transformPayload, this.filesystemService));
          break;
        case ChartSchemaType.Ipaddr:
          newSchema.push(transformIpaddrSchemaType(transformPayload));
          break;
        case ChartSchemaType.Boolean:
          newSchema.push(transformBooleanSchemaType(transformPayload));
          break;
        case ChartSchemaType.Text:
          newSchema.push(transformTextSchemaType(transformPayload));
          break;
      }

      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          const objs = this.transformNode(subquestion, isNew, !!schema.immutable || isParentImmutable);
          objs.forEach((obj) => {
            obj.indent = true;
            obj.dependsOn = [chartSchemaNode.variable];
          });
          newSchema = newSchema.concat(objs);
        });
      }
    } else if (schema.type === ChartSchemaType.Dict) {
      if (transformPayload.chartSchemaNode.schema.attrs?.length) {
        newSchema.push(transformDictSchemaType(transformPayload, this.transformNode.bind(this)));
      }
    } else if (schema.type === ChartSchemaType.List) {
      newSchema.push(transformListSchemaType(transformPayload, this.transformNode.bind(this)));
    } else if (schema.type === ChartSchemaType.Cron) {
      newSchema.push(transformCronSchemaType(transformPayload));
    } else {
      console.error('Unsupported type = ', schema.type);
    }

    return newSchema;
  }

  getNewFormControlChangesSubscription(payload: FormControlPayload): Subscription {
    const { chartSchemaNode } = payload;
    const path = payload.path ? payload.path + '.' + chartSchemaNode.variable : chartSchemaNode.variable;
    const subscription = new Subscription();
    const schema = chartSchemaNode.schema;

    const addControlPayload: CommonSchemaAddControl = {
      ...payload, subscription, schema, path,
    };

    switch (true) {
      case isCommonSchemaType(schema.type):
        this.addCommonSchemaTypeControl(addControlPayload);
        break;
      case schema.type === ChartSchemaType.Dict:
        this.addDictSchemaTypeControl(addControlPayload);
        break;
      case schema.type === ChartSchemaType.List:
        this.addListSchemaTypeControl(addControlPayload);
        break;
      case schema.type === ChartSchemaType.Cron:
        this.addCronSchemaTypeControl(addControlPayload);
        break;
      default:
        console.error('Unsupported type = ', schema.type);
        break;
    }

    if (schema.hidden) {
      this.handleAddFormControlWithSchemaHidden(addControlPayload);
    }

    if (schema.show_if && !schema.hidden) {
      this.handleAddFormControlWithSchemaVisible(addControlPayload);
    }

    return subscription;
  }

  getControlName(control: AbstractControl): string | null {
    if (control.parent == null) {
      return null;
    }
    const children = control.parent.controls;

    if (Array.isArray(children)) {
      for (let index = 0; index < children.length; index++) {
        if (children[index] === control) {
          return `${index}`;
        }
      }
      return null;
    }
    return Object.keys(children).find((name) => control === children[name]) || null;
  }

  getControlPath(control: AbstractControl, path: string): string | null {
    path = this.getControlName(control) + path;

    if (control.parent && this.getControlName(control.parent)) {
      path = '.' + path;
      return this.getControlPath(control.parent, path);
    }
    return path;
  }

  addFormListItem(payload: FormListItemPayload): Subscription {
    const {
      event, isNew, isParentImmutable, config,
    } = payload;

    const subscriptionEvent = new Subscription();
    const itemFormGroup = new CustomUntypedFormGroup({});
    event.schema.forEach((item: ChartSchemaNode) => {
      subscriptionEvent.add(
        this.getNewFormControlChangesSubscription({
          isNew,
          chartSchemaNode: item,
          formGroup: itemFormGroup,
          config,
          isParentImmutable: isParentImmutable || !!item.schema.immutable,
        }),
      );
    });
    event.array.push(itemFormGroup);

    return subscriptionEvent;
  }

  deleteFormListItem(event: DeleteListItemEvent): void {
    event.array.removeAt(event.index);
  }

  checkIsValidSchedule(schedule: Schedule): boolean {
    return !!(schedule.month && schedule.hour && schedule.minute && schedule.dom && schedule.dow);
  }

  checkIsValidCrontab(crontab: string): boolean {
    return crontab && !Object.keys(parseString(crontab).errors).length;
  }

  serializeFormValue(
    data: SerializeFormValue,
    appSchema: ChartSchema['schema'],
    schemaNode: ChartSchemaNode = null,
    schemaPathToNode: string = Object.keys(data || {})?.[0],
  ): SerializeFormValue {
    if (data == null) {
      return data;
    }
    if (schemaNode?.schema?.type === ChartSchemaType.Cron && this.checkIsValidCrontab(data.toString())) {
      return crontabToSchedule(data.toString()) as SerializeFormValue;
    }
    if (Array.isArray(data)) {
      return this.serializeFormList(data, appSchema, schemaNode, schemaPathToNode);
    }
    if (typeof data === 'object') {
      return this.serializeFormGroup(data as HierarchicalObjectMap<ChartFormValue>, appSchema, schemaPathToNode);
    }

    return data;
  }

  serializeFormGroup(
    groupValue: HierarchicalObjectMap<ChartFormValue>,
    appSchema: ChartSchema['schema'],
    schemaPathToNode?: string,
  ): HierarchicalObjectMap<ChartFormValue> {
    const result = {} as HierarchicalObjectMap<ChartFormValue>;
    Object.keys(groupValue).forEach((key) => {
      const schemaPathToFind = `${schemaPathToNode}.${key}`;
      const schemaNode = findAppSchemaNode(appSchema?.questions, schemaPathToFind);

      result[key] = this.serializeFormValue(groupValue[key], appSchema, schemaNode, schemaPathToFind);

      if (result[key] === null) {
        if (schemaNode?.schema?.null) {
          return;
        }

        delete result[key];
      }
    });
    return result;
  }

  serializeFormList(
    list: HierarchicalObjectMap<ChartFormValue>[] | ChartFormValue[],
    appSchema: ChartSchema['schema'],
    schemaNode?: ChartSchemaNode,
    schemaPathToNode?: string,
  ): HierarchicalObjectMap<ChartFormValue>[] {
    return list.map((listItem: HierarchicalObjectMap<ChartFormValue>) => {
      // TODO: Consider refactoring.
      if (schemaNode?.schema?.items?.[0]?.schema?.type === ChartSchemaType.Dict) {
        return this.serializeFormGroup(listItem, appSchema, schemaPathToNode);
      }

      return this.serializeFormValue(listItem[Object.keys(listItem)[0]], appSchema, schemaNode, schemaPathToNode);
    }) as HierarchicalObjectMap<ChartFormValue>[];
  }

  /**
   * Restores keys from a form group
   * @param config Object without keys. Example: { objectList: [{ nestedList: ['test4', 'test5'] }] }
   * @param form Form group to restore keys from
   * @returns Object with keys. Example: { objectList: [{ key2: 'test4' }, { key2: 'test5' }] }
   */
  restoreKeysFromFormGroup(
    config: HierarchicalObjectMap<ChartFormValue>,
    form: FormGroup,
  ): HierarchicalObjectMap<ChartFormValue> {
    let newConfig = {} as HierarchicalObjectMap<ChartFormValue>;
    for (const [keyConfig, valueConfig] of Object.entries(config)) {
      const formConfig = form.controls?.[keyConfig] as FormGroup;
      const restoreKeysPayload: KeysRestoredFromFormGroup = {
        newConfig, formConfig, keyConfig, valueConfig,
      };

      if (!formConfig) {
        continue;
      }

      if (valueConfig && this.checkIsValidSchedule(valueConfig as Schedule)) {
        newConfig[keyConfig] = scheduleToCrontab(valueConfig as Schedule);
      } else if (isArray(valueConfig)) {
        newConfig = this.createHierarchicalObjectFromArray(restoreKeysPayload);
      } else if (isPlainObject(valueConfig)) {
        newConfig = this.createHierarchicalObjectFromPlainObject(restoreKeysPayload);
      } else {
        newConfig[keyConfig] = valueConfig;
      }
    }

    return newConfig;
  }

  getSearchOptions(dynamicSchema: DynamicWizardSchema[], formValue: HierarchicalObjectMap<ChartFormValue>): Option[] {
    let options: Option[] = [];
    dynamicSchema.forEach((section) => {
      section.schema.forEach((item) => {
        if (item.type !== DynamicFormSchemaType.Dict) {
          if (item.title && formValue?.[item.controlName] !== undefined) {
            options.push({ label: item.title, value: item.controlName });
          }
        } else if (formValue?.[item.controlName] !== undefined) {
          options = options.concat(
            this.getSearchOptionsFromDict(
              item,
              formValue?.[item.controlName] as HierarchicalObjectMap<ChartFormValue>,
              item.controlName,
            ),
          );
        }
      });
    });
    return options;
  }

  private getSearchOptionsFromDict(
    dict: DynamicFormSchemaDict,
    formValue: HierarchicalObjectMap<ChartFormValue>,
    valuePrefix: string,
  ): Option[] {
    let options: Option[] = [];
    dict.attrs.forEach((item) => {
      if (item.type !== DynamicFormSchemaType.Dict) {
        if (item.title && formValue?.[item.controlName] !== undefined) {
          options.push({ label: item.title, value: `${valuePrefix}.${item.controlName}` });
        }
      } else {
        options = options.concat(
          this.getSearchOptionsFromDict(
            item,
            formValue?.[item.controlName] as HierarchicalObjectMap<ChartFormValue>,
            `${valuePrefix}.${item.controlName}`,
          ),
        );
      }
    });
    return options;
  }

  private createHierarchicalObjectFromArray(payload: KeysRestoredFromFormGroup): HierarchicalObjectMap<ChartFormValue> {
    const {
      newConfig, keyConfig, valueConfig, formConfig,
    } = payload;

    newConfig[keyConfig] = (valueConfig as ChartFormValue[]).map((valueItem, idxItem) => {
      if (isPlainObject(valueItem)) {
        return this.restoreKeysFromFormGroup(
          valueItem as HierarchicalObjectMap<ChartFormValue>,
          formConfig.controls[idxItem] as FormGroup,
        );
      }
      const keyItem = Object.keys((formConfig.value as unknown[])[idxItem])[0];
      return { [keyItem]: valueItem };
    });

    return newConfig;
  }

  private createHierarchicalObjectFromPlainObject(
    payload: KeysRestoredFromFormGroup,
  ): HierarchicalObjectMap<ChartFormValue> {
    const {
      newConfig, keyConfig, valueConfig, formConfig,
    } = payload;

    newConfig[keyConfig] = this.restoreKeysFromFormGroup(
      valueConfig as HierarchicalObjectMap<ChartFormValue>,
      formConfig,
    );

    return newConfig;
  }

  private addCommonSchemaTypeControl(payload: CommonSchemaAddControl): void {
    const {
      schema, isNew, formGroup, isParentImmutable, chartSchemaNode,
    } = payload;

    let altDefault: string | boolean | number = '';
    if (schema.type === ChartSchemaType.Int) {
      altDefault = null;
    } else if (schema.type === ChartSchemaType.Boolean) {
      altDefault = false;
    }

    const defaultValue = isNew && schema.default !== undefined ? schema.default : altDefault;
    const newFormControl = new CustomUntypedFormControl(
      defaultValue,
      this.buildSchemaControlValidator(defaultValue, schema),
    );

    this.handleSchemaSubQuestions(payload, newFormControl);

    formGroup.addControl(chartSchemaNode.variable, newFormControl);

    if (!isNew && (isParentImmutable || !!schema.immutable)) {
      newFormControl.disable();
    }
  }

  private addCronSchemaTypeControl(payload: CommonSchemaAddControl): void {
    const { schema, formGroup, chartSchemaNode } = payload;

    const defaultDaily = {
      dom: '*',
      dow: '*',
      hour: '0',
      minute: '0',
      month: '*',
    };

    const newFormControl = new CustomUntypedFormControl(
      scheduleToCrontab(schema.default || defaultDaily),
      this.buildSchemaControlValidator(defaultDaily, schema),
    );

    formGroup.addControl(chartSchemaNode.variable, newFormControl);
  }

  private addDictSchemaTypeControl(payload: CommonSchemaAddControl): void {
    const {
      schema, isNew, path, subscription, formGroup, config, isParentImmutable, chartSchemaNode,
    } = payload;

    formGroup.addControl(
      chartSchemaNode.variable,
      new CustomUntypedFormGroup({}, this.buildSchemaControlValidator({}, schema)),
    );

    for (const attr of schema.attrs) {
      subscription.add(
        this.getNewFormControlChangesSubscription({
          isNew,
          path,
          chartSchemaNode: attr,
          formGroup: formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormGroup,
          config,
          isParentImmutable: isParentImmutable || !!schema.immutable,
        }),
      );
    }
  }

  private addListSchemaTypeControl(payload: CommonSchemaAddControl): void {
    const {
      schema, isNew, subscription, formGroup, config, isParentImmutable, chartSchemaNode,
    } = payload;

    formGroup.addControl(
      chartSchemaNode.variable,
      new CustomUntypedFormArray([], this.buildSchemaControlValidator({}, schema)),
    );

    if (config) {
      let items: ChartSchemaNode[] = [];
      chartSchemaNode.schema.items.forEach((item) => {
        if (item.schema.attrs) {
          item.schema.attrs.forEach((attr) => {
            items = items.concat(attr);
          });
        } else {
          items = items.concat(item);
        }
      });

      const configControlPath = this.getControlPath(formGroup.controls[chartSchemaNode.variable], '').split('.');
      let nextItem = config;
      for (const controlPath of configControlPath) {
        if (nextItem) {
          nextItem = nextItem[controlPath] as HierarchicalObjectMap<ChartFormValue>;
        }
      }

      if (Array.isArray(nextItem)) {
        for (const item of nextItem) {
          subscription.add(
            this.addFormListItem({
              isNew,
              event: {
                array: formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormArray,
                schema: items,
              },
              isParentImmutable: isParentImmutable || !!schema.immutable,
              config: item as HierarchicalObjectMap<ChartFormValue>,
            }),
          );
        }
      }
    }
  }

  private handleAddFormControlWithSchemaHidden(payload: CommonSchemaAddControl): void {
    const { formGroup, chartSchemaNode } = payload;

    const formField = formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField;

    /**
     * There's no need to emit it as hidden$ = true since it's static and cannot be changed.
     * Reason: It will be removed during the "app.update" query, which is incorrect.
     * We can just disable the field and don't emit hidden$.next(true).
     */
    formField.disable();
  }

  private handleAddFormControlWithSchemaVisible(payload: CommonSchemaAddControl): void {
    const { schema, subscription } = payload;

    const relations: Relation[] = schema.show_if.map((item) => ({
      fieldName: item[0],
      operatorName: item[1],
      operatorValue: item[2],
    }));

    relations.forEach((relation) => {
      if (relation.operatorName === '=') {
        subscription.add(
          timer(0).pipe(take(1)).subscribe(() => this.handleEqualOperatorNameSubscription(payload, relation)),
        );
      }
      if (relation.operatorName === '!=') {
        subscription.add(
          timer(0).pipe(take(1)).subscribe(() => this.handleNonEqualOperatorNameSubscription(payload, relation)),
        );
      }
    });
  }

  private handleEqualOperatorNameSubscription(payload: CommonSchemaAddControl, relation: Relation): void {
    const {
      schema, isNew, subscription, formGroup, isParentImmutable, chartSchemaNode,
    } = payload;

    if (!isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
      const formField = formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField;
      if (!formField.hidden$) {
        formField.hidden$ = new BehaviorSubject<boolean>(false);
      }
      formField.hidden$.next(true);
      formField.disable();
      formField.clearValidators();
    }

    subscription.add(formGroup.controls[relation.fieldName].valueChanges.pipe(debounceTime(0)).subscribe((value) => {
      const parentControl = formGroup.controls[chartSchemaNode.variable].parent as CustomUntypedFormField;
      if (!parentControl.hidden$) {
        parentControl.hidden$ = new BehaviorSubject<boolean>(false);
      }

      parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
        if (!isParentHidden) {
          const formField = formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField;
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject<boolean>(false);
          }
          if (isEqual(value, relation.operatorValue) && formGroup.controls[relation.fieldName].status !== 'DISABLED') {
            formField.hidden$.next(false);
            if (!isNew && (isParentImmutable || !!schema.immutable)) {
              formField.disable();
            } else {
              formField.enable();
            }
          } else {
            formField.hidden$.next(true);
            formField.disable();
          }
        }
      });
    }));
  }

  private handleNonEqualOperatorNameSubscription(payload: CommonSchemaAddControl, relation: Relation): void {
    const {
      schema, isNew, subscription, formGroup, isParentImmutable, chartSchemaNode,
    } = payload;

    if (isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
      const formField = formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField;
      if (!formField.hidden$) {
        formField.hidden$ = new BehaviorSubject<boolean>(false);
      }
      formField.hidden$.next(true);
      formField.disable();
      formField.clearValidators();
    }

    subscription.add(formGroup.controls[relation.fieldName].valueChanges.pipe(debounceTime(0)).subscribe((value) => {
      const parentControl = formGroup.controls[chartSchemaNode.variable].parent as CustomUntypedFormField;
      if (!parentControl.hidden$) {
        parentControl.hidden$ = new BehaviorSubject<boolean>(false);
      }

      parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
        if (!isParentHidden) {
          const formField = formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField;
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject<boolean>(false);
          }
          if (!isEqual(value, relation.operatorValue) && formGroup.controls[relation.fieldName].status !== 'DISABLED') {
            formField.hidden$.next(false);
            if (!isNew && (isParentImmutable || !!schema.immutable)) {
              formField.disable();
            } else {
              formField.enable();
            }
          } else {
            formField.hidden$.next(true);
            formField.disable();
          }
        }
      });
    }));
  }

  private handleSchemaSubQuestions({
    schema,
    isNew,
    path,
    subscription,
    formGroup,
    config,
    isParentImmutable,
  }: CommonSchemaAddControl, newFormControl: CustomUntypedFormControl): void {
    if (!schema.subquestions) {
      return;
    }

    for (const subquestion of schema.subquestions) {
      subscription.add(
        this.getNewFormControlChangesSubscription({
          isNew,
          path,
          chartSchemaNode: subquestion,
          formGroup,
          config,
          isParentImmutable: !!schema.immutable || isParentImmutable,
        }),
      );

      const formField = formGroup.controls[subquestion.variable] as CustomUntypedFormField;
      this.toggleFieldHiddenOrDisabled({
        value: newFormControl.value,
        formField,
        schema,
        subquestion,
        isParentImmutable,
        isNew,
      });
    }

    subscription.add(newFormControl.valueChanges.subscribe((value: unknown) => {
      for (const subquestion of schema.subquestions) {
        const parentControl = formGroup.controls[subquestion.variable].parent as CustomUntypedFormField;
        if (!parentControl.hidden$) {
          parentControl.hidden$ = new BehaviorSubject<boolean>(false);
        }

        parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
          if (!isParentHidden) {
            const formField = formGroup.controls[subquestion.variable] as CustomUntypedFormField;
            this.toggleFieldHiddenOrDisabled({
              formField,
              value,
              schema,
              subquestion,
              isParentImmutable,
              isNew,
            });
          }
        });
      }
    }));
  }

  private toggleFieldHiddenOrDisabled(fieldValue: ToggleFieldHiddenOrDisabledValue): void {
    const {
      formField, value, schema, subquestion, isNew, isParentImmutable,
    } = fieldValue;

    if (!formField.hidden$) {
      formField.hidden$ = new BehaviorSubject<boolean>(false);
    }

    if (value === schema.show_subquestions_if) {
      formField.hidden$.next(false);
      formField.enable();
    } else {
      formField.hidden$.next(true);
      formField.disable();
    }

    if (subquestion && !isNew && (isParentImmutable || schema.immutable || subquestion.schema.immutable)) {
      formField.disable();
    }
  }

  private buildSchemaControlValidator(defaultValue: unknown, schema: ChartSchemaNodeConf): ValidatorFn[] {
    const nullValidator = Validators.nullValidator;
    const isValidCrontab = this.checkIsValidCrontab(defaultValue?.toString());

    return [
      (schema.required || (!schema.empty && schema.empty !== undefined)) ? Validators.required : nullValidator,
      schema.max ? Validators.max(schema.max) : nullValidator,
      schema.min ? Validators.min(schema.min) : nullValidator,
      schema.max_length ? Validators.maxLength(schema.max_length) : nullValidator,
      schema.min_length ? Validators.minLength(schema.min_length) : nullValidator,
      schema.type === ChartSchemaType.Uri ? Validators.pattern(this.urlValidationService.urlRegex) : nullValidator,
      schema.type === ChartSchemaType.String && schema.default && isValidCrontab ? cronValidator() : nullValidator,
    ];
  }
}
