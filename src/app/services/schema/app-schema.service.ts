import { Injectable } from '@angular/core';
import { Validators, AbstractControl, FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import {
  CommonSchemaAddControl,
  CommonSchemaTransform,
  FormControlPayload,
  FormListItemPayload,
  KeysRestoredFromFormGroup,
  SerializeFormValue,
} from 'app/interfaces/app-schema.interface';
import { ChartFormValue, ChartSchema, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DeleteListItemEvent, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { Relation } from 'app/modules/entity/entity-form/models/field-relation.interface';
import {
  CustomUntypedFormArray,
} from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-array';
import {
  CustomUntypedFormControl,
} from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-control';
import {
  CustomUntypedFormField,
} from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { CustomUntypedFormGroup } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-group';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FilesystemService } from 'app/services/filesystem.service';
import { findSchemaNode } from 'app/services/schema/app-schema.helpers';
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
  transformUriSchemaType,
} from 'app/services/schema/app-shema.transformer';

const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AppSchemaService {
  constructor(protected filesystemService: FilesystemService) {}

  transformNode(chartSchemaNode: ChartSchemaNode, isNew: boolean, isParentImmutable: boolean): DynamicFormSchemaNode[] {
    const schema = chartSchemaNode.schema;
    let newSchema: DynamicFormSchemaNode[] = [];
    const transformPayload: CommonSchemaTransform = {
      schema, chartSchemaNode, isNew, isParentImmutable, newSchema,
    };

    if (schema.hidden) { return newSchema; }

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
      newSchema.push(transformDictSchemaType(transformPayload, this.transformNode.bind(this)));
    } else if (schema.type === ChartSchemaType.List) {
      newSchema.push(transformListSchemaType(transformPayload, this.transformNode.bind(this)));
    } else if (schema.type === ChartSchemaType.Cron) {
      newSchema.push(transformCronSchemaType(transformPayload));
    } else {
      console.error('Unsupported type = ', schema.type);
    }

    return newSchema;
  }

  addFormControls(payload: FormControlPayload): Subscription {
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
        this.addFormControls({
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

  checkIsValidCronTab(crontab: string): boolean {
    return !!crontab.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[a-z]{3}(,[a-z]{3}){0,10}) ?){5})$/);
  }

  checkIsValidSchedule(schedule: Schedule): boolean {
    return !!(schedule.month && schedule.hour && schedule.minute && schedule.dom && schedule.dow);
  }

  serializeFormValue(
    data: SerializeFormValue,
    schema: ChartSchema['schema'],
    fieldSchemaNode?: ChartSchemaNode,
  ): SerializeFormValue {
    if (data == null) {
      return data;
    }
    if (fieldSchemaNode?.schema?.type === ChartSchemaType.Cron && this.checkIsValidCronTab(data.toString())) {
      return crontabToSchedule(data.toString()) as SerializeFormValue;
    }
    if (Array.isArray(data)) {
      return this.serializeFormList(data, schema);
    }
    if (typeof data === 'object') {
      return this.serializeFormGroup(data as HierarchicalObjectMap<ChartFormValue>, schema);
    }
    return data;
  }

  serializeFormGroup(
    groupValue: HierarchicalObjectMap<ChartFormValue>,
    schema: ChartSchema['schema'],
  ): HierarchicalObjectMap<ChartFormValue> {
    const result = {} as HierarchicalObjectMap<ChartFormValue>;
    Object.keys(groupValue).forEach((key) => {
      const fieldSchemaNode = findSchemaNode(schema?.questions, key);

      result[key] = this.serializeFormValue(
        groupValue[key],
        schema,
        fieldSchemaNode,
      ) as HierarchicalObjectMap<ChartFormValue>;

      if (result[key] === null) {
        if (fieldSchemaNode?.schema?.null) {
          return;
        }

        delete result[key];
      }
    });
    return result;
  }

  serializeFormList(
    list: HierarchicalObjectMap<ChartFormValue>[] | ChartFormValue[],
    schema: ChartSchema['schema'],
  ): HierarchicalObjectMap<ChartFormValue>[] {
    return list.map((listItem: HierarchicalObjectMap<ChartFormValue>) => {
      if (Object.keys(listItem).length > 1) {
        return this.serializeFormValue(listItem, schema);
      }
      return this.serializeFormValue(listItem[Object.keys(listItem)[0]], schema);
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

      if (!formConfig) { continue; }

      if (valueConfig && this.checkIsValidSchedule(valueConfig as Schedule)) {
        newConfig[keyConfig] = scheduleToCrontab(valueConfig as Schedule);
      } else if (_.isArray(valueConfig)) {
        newConfig = this.createHierarchicalObjectFromArray(restoreKeysPayload);
      } else if (_.isPlainObject(valueConfig)) {
        newConfig = this.createHierarchicalObjectFromPlainObject(restoreKeysPayload);
      } else {
        newConfig[keyConfig] = valueConfig;
      }
    }

    return newConfig;
  }

  private createHierarchicalObjectFromArray(
    payload: KeysRestoredFromFormGroup,
  ): HierarchicalObjectMap<ChartFormValue> {
    const {
      newConfig, keyConfig, valueConfig, formConfig,
    } = payload;

    newConfig[keyConfig] = (valueConfig as ChartFormValue[]).map((valueItem, idxItem) => {
      if (_.isPlainObject(valueItem)) {
        return this.restoreKeysFromFormGroup(
          valueItem as HierarchicalObjectMap<ChartFormValue>,
          formConfig.controls[idxItem] as FormGroup,
        );
      }
      const keyItem = Object.keys(formConfig.value[idxItem])[0];
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

    const defaultValue = schema.default !== undefined ? schema.default : altDefault;

    const newFormControl = new CustomUntypedFormControl(defaultValue, [
      schema.required ? Validators.required : Validators.nullValidator,
      schema.max ? Validators.max(schema.max) : Validators.nullValidator,
      schema.min ? Validators.min(schema.min) : Validators.nullValidator,
      schema.max_length ? Validators.maxLength(schema.max_length) : Validators.nullValidator,
      schema.min_length ? Validators.minLength(schema.min_length) : Validators.nullValidator,
      schema.type === ChartSchemaType.Uri ? Validators.pattern(urlRegex) : Validators.nullValidator,
    ]);

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

    const newFormControl = new CustomUntypedFormControl(scheduleToCrontab(schema.default || defaultDaily));
    formGroup.addControl(chartSchemaNode.variable, newFormControl);
  }

  private addDictSchemaTypeControl(payload: CommonSchemaAddControl): void {
    const {
      schema, isNew, path, subscription, formGroup, config, isParentImmutable, chartSchemaNode,
    } = payload;

    formGroup.addControl(chartSchemaNode.variable, new CustomUntypedFormGroup({}));
    for (const attr of schema.attrs) {
      subscription.add(
        this.addFormControls({
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

    formGroup.addControl(chartSchemaNode.variable, new CustomUntypedFormArray([]));

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
              config: item,
            }),
          );
        }
      }
    }
  }

  private handleAddFormControlWithSchemaHidden(payload: CommonSchemaAddControl): void {
    const { formGroup, chartSchemaNode } = payload;

    const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
    if (!formField.hidden$) {
      formField.hidden$ = new BehaviorSubject<boolean>(false);
    }
    formField.hidden$.next(true);
    formField.disable();
  }

  private handleAddFormControlWithSchemaVisible(payload: CommonSchemaAddControl): void {
    const { schema, formGroup } = payload;

    const relations: Relation[] = schema.show_if.map((item) => ({
      fieldName: item[0],
      operatorName: item[1],
      operatorValue: item[2],
    }));
    relations.forEach((relation) => {
      let control = formGroup.controls[relation.fieldName];
      if (!control) {
        formGroup.addControl(relation.fieldName, new CustomUntypedFormControl());
        control = formGroup.controls[relation.fieldName];
        const formField = (control as CustomUntypedFormField);
        if (!formField.hidden$) {
          formField.hidden$ = new BehaviorSubject<boolean>(false);
        }
        formField.hidden$.next(true);
        formField.disable();
      }

      if (relation.operatorName === '=') {
        this.handleEqualOperatorNameSubscription(payload, relation);
      }
      if (relation.operatorName === '!=') {
        this.handleNonEqualOperatorNameSubscription(payload, relation);
      }
    });
  }

  private handleEqualOperatorNameSubscription(payload: CommonSchemaAddControl, relation: Relation): void {
    const {
      schema, isNew, subscription, formGroup, isParentImmutable, chartSchemaNode,
    } = payload;

    if (!_.isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
      const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
      if (!formField.hidden$) {
        formField.hidden$ = new BehaviorSubject<boolean>(false);
      }
      formField.hidden$.next(true);
      formField.disable();
    }

    subscription.add(formGroup.controls[relation.fieldName].valueChanges
      .subscribe((value) => {
        const parentControl = (formGroup.controls[chartSchemaNode.variable].parent as CustomUntypedFormField);
        if (!parentControl.hidden$) {
          parentControl.hidden$ = new BehaviorSubject<boolean>(false);
        }

        parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
          if (value !== null && !isParentHidden) {
            const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
            if (!formField.hidden$) {
              formField.hidden$ = new BehaviorSubject<boolean>(false);
            }
            if (_.isEqual(value, relation.operatorValue)) {
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

    if (_.isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
      const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
      if (!formField.hidden$) {
        formField.hidden$ = new BehaviorSubject<boolean>(false);
      }
      formField.hidden$.next(true);
      formField.disable();
    }

    subscription.add(formGroup.controls[relation.fieldName].valueChanges
      .subscribe((value) => {
        const parentControl = (formGroup.controls[chartSchemaNode.variable].parent as CustomUntypedFormField);
        if (!parentControl.hidden$) {
          parentControl.hidden$ = new BehaviorSubject<boolean>(false);
        }

        parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
          if (value !== null && !isParentHidden) {
            const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
            if (!formField.hidden$) {
              formField.hidden$ = new BehaviorSubject<boolean>(false);
            }
            if (!_.isEqual(value, relation.operatorValue)) {
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

  private handleSchemaSubQuestions(payload: CommonSchemaAddControl, newFormControl: CustomUntypedFormControl): void {
    const {
      schema, isNew, path, subscription, formGroup, config, isParentImmutable,
    } = payload;

    if (schema.subquestions) {
      schema.subquestions.forEach((subquestion) => {
        subscription.add(
          this.addFormControls({
            isNew,
            path,
            chartSchemaNode: subquestion,
            formGroup,
            config,
            isParentImmutable: !!schema.immutable || isParentImmutable,
          }),
        );

        const formField = (formGroup.controls[subquestion.variable] as CustomUntypedFormField);
        if (!formField.hidden$) {
          formField.hidden$ = new BehaviorSubject<boolean>(false);
        }
        if (newFormControl.value === schema.show_subquestions_if) {
          formField.hidden$.next(false);
          formField.enable();
        } else {
          formField.hidden$.next(true);
          formField.disable();
        }
      });

      subscription.add(newFormControl.valueChanges.subscribe((value) => {
        schema.subquestions.forEach((subquestion) => {
          const parentControl = (formGroup.controls[subquestion.variable].parent as CustomUntypedFormField);
          if (!parentControl.hidden$) {
            parentControl.hidden$ = new BehaviorSubject<boolean>(false);
          }

          parentControl.hidden$.pipe(take(1)).subscribe((isParentHidden) => {
            if (!isParentHidden) {
              const formField = (formGroup.controls[subquestion.variable] as CustomUntypedFormField);
              if (!formField.hidden$) {
                formField.hidden$ = new BehaviorSubject<boolean>(false);
              }
              if (value === schema.show_subquestions_if) {
                formField.hidden$.next(false);
                if (!isNew && (isParentImmutable || !!schema.immutable || !!subquestion.schema.immutable)) {
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
        });
      }));
    }
  }
}
