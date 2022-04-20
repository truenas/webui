import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { ChartSchema, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
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
  dynamicFormSchema: DynamicFormSchema[] = [];

  form = this.formBuilder.group({
    release_name: ['', Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private dialogService: DialogService,
  ) {}

  setTitle(title: string): void {
    this.title = title;
  }

  parseChartSchema(chartSchema: ChartSchema): void {
    this.form.controls.release_name.setValue(this.title);
    this.form.controls.release_name.disable();
    chartSchema.schema.groups.forEach((group) => {
      this.dynamicFormSchema.push({ ...group, schema: [] });
    });
    try {
      chartSchema.schema.questions.forEach((question) => {
        if (this.dynamicFormSchema.find((schema) => schema.name === question.group)) {
          console.warn(chartSchema.schema.questions);
          this.addFormControls(question, this.form);
          this.addFormSchema(question, question.group);
        }
      });
      console.warn(this.dynamicFormSchema);
      // TODO: patch form
    } catch (error: unknown) {
      console.error(error);
      this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  addFormControls(chartSchemaNode: ChartSchemaNode, formGroup: FormGroup): void {
    const schema = chartSchemaNode.schema;
    if (['string', 'int', 'boolean', 'ipaddr', 'hostpath', 'path'].includes(schema.type)) {
      formGroup.addControl(chartSchemaNode.variable, new FormControl(
        schema.default,
        [
          schema.required ? Validators.required : Validators.nullValidator,
          schema.max ? Validators.max(schema.max) : Validators.nullValidator,
          schema.min ? Validators.min(schema.min) : Validators.nullValidator,
          schema.max_length ? Validators.maxLength(schema.max_length) : Validators.nullValidator,
          schema.min_length ? Validators.minLength(schema.min_length) : Validators.nullValidator,
        ],
      ));
    } else if (schema.type === 'dict') {
      formGroup.addControl(chartSchemaNode.variable, new FormGroup({}));
      for (const attr of schema.attrs) {
        this.addFormControls(attr, formGroup.controls[chartSchemaNode.variable] as FormGroup);
      }
    } else if (schema.type === 'list') {
      // formGroup.addControl(chartSchemaNode.variable, new FormGroup({}));
      // TODO: add list to form
    }
  }

  addFormSchema(chartSchemaNode: ChartSchemaNode, group: string): void {
    const schema = chartSchemaNode.schema;
    if (['string', 'int', 'boolean', 'ipaddr', 'hostpath', 'path'].includes(schema.type)) {
      this.dynamicFormSchema.forEach((formSchema) => {
        if (formSchema.name === group) {
          switch (schema.type) {
            case 'int':
              formSchema.schema.push({
                name: chartSchemaNode.variable,
                type: 'input',
                title: chartSchemaNode.label,
                required: schema.required,
              });
              break;
            case 'string':
              if (schema.enum) {
                formSchema.schema.push({
                  name: chartSchemaNode.variable,
                  type: 'selest',
                  title: chartSchemaNode.label,
                  required: schema.required,
                });
              } else {
                formSchema.schema.push({
                  name: chartSchemaNode.variable,
                  type: 'input',
                  title: chartSchemaNode.label,
                  required: schema.required,
                });
              }
              break;
          }
        }
      });
    } else if (schema.type === 'dict') {
      for (const attr of schema.attrs) {
        this.addFormSchema(attr, group);
      }
    } else if (schema.type === 'list') {
      // TODO: parse list
    }
  }

  onSubmit(): void {
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
