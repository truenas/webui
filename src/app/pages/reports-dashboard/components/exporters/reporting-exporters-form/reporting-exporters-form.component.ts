import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormControl, UntypedFormGroup, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
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
import { DialogService } from 'app/modules/dialog/dialog.service';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-reporting-exporters-form',
  templateUrl: './reporting-exporters-form.component.html',
  styleUrls: ['./reporting-exporters-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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

  form = this.fb.group({
    name: [null as string, Validators.required],
    enabled: [true],
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
  protected readonly requiredRoles = [Role.ReportingWrite];

  constructor(
    private fb: FormBuilder,
    private slideInRef: SlideInRef<ReportingExportersFormComponent>,
    private translate: TranslateService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    @Inject(SLIDE_IN_DATA) private editingExporter: ReportingExporter,
  ) { }

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
    this.isLoading = true;
    this.getExportersSchemas().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (schemas: ReportingExporterSchema[]): void => {
        this.setExporterTypeOptions(schemas);
        this.createExporterControls(schemas);

        if (!this.isNew) {
          this.form.patchValue(this.editingExporter);
        }

        this.isLoading = false;
        this.isLoadingSchemas = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseError(error));
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
          input._name_,
          new FormControl('', input._required_ ? [Validators.required] : []),
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
    return schema.schema.map((input) => getDynamicFormSchemaNode(input));
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
      if (value == null || value === '') {
        delete values.attributes[key];
      }
    }

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('reporting.exporters.create', [values]);
    } else {
      request$ = this.ws.call('reporting.exporters.update', [
        this.editingExporter.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
