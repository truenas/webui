import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { ChartSchema, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import {
  AddListItemEmitter, DeleteListItemEmitter, DynamicFormSchema, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Relation } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { DialogService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './chart-form.component.html',
  styleUrls: ['./chart-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartFormComponent {
  title: string;
  config: any;
  name: string;
  isLoading = false;
  dynamicSection: DynamicFormSchema[] = [];
  dialogRef: MatDialogRef<EntityJobComponent>;

  form = this.formBuilder.group({
    release_name: ['', Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private filesystemService: FilesystemService,
    private mdDialog: MatDialog,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  setChartConfig(config: { [key: string]: any }): void {
    this.config = config;
  }

  parseChartSchema(chartSchema: ChartSchema): void {
    this.form.controls.release_name.setValue(this.title);

    this.dynamicSection.push({
      name: 'Application name',
      description: '',
      schema: [
        {
          controlName: 'release_name',
          type: 'input',
          title: helptext.chartForm.release_name.placeholder,
          required: true,
          editable: false,
        },
      ],
    });

    chartSchema.schema.groups.forEach((group) => {
      this.dynamicSection.push({ ...group, schema: [] });
    });
    try {
      chartSchema.schema.questions.forEach((question) => {
        if (this.dynamicSection.find((schema) => schema.name === question.group)) {
          this.addFormControls(question, this.form);
          this.addFormSchema(question, question.group);
        }
      });
      this.form.patchValue(this.config);
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  addFormControls(chartSchemaNode: ChartSchemaNode, formGroup: FormGroup): void {
    const schema = chartSchemaNode.schema;
    if (['string', 'int', 'boolean', 'hostpath', 'path'].includes(schema.type)) {
      const newFormControl = new FormControl(schema.default, [
        schema.required ? Validators.required : Validators.nullValidator,
        schema.max ? Validators.max(schema.max) : Validators.nullValidator,
        schema.min ? Validators.min(schema.min) : Validators.nullValidator,
        schema.max_length ? Validators.maxLength(schema.max_length) : Validators.nullValidator,
        schema.min_length ? Validators.minLength(schema.min_length) : Validators.nullValidator,
      ]);

      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          this.addFormControls(subquestion, formGroup);
          if (subquestion.schema.default === schema.show_subquestions_if) {
            formGroup.controls[subquestion.variable].enable();
          } else {
            formGroup.controls[subquestion.variable].disable();
          }
        });
        newFormControl.valueChanges
          .pipe(untilDestroyed(this))
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
          });
      }

      formGroup.addControl(chartSchemaNode.variable, newFormControl);

      if (schema.show_if) {
        const relations: Relation[] = schema.show_if.map((item) => ({
          fieldName: item[0],
          operatorName: item[1],
          operatorValue: item[2],
        }));
        relations.forEach((relation) => {
          if (formGroup.controls[relation.fieldName]) {
            formGroup.controls[relation.fieldName].valueChanges
              .pipe(untilDestroyed(this))
              .subscribe((value) => {
                if (formGroup.controls[chartSchemaNode.variable].parent.enabled) {
                  if (value === relation.operatorValue) {
                    formGroup.controls[chartSchemaNode.variable].enable();
                  } else {
                    formGroup.controls[chartSchemaNode.variable].disable();
                  }
                }
              });
          }
        });
      }
    } else if (schema.type === 'dict') {
      formGroup.addControl(chartSchemaNode.variable, new FormGroup({}));
      for (const attr of schema.attrs) {
        this.addFormControls(attr, formGroup.controls[chartSchemaNode.variable] as FormGroup);
      }
    } else if (schema.type === 'list') {
      formGroup.addControl(chartSchemaNode.variable, new FormArray([]));

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
      let nextItem: any = this.config;
      for (const path of configControlPath) {
        nextItem = nextItem[path];
      }

      if (Array.isArray(nextItem)) {
        // eslint-disable-next-line unused-imports/no-unused-vars
        for (const _ of nextItem) {
          this.addFormListItem({
            array: formGroup.controls[chartSchemaNode.variable] as FormArray,
            schema: items,
          });
        }
      }
    }
  }

  addFormSchema(chartSchemaNode: ChartSchemaNode, group: string): void {
    this.dynamicSection.forEach((section) => {
      if (section.name === group) {
        section.schema = section.schema.concat(this.transformSchemaNode(chartSchemaNode));
      }
    });
  }

  transformSchemaNode(chartSchemaNode: ChartSchemaNode): DynamicFormSchemaNode[] {
    const beforSchema = chartSchemaNode.schema;
    let afterSchemas: DynamicFormSchemaNode[] = [];
    if (['string', 'int', 'boolean', 'hostpath', 'path'].includes(beforSchema.type)) {
      switch (beforSchema.type) {
        case 'int':
          afterSchemas.push({
            controlName: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: beforSchema.required,
            hidden: beforSchema.hidden,
            editable: beforSchema.editable,
            private: beforSchema.private,
          });
          break;
        case 'string':
          if (beforSchema.enum) {
            afterSchemas.push({
              controlName: chartSchemaNode.variable,
              type: 'select',
              title: chartSchemaNode.label,
              options: of(beforSchema.enum.map((option) => ({
                value: option.value,
                label: option.description,
              }))),
              required: beforSchema.required,
              hidden: beforSchema.hidden,
              editable: beforSchema.editable,
            });
          } else {
            afterSchemas.push({
              controlName: chartSchemaNode.variable,
              type: 'input',
              title: chartSchemaNode.label,
              required: beforSchema.required,
              hidden: beforSchema.hidden,
              editable: beforSchema.editable,
              private: beforSchema.private,
            });
          }
          break;
        case 'path':
          afterSchemas.push({
            controlName: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: beforSchema.required,
            hidden: beforSchema.hidden,
            editable: beforSchema.editable,
          });
          break;
        case 'hostpath':
          afterSchemas.push({
            controlName: chartSchemaNode.variable,
            type: 'explorer',
            title: chartSchemaNode.label,
            nodeProvider: this.filesystemService.getFilesystemNodeProvider(),
            required: beforSchema.required,
            hidden: beforSchema.hidden,
            editable: beforSchema.editable,
          });
          break;
        case 'boolean':
          afterSchemas.push({
            controlName: chartSchemaNode.variable,
            type: 'checkbox',
            title: chartSchemaNode.label,
            required: beforSchema.required,
            hidden: beforSchema.hidden,
            editable: beforSchema.editable,
          });
          break;
      }
      if (beforSchema.subquestions) {
        beforSchema.subquestions.forEach((subquestion) => {
          afterSchemas = afterSchemas.concat(this.transformSchemaNode(subquestion));
        });
      }
    } else if (beforSchema.type === 'dict') {
      let attrs: DynamicFormSchemaNode[] = [];
      beforSchema.attrs.forEach((attr) => {
        attrs = attrs.concat(this.transformSchemaNode(attr));
      });
      afterSchemas.push({
        controlName: chartSchemaNode.variable,
        type: 'dict',
        attrs,
        hidden: beforSchema.hidden,
        editable: beforSchema.editable,
      });
    } else if (beforSchema.type === 'list') {
      let items: DynamicFormSchemaNode[] = [];
      let itemsSchema: ChartSchemaNode[] = [];
      beforSchema.items.forEach((item) => {
        if (item.schema.attrs) {
          item.schema.attrs.forEach((attr) => {
            items = items.concat(this.transformSchemaNode(attr));
            itemsSchema = itemsSchema.concat(attr);
          });
        } else {
          items = items.concat(this.transformSchemaNode(item));
          itemsSchema = itemsSchema.concat(item);
        }
      });
      afterSchemas.push({
        controlName: chartSchemaNode.variable,
        type: 'list',
        title: chartSchemaNode.label,
        items,
        items_schema: itemsSchema,
        hidden: beforSchema.hidden,
        editable: beforSchema.editable,
      });
    } else {
      console.error('Unsupported type = ', beforSchema.type);
    }
    return afterSchemas;
  }

  addFormListItem(event: AddListItemEmitter): void {
    const itemFormGroup = new FormGroup({});
    event.schema.forEach((item) => {
      this.addFormControls(item, itemFormGroup);
    });
    event.array.push(itemFormGroup);
  }

  deleteFormListItem(event: DeleteListItemEmitter): void {
    event.array.removeAt(event.index);
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

  onSubmit(): void {
    const payload: any[] = [];
    const data = this.form.value;
    delete data.release_name;
    payload.push({
      values: data,
    });

    payload.unshift(this.title);

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.updating,
      },
    });
    this.dialogRef.componentInstance.setCall('chart.release.update', payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.slideInService.close();
    });
  }
}
