import { Injectable } from '@angular/core';
import {
  Validators, AbstractControl, FormGroup,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import _ from 'lodash';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { ChartFormValue, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import {
  AddListItemEvent, DeleteListItemEvent, DynamicFormSchemaInput, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { Relation } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { CustomUntypedFormArray } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untped-form-array';
import { CustomUntypedFormControl } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untped-form-control';
import {
  CustomUntypedFormField,
} from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { CustomUntypedFormGroup } from 'app/modules/ix-forms/components/ix-dynamic-form/classes/custom-untyped-form-group';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AppSchemaService {
  constructor(
    protected filesystemService: FilesystemService,
  ) {}

  transformNode(chartSchemaNode: ChartSchemaNode, isNew: boolean, isParentImmutable: boolean): DynamicFormSchemaNode[] {
    const schema = chartSchemaNode.schema;
    let newSchema: DynamicFormSchemaNode[] = [];
    if (schema.hidden) {
      return newSchema;
    }

    if ([
      ChartSchemaType.Int,
      ChartSchemaType.String,
      ChartSchemaType.Boolean,
      ChartSchemaType.Path,
      ChartSchemaType.Hostpath,
      ChartSchemaType.Ipaddr,
    ].includes(schema.type)) {
      switch (schema.type) {
        case ChartSchemaType.Int:
          if (schema.enum) {
            const inputSchema = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Select,
              title: chartSchemaNode.label,
              options: of(schema.enum.map((option) => ({
                value: option.value,
                label: option.description,
              }))),
              required: schema.required,
              hideEmpty: true,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          } else {
            const inputSchema: DynamicFormSchemaInput = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              tooltip: chartSchemaNode.description,
              editable: schema.editable,
              inputType: 'number',
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          }
          break;
        case ChartSchemaType.String:
          if (schema.enum) {
            const inputSchema = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Select,
              title: chartSchemaNode.label,
              options: of(schema.enum.map((option) => ({
                value: option.value,
                label: option.description,
              }))),
              required: schema.required,
              hideEmpty: true,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          } else {
            const inputSchema: DynamicFormSchemaInput = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
              inputType: schema.private ? 'password' : undefined,
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          }
          break;
        case ChartSchemaType.Path:
        {
          const inputSchema = {
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Input,
            title: chartSchemaNode.label,
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          };
          if (!isNew && (!!schema.immutable || isParentImmutable)) {
            inputSchema.editable = false;
          }
          newSchema.push(inputSchema);
          break;
        }
        case ChartSchemaType.Hostpath:
        {
          const inputSchema = {
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Explorer,
            title: chartSchemaNode.label,
            nodeProvider: this.filesystemService.getFilesystemNodeProvider(),
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          };
          if (!isNew && (!!schema.immutable || isParentImmutable)) {
            inputSchema.editable = false;
          }
          newSchema.push(inputSchema);
          break;
        }
        case ChartSchemaType.Boolean:
        {
          const inputSchema = {
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Checkbox,
            title: chartSchemaNode.label,
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          };
          if (!isNew && (!!schema.immutable || isParentImmutable)) {
            inputSchema.editable = false;
          }
          newSchema.push(inputSchema);
          break;
        }
        case ChartSchemaType.Ipaddr:
          if (schema.cidr) {
            const inputSchema = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Ipaddr,
              title: chartSchemaNode.label,
              required: schema.required,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          } else {
            const inputSchema = {
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              tooltip: chartSchemaNode.description,
              editable: schema.editable,
            };
            if (!isNew && (!!schema.immutable || isParentImmutable)) {
              inputSchema.editable = false;
            }
            newSchema.push(inputSchema);
          }
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
      let attrs: DynamicFormSchemaNode[] = [];
      schema.attrs.forEach((attr) => {
        attrs = attrs.concat(this.transformNode(attr, isNew, !!schema.immutable || isParentImmutable));
      });
      const inputSchema = {
        controlName: chartSchemaNode.variable,
        type: DynamicFormSchemaType.Dict,
        title: chartSchemaNode.label,
        attrs,
        editable: schema.editable,
      };
      if (!isNew && (!!schema.immutable || isParentImmutable)) {
        inputSchema.editable = false;
      }
      newSchema.push(inputSchema);
    } else if (schema.type === ChartSchemaType.List) {
      let items: DynamicFormSchemaNode[] = [];
      let itemsSchema: ChartSchemaNode[] = [];
      schema.items.forEach((item) => {
        if (item.schema.attrs) {
          item.schema.attrs.forEach((attr) => {
            items = items.concat(this.transformNode(attr, isNew, !!schema.immutable || isParentImmutable));
            itemsSchema = itemsSchema.concat(attr);
          });
        } else {
          items = items.concat(this.transformNode(item, isNew, !!schema.immutable || isParentImmutable));
          itemsSchema = itemsSchema.concat(item);
        }
      });
      const inputSchema = {
        controlName: chartSchemaNode.variable,
        type: DynamicFormSchemaType.List,
        title: chartSchemaNode.label,
        items,
        itemsSchema,
        editable: schema.editable,
        dependsOn: schema.show_if?.map((conditional) => conditional[0]),
      };
      if (!isNew && (!!schema.immutable || isParentImmutable)) {
        inputSchema.editable = false;
      }
      newSchema.push(inputSchema);
    } else {
      console.error('Unsupported type = ', schema.type);
    }
    return newSchema;
  }

  addFormControls(
    chartSchemaNode: ChartSchemaNode,
    formGroup: CustomUntypedFormGroup | FormGroup,
    config: HierarchicalObjectMap<ChartFormValue>,
    isNew: boolean,
    isParentImmutable: boolean,
    path = '',
  ): Subscription {
    path = path ? path + '.' + chartSchemaNode.variable : chartSchemaNode.variable;
    const subscription = new Subscription();
    const schema = chartSchemaNode.schema;

    if ([
      ChartSchemaType.Int,
      ChartSchemaType.String,
      ChartSchemaType.Boolean,
      ChartSchemaType.Path,
      ChartSchemaType.Hostpath,
      ChartSchemaType.Ipaddr,
    ].includes(schema.type)) {
      let altDefault: string | boolean | number = '';
      if (schema.type === ChartSchemaType.Int) {
        altDefault = null;
      } else
      if (schema.type === ChartSchemaType.Boolean) {
        altDefault = false;
      }

      const value = schema.default !== undefined ? schema.default : altDefault;

      const newFormControl = new CustomUntypedFormControl(value, [
        schema.required ? Validators.required : Validators.nullValidator,
        schema.max ? Validators.max(schema.max) : Validators.nullValidator,
        schema.min ? Validators.min(schema.min) : Validators.nullValidator,
        schema.max_length ? Validators.maxLength(schema.max_length) : Validators.nullValidator,
        schema.min_length ? Validators.minLength(schema.min_length) : Validators.nullValidator,
      ]);

      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          subscription.add(
            this.addFormControls(
              subquestion,
              formGroup,
              config,
              isNew,
              !!schema.immutable || isParentImmutable,
              path,
            ),
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
        subscription.add(newFormControl.valueChanges
          .subscribe((value) => {
            schema.subquestions.forEach((subquestion) => {
              const parentControl = (formGroup.controls[subquestion.variable].parent as CustomUntypedFormField);
              if (!parentControl.hidden$) {
                parentControl.hidden$ = new BehaviorSubject<boolean>(false);
              }
              parentControl.hidden$.pipe(
                take(1),
              ).subscribe((isParentHidden) => {
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

      formGroup.addControl(chartSchemaNode.variable, newFormControl);

      if (!isNew && (isParentImmutable || !!schema.immutable)) {
        newFormControl.disable();
      }
    } else if (schema.type === ChartSchemaType.Dict) {
      formGroup.addControl(chartSchemaNode.variable, new CustomUntypedFormGroup({}));
      for (const attr of schema.attrs) {
        subscription.add(
          this.addFormControls(
            attr,
            formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormGroup,
            config,
            isNew,
            isParentImmutable || !!schema.immutable,
            path,
          ),
        );
      }
    } else if (schema.type === ChartSchemaType.List) {
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
        for (const path of configControlPath) {
          if (nextItem) {
            nextItem = nextItem[path] as HierarchicalObjectMap<ChartFormValue>;
          }
        }

        if (Array.isArray(nextItem)) {
          for (const item of nextItem) {
            subscription.add(
              this.addFormListItem(
                {
                  array: formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormArray,
                  schema: items,
                },
                isNew,
                isParentImmutable || !!schema.immutable,
                item,
              ),
            );
          }
        }
      }
    } else {
      console.error('Unsupported type = ', schema.type);
      return;
    }

    if (schema.hidden) {
      const formField = (formGroup.controls[chartSchemaNode.variable] as CustomUntypedFormField);
      if (!formField.hidden$) {
        formField.hidden$ = new BehaviorSubject<boolean>(false);
      }
      formField.hidden$.next(true);
      formField.disable();
    }

    if (schema.show_if && !schema.hidden) {
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
        switch (relation.operatorName) {
          case '=':
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
                parentControl.hidden$.pipe(
                  take(1),
                ).subscribe((isParentHidden) => {
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
            break;
          case '!=':
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
                parentControl.hidden$.pipe(
                  take(1),
                ).subscribe((isParentHidden) => {
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
            break;
        }
      });
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

  addFormListItem(
    event: AddListItemEvent,
    isNew: boolean,
    isParentImmutable: boolean,
    config?: HierarchicalObjectMap<ChartFormValue>,
  ): Subscription {
    const subscriptionEvent = new Subscription();
    const itemFormGroup = new CustomUntypedFormGroup({});
    event.schema.forEach((item: ChartSchemaNode) => {
      subscriptionEvent.add(
        this.addFormControls(
          item,
          itemFormGroup,
          config,
          isNew,
          isParentImmutable || !!item.schema.immutable,
        ),
      );
    });
    event.array.push(itemFormGroup);

    return subscriptionEvent;
  }

  deleteFormListItem(event: DeleteListItemEvent): void {
    event.array.removeAt(event.index);
  }

  serializeFormValue(
    data: HierarchicalObjectMap<ChartFormValue> | HierarchicalObjectMap<ChartFormValue>[] | ChartFormValue,
  ): HierarchicalObjectMap<ChartFormValue> | HierarchicalObjectMap<ChartFormValue>[] | ChartFormValue {
    if (data == null) {
      return data;
    }

    if (Array.isArray(data)) {
      return this.serializeFormList(data);
    }

    if (typeof data === 'object') {
      return this.serializeFormGroup(data as HierarchicalObjectMap<ChartFormValue>);
    }

    return data;
  }

  serializeFormGroup(groupValue: HierarchicalObjectMap<ChartFormValue>): HierarchicalObjectMap<ChartFormValue> {
    const result = {} as HierarchicalObjectMap<ChartFormValue>;
    Object.keys(groupValue).forEach((key) => {
      result[key] = this.serializeFormValue(groupValue[key]) as HierarchicalObjectMap<ChartFormValue>;
    });
    return result;
  }

  serializeFormList(
    list: HierarchicalObjectMap<ChartFormValue>[] | ChartFormValue[],
  ): HierarchicalObjectMap<ChartFormValue>[] {
    return list.map((listItem: HierarchicalObjectMap<ChartFormValue>) => {
      if (Object.keys(listItem).length > 1) {
        return this.serializeFormValue(listItem);
      }
      return this.serializeFormValue(listItem[Object.keys(listItem)[0]]);
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
    const newConfig = {} as HierarchicalObjectMap<ChartFormValue>;
    for (const [keyConfig, valueConfig] of Object.entries(config)) {
      const formConfig = form.controls[keyConfig] as FormGroup;
      if (!formConfig) {
        continue;
      }

      if (_.isArray(valueConfig)) {
        newConfig[keyConfig] = valueConfig.map((valueItem, idxItem) => {
          if (_.isPlainObject(valueItem)) {
            return this.restoreKeysFromFormGroup(
              valueItem as HierarchicalObjectMap<ChartFormValue>,
              formConfig.controls[idxItem] as FormGroup,
            );
          }
          const keyItem = Object.keys(formConfig.value[idxItem])[0];
          return { [keyItem]: valueItem };
        });
      } else if (_.isPlainObject(valueConfig)) {
        newConfig[keyConfig] = this.restoreKeysFromFormGroup(
          valueConfig as HierarchicalObjectMap<ChartFormValue>,
          formConfig,
        );
      } else {
        newConfig[keyConfig] = valueConfig;
      }
    }

    return newConfig;
  }
}
