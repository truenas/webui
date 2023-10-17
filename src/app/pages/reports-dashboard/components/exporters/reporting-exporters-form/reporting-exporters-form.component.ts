import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { DynamicFormSchema, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { ExportingExporterList as ReportingExporterList, ReportingExporterKey as ReportingExporterType, ReportingExporterSchema, ReportingExporter } from 'app/interfaces/reporting-exporters.interface';
import { CustomUntypedFormField } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './reporting-exporters-form.component.html',
  styleUrls: ['./reporting-exporters-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportingExportersFormComponent implements OnInit {

  get isNew(): boolean {
    return !this.editingExpoter;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Reporting Exporter')
      : this.translate.instant('Edit Reporting Exporter');
  }

  form = this.fb.group({
    name: [null as string, Validators.required],
    enabled: [false as boolean],
    type: [null as string, Validators.required],
    attributes: this.fb.group<Record<string, unknown>>({}),
  });

  get formGroup(): UntypedFormGroup {
    return this.form.controls.attributes as UntypedFormGroup;
  }

  isLoading = false;
  isLoadingSchemas = true;
  dynamicSection: DynamicFormSchema[] = [];

  protected exporterTypeOptions$: Observable<Option[]>;
  protected reportingExporterList: ReportingExporterList[] = [];

  constructor(
    private fb: FormBuilder,
    private slideInRef: IxSlideInRef<ReportingExportersFormComponent>,
    private translate: TranslateService,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(SLIDE_IN_DATA) private editingExpoter: ReportingExporter,
  ) { }

  ngOnInit(): void {
    this.loadSchemas();
  }

  private loadSchemas(): void {
    this.isLoading = true;
    this.getExportersSchemas().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (schemas: ReportingExporterSchema[]): void => {
        this.setExporterTypeOptions(schemas);
        this.createExporterControls(schemas);

        if (!this.isNew) {
          this.form.patchValue(this.editingExpoter);
        }

        this.isLoading = false;
        this.isLoadingSchemas = false;
        this.cdr.markForCheck();
      },
    });
  }

  getExportersSchemas(): Observable<ReportingExporterSchema[]> {
    return this.ws.call('reporting.exporters.exporter_schemas');
  }

  setExporterTypeOptions(schemas: ReportingExporterSchema[]): void {
    this.exporterTypeOptions$ = of(
      schemas.map((schema) => ({ label: schema.key, value: schema.key })),
    );
  }

  createExporterControls(schemas: ReportingExporterSchema[]): void {
    for (const schema of schemas) {
      for (const input of schema.schema) {
        this.form.controls.attributes.addControl(
          input._name_, new FormControl('', input._required_ ? [Validators.required] : []),
        );
      }
    }

    this.dynamicSection = [{
      name: '',
      description: '',
      schema: schemas.map(
        (schema) => this.parseSchemaForDynamicSchema(schema),
      ).reduce((all, val) => all.concat(val), []),
    }];

    this.reportingExporterList = schemas.map((schema) => this.parseSchemaForExporterList(schema));
    this.onExporterTypeChanged(null);
  }

  parseSchemaForDynamicSchema(schema: ReportingExporterSchema): DynamicFormSchemaNode[] {
    return schema.schema.map((input) => ({
      controlName: input._name_,
      type: DynamicFormSchemaType.Input,
      title: input.title,
      required: input._required_,
    }));
  }

  parseSchemaForExporterList(schema: ReportingExporterSchema): ReportingExporterList {
    const variables = schema.schema.map((input) => input._name_);
    return { key: schema.key, variables };
  }

  onExporterTypeChanged(type: ReportingExporterType): void {
    for (const list of this.reportingExporterList) {
      if (list.key === type) {
        for (const variable of list.variables) {
          const formField = this.form.controls.attributes.controls[variable] as unknown as CustomUntypedFormField;
          formField.enable();
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject(false);
          }
          formField.hidden$.next(false);
        }
      } else {
        list.variables.forEach((variable) => {
          const formField = this.form.controls.attributes.controls[variable] as unknown as CustomUntypedFormField;
          formField.disable();
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject(false);
          }
          formField.hidden$.next(true);
        });
      }
    }
  }

  protected onSubmit(): void {

    const values = {
      ...this.form.value,
    };

    if (!this.isNew) {
      delete values.type;
    }

    for (const [key, value] of Object.entries(values.attributes)) {
      if (!value) {
        delete values.attributes[key];
      }
    }

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('reporting.exporters.create', [values]);
    } else {
      request$ = this.ws.call('reporting.exporters.update', [
        this.editingExpoter.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}