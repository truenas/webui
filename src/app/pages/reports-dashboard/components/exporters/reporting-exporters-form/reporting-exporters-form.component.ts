import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import {
  UntypedFormGroup, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { getDynamicFormSchemaNode } from 'app/helpers/get-dynamic-form-schema-node';
import {
  DynamicFormSchema, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  ReportingExporterList,
  ReportingExporterKey as ReportingExporterType,
  ReportingExporterSchema,
  ReportingExporter,
} from 'app/interfaces/reporting-exporters.interface';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import {
  IxDynamicFormComponent,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-reporting-exporters-form',
  templateUrl: './reporting-exporters-form.component.html',
  styleUrls: ['./reporting-exporters-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxDynamicFormComponent,
  ],
})
export class ReportingExportersFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingExporter;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Reporting Exporter')
      : this.translate.instant('Edit Reporting Exporter');
  }

  form = new FormGroup({
    name: new FormControl(null as string | null, Validators.required),
    enabled: new FormControl(true),
    type: new FormControl(null as string | null, Validators.required),
    attributes: new FormGroup<Record<string, unknown>>({}),
  });

  get formGroup(): UntypedFormGroup {
    return this.form.controls.attributes as UntypedFormGroup;
  }

  protected isLoading = signal(false);
  protected isLoadingSchemas = signal(true);
  dynamicSection: DynamicFormSchema[] = [];
  protected editingExporter: ReportingExporter | undefined;

  protected exporterTypeOptions$: Observable<Option[]>;
  protected reportingExporterList: ReportingExporterList[] = [];
  protected readonly requiredRoles = [Role.ReportingWrite];

  constructor(
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    public slideInRef: SlideInRef<ReportingExporter | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingExporter = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.loadSchemas();
    this.handleTypeChange();
  }

  handleTypeChange(): void {
    this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (value) => {
        this.onExporterTypeChanged(value as ReportingExporterType);
      },
    });
  }

  private loadSchemas(): void {
    this.isLoading.set(true);
    this.getExportersSchemas().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (schemas: ReportingExporterSchema[]): void => {
        this.setExporterTypeOptions(schemas);
        this.createExporterControls(schemas);

        if (this.editingExporter) {
          this.form.patchValue({
            ...this.editingExporter,
            type: this.editingExporter.attributes['exporter_type'] as string,
          });
        }

        this.isLoading.set(false);
        this.isLoadingSchemas.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isLoading.set(false);
        this.isLoadingSchemas.set(false);
      },
    });
  }

  getExportersSchemas(): Observable<ReportingExporterSchema[]> {
    return this.api.call('reporting.exporters.exporter_schemas');
  }

  setExporterTypeOptions(schemas: ReportingExporterSchema[]): void {
    this.exporterTypeOptions$ = of(
      schemas.map((schema) => ({
        label: ignoreTranslation(schema.key),
        value: schema.key,
      })),
    );
  }

  createExporterControls(schemas: ReportingExporterSchema[]): void {
    for (const schema of schemas) {
      for (const input of schema.schema) {
        this.form.controls.attributes.addControl(
          input._name_,
          new FormControl(input.const || '', input._required_ ? [Validators.required] : []),
        );
      }
    }

    this.dynamicSection = [{
      name: '',
      description: '',
      schema: schemas
        .map((schema) => this.parseSchemaForDynamicSchema(schema))
        .reduce((all, val) => all.concat(val), []),
    }];

    this.reportingExporterList = schemas.map((schema) => this.parseSchemaForExporterList(schema));
    this.onExporterTypeChanged(null);
  }

  parseSchemaForDynamicSchema(schema: ReportingExporterSchema): DynamicFormSchemaNode[] {
    return schema.schema
      .filter((input) => !input.const)
      .map((input) => getDynamicFormSchemaNode(input));
  }

  parseSchemaForExporterList(schema: ReportingExporterSchema): ReportingExporterList {
    const variables = schema.schema.map((input) => input._name_);
    return { key: schema.key, variables };
  }

  onExporterTypeChanged(type: ReportingExporterType | null): void {
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

    values.attributes['exporter_type'] = values.type;
    delete values.type;

    for (const [key, value] of Object.entries(values.attributes)) {
      if (value == null || value === '') {
        delete values.attributes[key];
      }
    }

    this.isLoading.set(true);
    let request$: Observable<unknown>;

    if (this.editingExporter) {
      request$ = this.api.call('reporting.exporters.update', [
        this.editingExporter.id,
        values,
      ]);
    } else {
      request$ = this.api.call('reporting.exporters.create', [values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
