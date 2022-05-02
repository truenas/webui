import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormArray, FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseCreate, ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import {
  AddListItemEmitter, DeleteListItemEmitter, DynamicFormSchema, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Relation } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './chart-wizard.component.html',
  styleUrls: ['./chart-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartWizardComponent {
  title: string;
  isLoading = false;
  dynamicSection: DynamicFormSchema[] = [];
  catalogApp: CatalogApp;
  selectedVersionKey: string;
  dialogRef: MatDialogRef<EntityJobComponent>;

  form = this.formBuilder.group({
    release_name: ['', Validators.required],
    version: ['', Validators.required],
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

  setCatalogApp(chartSchema: CatalogApp): void {
    this.catalogApp = chartSchema;
    this.title = this.catalogApp.name;
    let hideVersion = false;
    if (this.catalogApp.name === ixChartApp) {
      this.title = helptext.launch;
      hideVersion = true;
    }
    const versionKeys: string[] = [];
    Object.keys(this.catalogApp.versions).forEach((versionKey) => {
      if (this.catalogApp.versions[versionKey].healthy) {
        versionKeys.push(versionKey);
      }
    });

    if (!this.selectedVersionKey) {
      this.selectedVersionKey = versionKeys[0];
    }

    this.form.controls.version.setValue(this.selectedVersionKey);

    this.dynamicSection.push({
      name: 'Application name',
      description: '',
      schema: [
        {
          controlName: 'release_name',
          type: 'input',
          title: helptext.chartForm.release_name.placeholder,
          required: true,
        },
        {
          controlName: 'version',
          type: 'select',
          title: helptext.chartWizard.nameGroup.version,
          required: true,
          options: of(versionKeys.map((option) => ({ value: option, label: option }))),
          hidden: hideVersion,
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
            if (formGroup.controls[relation.fieldName].value !== relation.operatorValue) {
              formGroup.controls[chartSchemaNode.variable].disable();
            }
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

  onSubmit(): void {
    const data = this.form.value;
    delete data.version;

    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.installing,
      },
    });

    this.dialogRef.componentInstance.setCall('chart.release.create', [{
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: this.catalogApp.catalog.train,
      version: this.selectedVersionKey,
      values: data,
    } as ChartReleaseCreate]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.slideInService.close();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.exc_info && res.exc_info.extra) {
        new EntityUtils().handleWsError(this, res);
      } else {
        this.dialogService.errorReport('Error', res.error, res.exception);
      }
    });
  }
}
