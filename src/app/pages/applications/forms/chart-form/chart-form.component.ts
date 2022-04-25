import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
  FormArray, FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { ChartSchema, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import {
  AddListItemEmitter, DeleteListItemEmitter, DynamicFormSchema, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
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
  name: string;
  isLoading = false;
  dynamicSection: DynamicFormSchema[] = [];

  form = this.formBuilder.group({
    release_name: ['', Validators.required],
    data: this.formBuilder.group({}),
  });

  get formGroup(): FormGroup {
    return this.form.controls['data'] as FormGroup;
  }

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private filesystemService: FilesystemService,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  parseChartSchema(chartSchema: ChartSchema): void {
    this.form.controls.release_name.setValue(this.title);
    this.form.controls.release_name.disable();
    chartSchema.schema.groups.forEach((group) => {
      this.dynamicSection.push({ ...group, schema: [] });
    });
    try {
      chartSchema.schema.questions.forEach((question) => {
        if (this.dynamicSection.find((schema) => schema.name === question.group)) {
          this.addFormControls(question, this.form.controls.data as FormGroup);
          this.addFormSchema(question, question.group);
        }
      });
      // TODO: patch form
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

      if (schema.editable !== undefined && !schema.editable) {
        newFormControl.disable();
      }

      if (schema.subquestions) {
        schema.subquestions.forEach((subquestion) => {
          this.addFormControls(subquestion, formGroup);
          if (subquestion.schema.default === schema.show_subquestions_if) {
            formGroup.get(subquestion.variable).enable();
          } else {
            formGroup.get(subquestion.variable).disable();
          }

          newFormControl.valueChanges
            .pipe(untilDestroyed(this))
            .subscribe((value) => {
              if (value === schema.show_subquestions_if) {
                formGroup.get(subquestion.variable).enable();
              } else {
                formGroup.get(subquestion.variable).disable();
              }
            });
        });
      }

      if (schema.hidden) {
        newFormControl.disable();
      }

      formGroup.addControl(chartSchemaNode.variable, newFormControl);
    } else if (schema.type === 'dict') {
      formGroup.addControl(chartSchemaNode.variable, new FormGroup({}));
      for (const attr of schema.attrs) {
        this.addFormControls(attr, formGroup.get(chartSchemaNode.variable) as FormGroup);
      }
    } else if (schema.type === 'list') {
      formGroup.addControl(chartSchemaNode.variable, new FormArray([]));
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
            variable: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: beforSchema.required,
            private: beforSchema.private,
          });
          break;
        case 'string':
          if (beforSchema.enum) {
            afterSchemas.push({
              variable: chartSchemaNode.variable,
              type: 'select',
              title: chartSchemaNode.label,
              options: of(beforSchema.enum.map((option) => ({
                value: option.value,
                label: option.description,
              }))),
              required: beforSchema.required,
            });
          } else {
            afterSchemas.push({
              variable: chartSchemaNode.variable,
              type: 'input',
              title: chartSchemaNode.label,
              required: beforSchema.required,
              private: beforSchema.private,
            });
          }
          break;
        case 'path':
          afterSchemas.push({
            variable: chartSchemaNode.variable,
            type: 'input',
            title: chartSchemaNode.label,
            required: beforSchema.required,
          });
          break;
        case 'hostpath':
          afterSchemas.push({
            variable: chartSchemaNode.variable,
            type: 'explorer',
            title: chartSchemaNode.label,
            nodeProvider: this.filesystemService.getFilesystemNodeProvider(),
            required: beforSchema.required,
          });
          break;
        case 'boolean':
          afterSchemas.push({
            variable: chartSchemaNode.variable,
            type: 'checkbox',
            title: chartSchemaNode.label,
            required: beforSchema.required,
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
        variable: chartSchemaNode.variable,
        type: 'dict',
        attrs,
      });
    } else if (beforSchema.type === 'list') {
      let items: DynamicFormSchemaNode[] = [];
      beforSchema.items.forEach((item) => {
        items = items.concat(this.transformSchemaNode(item));
      });
      afterSchemas.push({
        variable: chartSchemaNode.variable,
        type: 'list',
        items,
        items_schema: chartSchemaNode.schema.items,
      });
    } else {
      console.error('Unsupported type = ', beforSchema.type);
    }
    return afterSchemas;
  }

  addFormListItem(event: AddListItemEmitter): void {
    event.schema.forEach((item) => {
      const formGroup = new FormGroup({});
      this.addFormControls(item, formGroup);
      event.array.push(formGroup);
    });
  }

  deleteFormListItem(event: DeleteListItemEmitter): void {
    event.array.removeAt(event.index);
  }

  onSubmit(): void {
    // TODO: update request format
    const values = this.form.value;

    this.isLoading = true;
    const request$: Observable<unknown> = this.ws.call('chart.release.update', values);

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
