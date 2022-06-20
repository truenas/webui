import { Injectable } from '@angular/core';
import {
  UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, AbstractControl,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import _ from 'lodash';
import { of, Subscription } from 'rxjs';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { ChartFormValue, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { Relation } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AppSchemaService {
  constructor(
    protected filesystemService: FilesystemService,
  ) {}

  transformNode(chartSchemaNode: ChartSchemaNode): DynamicFormSchemaNode[] {
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
            newSchema.push({
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
            });
          } else {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              tooltip: chartSchemaNode.description,
              editable: schema.editable,
              inputType: 'number',
            });
          }
          break;
        case ChartSchemaType.String:
          if (schema.enum) {
            newSchema.push({
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
            });
          } else {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
              inputType: schema.private ? 'password' : undefined,
            });
          }
          break;
        case ChartSchemaType.Path:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Input,
            title: chartSchemaNode.label,
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
        case ChartSchemaType.Hostpath:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Explorer,
            title: chartSchemaNode.label,
            nodeProvider: this.filesystemService.getFilesystemNodeProvider(),
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
        case ChartSchemaType.Boolean:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: DynamicFormSchemaType.Checkbox,
            title: chartSchemaNode.label,
            required: schema.required,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
        case ChartSchemaType.Ipaddr:
          if (schema.cidr) {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Ipaddr,
              title: chartSchemaNode.label,
              required: schema.required,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
            });
          } else {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: DynamicFormSchemaType.Input,
              title: chartSchemaNode.label,
              required: schema.required,
              tooltip: chartSchemaNode.description,
              editable: schema.editable,
            });
          }
          break;
      }
      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          const objs = this.transformNode(subquestion);
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
        attrs = attrs.concat(this.transformNode(attr));
      });
      newSchema.push({
        controlName: chartSchemaNode.variable,
        type: DynamicFormSchemaType.Dict,
        title: chartSchemaNode.label,
        attrs,
        editable: schema.editable,
      });
    } else if (schema.type === ChartSchemaType.List) {
      let items: DynamicFormSchemaNode[] = [];
      let itemsSchema: ChartSchemaNode[] = [];
      schema.items.forEach((item) => {
        if (item.schema.attrs) {
          item.schema.attrs.forEach((attr) => {
            items = items.concat(this.transformNode(attr));
            itemsSchema = itemsSchema.concat(attr);
          });
        } else {
          items = items.concat(this.transformNode(item));
          itemsSchema = itemsSchema.concat(item);
        }
      });
      newSchema.push({
        controlName: chartSchemaNode.variable,
        type: DynamicFormSchemaType.List,
        title: chartSchemaNode.label,
        items,
        itemsSchema,
        editable: schema.editable,
        dependsOn: schema.show_if?.map((conditional) => conditional[0]),
      });
    } else {
      console.error('Unsupported type = ', schema.type);
    }
    return newSchema;
  }

  addFormControls(
    chartSchemaNode: ChartSchemaNode,
    formGroup: UntypedFormGroup,
    config: HierarchicalObjectMap<ChartFormValue>,
  ): Subscription {
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
      const newFormControl = new UntypedFormControl(schema.default || schema.type === ChartSchemaType.Int ? null : '', [
        schema.required ? Validators.required : Validators.nullValidator,
        schema.max ? Validators.max(schema.max) : Validators.nullValidator,
        schema.min ? Validators.min(schema.min) : Validators.nullValidator,
        schema.max_length ? Validators.maxLength(schema.max_length) : Validators.nullValidator,
        schema.min_length ? Validators.minLength(schema.min_length) : Validators.nullValidator,
      ]);

      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          subscription.add(this.addFormControls(subquestion, formGroup, config));
          if (subquestion.schema.default === schema.show_subquestions_if) {
            formGroup.controls[subquestion.variable].enable();
          } else {
            formGroup.controls[subquestion.variable].disable();
          }
        });
        subscription.add(newFormControl.valueChanges
          .subscribe((value) => {
            schema.subquestions.forEach((subquestion) => {
              if (formGroup.controls[subquestion.variable].parent.enabled) {
                if (value === schema.show_subquestions_if) {
                  formGroup.controls[subquestion.variable].enable();
                } else {
                  formGroup.controls[subquestion.variable].disable();
                }
              }
            });
          }));
      }

      formGroup.addControl(chartSchemaNode.variable, newFormControl);

      if (schema.default !== undefined) {
        formGroup.controls[chartSchemaNode.variable].setValue(schema.default);
      }
    } else if (schema.type === ChartSchemaType.Dict) {
      formGroup.addControl(chartSchemaNode.variable, new UntypedFormGroup({}));
      for (const attr of schema.attrs) {
        subscription.add(
          this.addFormControls(attr, formGroup.controls[chartSchemaNode.variable] as UntypedFormGroup, config),
        );
      }
    } else if (schema.type === ChartSchemaType.List) {
      formGroup.addControl(chartSchemaNode.variable, new UntypedFormArray([]));

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
            subscription.add(this.addFormListItem({
              array: formGroup.controls[chartSchemaNode.variable] as UntypedFormArray,
              schema: items,
            }, item));
          }
        }
      }
    } else {
      console.error('Unsupported type = ', schema.type);
      return;
    }

    if (schema.hidden) {
      formGroup.controls[chartSchemaNode.variable].disable();
    }

    if (schema.show_if) {
      const relations: Relation[] = schema.show_if.map((item) => ({
        fieldName: item[0],
        operatorName: item[1],
        operatorValue: item[2],
      }));
      relations.forEach((relation) => {
        if (!formGroup.controls[relation.fieldName]) {
          formGroup.addControl(relation.fieldName, new UntypedFormControl());
          formGroup.controls[relation.fieldName].disable();
        }
        switch (relation.operatorName) {
          case '=':
            if (!_.isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
              formGroup.controls[chartSchemaNode.variable].disable();
            }
            subscription.add(formGroup.controls[relation.fieldName].valueChanges
              .subscribe((value) => {
                if (value !== null && formGroup.controls[chartSchemaNode.variable].parent.enabled) {
                  if (_.isEqual(value, relation.operatorValue)) {
                    formGroup.controls[chartSchemaNode.variable].enable();
                  } else {
                    formGroup.controls[chartSchemaNode.variable].disable();
                  }
                }
              }));
            break;
          case '!=':
            if (_.isEqual(formGroup.controls[relation.fieldName].value, relation.operatorValue)) {
              formGroup.controls[chartSchemaNode.variable].disable();
            }
            subscription.add(formGroup.controls[relation.fieldName].valueChanges
              .subscribe((value) => {
                if (value !== null && formGroup.controls[chartSchemaNode.variable].parent.enabled) {
                  if (!_.isEqual(value, relation.operatorValue)) {
                    formGroup.controls[chartSchemaNode.variable].enable();
                  } else {
                    formGroup.controls[chartSchemaNode.variable].disable();
                  }
                }
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

  addFormListItem(event: AddListItemEvent, config?: HierarchicalObjectMap<ChartFormValue>): Subscription {
    const subscriptionEvent = new Subscription();
    const itemFormGroup = new UntypedFormGroup({});
    event.schema.forEach((item) => {
      subscriptionEvent.add(this.addFormControls(item as ChartSchemaNode, itemFormGroup, config));
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

  serializeFormList(list: HierarchicalObjectMap<ChartFormValue>[]): HierarchicalObjectMap<ChartFormValue>[] {
    return list.map((listItem: HierarchicalObjectMap<ChartFormValue>) => {
      if (Object.keys(listItem).length > 1) {
        return this.serializeFormValue(listItem);
      }
      return this.serializeFormValue(listItem[Object.keys(listItem)[0]]);
    }) as HierarchicalObjectMap<ChartFormValue>[];
  }
}
