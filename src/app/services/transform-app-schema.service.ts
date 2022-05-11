import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { DynamicSchemaType } from 'app/enums/dynamic-schema-type.enum';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TransformAppSchemaService {
  constructor(
    protected filesystemService: FilesystemService,
  ) {}

  transformNode(chartSchemaNode: ChartSchemaNode): DynamicFormSchemaNode[] {
    const schema = chartSchemaNode.schema;
    let newSchema: DynamicFormSchemaNode[] = [];
    if ([
      DynamicSchemaType.Int,
      DynamicSchemaType.String,
      DynamicSchemaType.Boolean,
      DynamicSchemaType.Path,
      DynamicSchemaType.Hostpath,
    ].includes(schema.type)) {
      switch (schema.type) {
        case DynamicSchemaType.Int:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: schema.required,
            hidden: schema.hidden,
            tooltip: chartSchemaNode.description,
            editable: schema.editable,
            private: schema.private,
          });
          break;
        case DynamicSchemaType.String:
          if (schema.enum) {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: 'select',
              title: chartSchemaNode.label,
              options: of(schema.enum.map((option) => ({
                value: option.value,
                label: option.description,
              }))),
              required: true,
              hidden: schema.hidden,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
            });
          } else {
            newSchema.push({
              controlName: chartSchemaNode.variable,
              type: 'input',
              title: chartSchemaNode.label,
              required: schema.required,
              hidden: schema.hidden,
              editable: schema.editable,
              tooltip: chartSchemaNode.description,
              private: schema.private,
            });
          }
          break;
        case DynamicSchemaType.Path:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: schema.required,
            hidden: schema.hidden,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
        case DynamicSchemaType.Hostpath:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: 'explorer',
            title: chartSchemaNode.label,
            nodeProvider: this.filesystemService.getFilesystemNodeProvider(),
            required: schema.required,
            hidden: schema.hidden,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
        case DynamicSchemaType.Boolean:
          newSchema.push({
            controlName: chartSchemaNode.variable,
            type: 'checkbox',
            title: chartSchemaNode.label,
            required: schema.required,
            hidden: schema.hidden,
            editable: schema.editable,
            tooltip: chartSchemaNode.description,
          });
          break;
      }
      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          const objs = this.transformNode(subquestion);
          objs.forEach((obj) => obj.indent = true);
          newSchema = newSchema.concat(objs);
        });
      }
    } else if (schema.type === DynamicSchemaType.Dict) {
      let attrs: DynamicFormSchemaNode[] = [];
      schema.attrs.forEach((attr) => {
        attrs = attrs.concat(this.transformNode(attr));
      });
      newSchema.push({
        controlName: chartSchemaNode.variable,
        type: 'dict',
        title: chartSchemaNode.label,
        attrs,
        hidden: schema.hidden,
        editable: schema.editable,
      });
    } else if (schema.type === DynamicSchemaType.List) {
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
        type: 'list',
        title: chartSchemaNode.label,
        items,
        items_schema: itemsSchema,
        hidden: schema.hidden,
        editable: schema.editable,
      });
    } else {
      console.error('Unsupported type = ', schema.type);
    }
    return newSchema;
  }
}
