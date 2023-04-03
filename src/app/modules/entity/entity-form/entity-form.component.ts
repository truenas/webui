import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import {
  UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, UntypedFormArray, AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiDirectory, ApiParams } from 'app/interfaces/api-directory.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import {
  FieldConfig, FormArrayConfig, FormDictConfig, FormListConfig, FormSelectConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'ix-entity-form',
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService],
})
export class EntityFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  @Input() conf: FormConfiguration;

  pk: string | number;
  fieldSetDisplay = 'default';
  fieldSets: FieldSet[];
  formGroup: UntypedFormGroup;
  fieldConfig: FieldConfig[];
  resourceName: string;
  getFunction: Observable<Record<string, unknown>>;
  submitFunction = this.editCall;
  isNew = false;
  hasConf = true;
  wsResponse: Record<string, unknown>;
  wsfg: AbstractControl;
  saveSubmitText: string = this.translate.instant('Save');
  successMessage: string = this.translate.instant('Settings saved.');

  loaderOpen = false;
  keepLoaderOpen = false;

  get controls(): FieldConfig[] {
    return this.fieldConfig.filter(({ type }) => type !== 'button');
  }
  get changes(): Observable<unknown> {
    return this.formGroup.valueChanges;
  }
  get valid(): boolean {
    return this.formGroup.valid;
  }
  get value(): unknown {
    return this.formGroup.value;
  }

  sub: Subscription;
  error: string;
  success = false;
  data: Record<string, unknown> = {};
  showSpinner = false;
  isFromPending = false;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    // eslint-disable-next-line @typescript-eslint/ban-types
    private fb: UntypedFormBuilder,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    public loader: AppLoaderService,
    private dialog: DialogService,
    public translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {
    this.loader.callStarted.pipe(untilDestroyed(this)).subscribe(() => this.showSpinner = true);
    this.loader.callDone.pipe(untilDestroyed(this)).subscribe(() => this.showSpinner = false);
  }

  ngAfterViewChecked(): void {
    // detect form.pending which will be changed if form use async validator
    if (this.formGroup && this.formGroup.pending !== this.isFromPending) {
      this.isFromPending = this.formGroup.pending;
      this.cdr.detectChanges();
    }
  }

  makeFormGroup(): void {
    // Fallback if no fieldsets are defined
    if (this.conf.fieldSets) {
      this.fieldConfig = [];
      /* Temp patch to support both FieldSet approaches */
      this.fieldSets = (this.conf.fieldSets instanceof FieldSets) ? this.conf.fieldSets.list() : this.conf.fieldSets;
      this.fieldSets.forEach((fieldset) => {
        if (!fieldset.divider) {
          if (fieldset.maxWidth) fieldset.width = '100%';
          else fieldset.width = this.conf.columnsOnForm === 1 || fieldset.colspan === 2 ? '100%' : '50%';
        }

        if (fieldset.config) {
          this.fieldConfig = this.fieldConfig.concat(fieldset.config);
        }
      });
      this.conf.fieldConfig = this.fieldConfig;
    } else {
      this.fieldConfig = this.conf.fieldConfig;
      this.fieldSets = [
        {
          name: 'FallBack',
          class: 'fallback',
          width: '100%',
          divider: false,
          config: this.fieldConfig,
        },
        {
          name: 'divider',
          divider: true,
          width: '100%',
        },
      ];
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    this.fieldConfig.forEach((config) => {
      this.fieldRelationService.setRelation(config, this.formGroup);
    });
  }

  addFormControls(fieldSets: FieldSet[]): void {
    this.fieldSets = this.fieldSets.concat(fieldSets);

    let fieldConfigs: FieldConfig[] = [];
    fieldSets.forEach((fieldSet) => {
      if (!fieldSet.divider) {
        if (fieldSet.maxWidth) {
          fieldSet.width = '100%';
        } else {
          fieldSet.width = this.conf.columnsOnForm === 1 || fieldSet.colspan === 2 ? '100%' : '50%';
        }
      }

      fieldSet.config.forEach((fieldConfig) => {
        const formControl = this.entityFormService.createFormControl(fieldConfig);
        if (formControl) {
          this.formGroup.setControl(fieldConfig.name, formControl);
        }
      });
      fieldConfigs = fieldConfigs.concat(fieldSet.config);
    });

    fieldConfigs.forEach((fieldConfig) => {
      this.fieldRelationService.setRelation(fieldConfig, this.formGroup);
    });

    this.fieldConfig = this.fieldConfig.concat(fieldConfigs);
    this.conf.fieldConfig = this.fieldConfig;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async ngOnInit(): Promise<void> {
    if (this.conf.saveButtonEnabled === undefined) {
      this.conf.saveButtonEnabled = true;
    }
    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    this.makeFormGroup();

    if (this.conf.prerequisite) {
      await this.conf.prerequisite();
    }

    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.sub = this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.resourceName = this.conf.resourceName;
      if (this.resourceName && !this.resourceName.endsWith('/')) {
        this.resourceName = this.resourceName + '/';
      }
      if (this.conf.isEntity) {
        if (this.conf.rowid) {
          this.pk = this.conf.rowid;
        } else {
          this.pk = params.pk;
        }

        if (this.pk && !this.conf.isNew) {
          if (this.conf.editCall) {
            // this is strange so I AM NOTING it...  this.editCall internally calls this.conf.editCall with some fluff.
            this.submitFunction = this.editCall;
            // But to my eyes it almost looks like a bug when I first saw it. FYI
          } else {
            this.resourceName = `${this.resourceName}${this.pk}/`;
          }
        } else {
          if (this.conf.saveSubmitText === undefined) {
            this.saveSubmitText = this.translate.instant('Save');
          }
          if (this.conf.addCall) {
            this.submitFunction = this.addCall;
          }
          this.isNew = true;
        }
      }

      // Make sure fieldSetDisplay is defined
      if (this.conf.fieldSetDisplay) {
        this.fieldSetDisplay = this.conf.fieldSetDisplay;
      } else {
        this.fieldSetDisplay = 'default';
      }

      if (!this.conf.queryCall) {
        this.getFunction = undefined;
      } else if (this.conf.queryCall) {
        if (this.pk) {
          let pk = this.pk;
          let filterParam = [];
          if (this.conf.pk) {
            filterParam.push(this.conf.pk);
            pk = this.conf.pk;
          }
          if (this.conf.queryCallOption) {
            filterParam.push(this.conf.queryCallOption);
          }
          if (this.conf.customFilter) {
            filterParam = this.conf.customFilter;
          }
          if (this.conf.queryKey) {
            filterParam = [[[this.conf.queryKey, '=', parseInt(pk as string, 10) || pk]]]; // parse pk to int if possible (returns NaN otherwise)
          }
          this.getFunction = this.ws.call(
            this.conf.queryCall,
            filterParam as ApiParams<keyof ApiDirectory>,
          ) as Observable<Record<string, unknown>>;
        } else {
          this.getFunction = this.ws.call(this.conf.queryCall, []) as Observable<Record<string, unknown>>;
        }
      }

      if (!this.isNew && this.conf.queryCall && this.getFunction) {
        this.loader.open();
        this.loaderOpen = true;
        this.getFunction.pipe(untilDestroyed(this)).subscribe((response) => {
          if (response.data) {
            this.data = response.data as Record<string, unknown>;
            if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
              this.data = this.conf.resourceTransformIncomingRestData(this.data) as Record<string, unknown>;
              const extraFieldSets = this.data.extra_fieldsets as FieldSet[];
              if (extraFieldSets) {
                this.addFormControls(extraFieldSets);
                delete this.data.extra_fieldsets;
              }
            }
            Object.keys(this.data).forEach((key) => {
              const fg = this.formGroup.controls[key];
              if (fg) {
                const currentField: FieldConfig = this.fieldConfig.find((control) => control.name === key);
                if (currentField.type === 'array') {
                  this.setArrayValue(this.data[key] as Record<string, unknown>[], fg as UntypedFormArray, key);
                } else if (currentField.type === 'list') {
                  this.setListValue(this.data[key] as string[], fg as UntypedFormArray, key);
                } else if (currentField.type === 'dict') {
                  fg.patchValue(this.data[key]);
                } else {
                  const selectField: FormSelectConfig = currentField as FormSelectConfig;
                  if (!_.isArray(this.data[key]) && selectField.type === 'select' && selectField.multiple && this.data[key]) {
                    this.data[key] = _.split(this.data[key] as string, ',');
                  }
                  if (!(selectField.type === 'select' && selectField.options.length === 0)) {
                    fg.setValue(this.data[key]);
                  }
                }
              }
            });
          } else {
            if (response[0]) {
              this.wsResponse = response[0] as Record<string, unknown>;
            } else {
              this.wsResponse = response;
            }

            if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
              this.wsResponse = this.conf.resourceTransformIncomingRestData(this.wsResponse) as Record<string, unknown>;
              const extraFieldSets = this.wsResponse.extra_fieldsets as FieldSet[];
              if (extraFieldSets) {
                this.addFormControls(extraFieldSets);
                delete this.wsResponse.extra_fieldsets;
              }
            }
            if (this.conf.dataHandler) {
              this.conf.dataHandler(this);
            } else {
              Object.keys(this.wsResponse).forEach((key) => {
                this.wsfg = this.formGroup.controls[key];
                if (this.wsfg) {
                  const currentField: FieldConfig = this.fieldConfig.find((control) => control.name === key);
                  const selectField: FormSelectConfig = currentField as FormSelectConfig;

                  if (currentField.type === 'array') {
                    this.setArrayValue(
                      this.wsResponse[key] as Record<string, unknown>[],
                      this.wsfg as UntypedFormArray,
                      key,
                    );
                  } else if (currentField.type === 'list' || currentField.type === 'dict') {
                    this.setObjectListValue(
                      this.wsResponse[key] as Record<string, unknown>[] | Record<string, unknown[]>,
                      this.wsfg,
                      currentField,
                    );
                  } else if (!(selectField.type === 'select' && selectField.options.length === 0)) {
                    this.wsfg.setValue(this.wsResponse[key]);
                  }
                } else if (this.conf.dataAttributeHandler) {
                  this.conf.dataAttributeHandler(this);
                }
              });

              this.formGroup.patchValue(this.wsResponse);
            }
          }

          if (this.conf.initial) {
            this.conf.initial.call(this.conf, this);
          }
          if (!this.keepLoaderOpen) {
            this.loader.close();
            this.loaderOpen = false;
          }
        });
      }
    });
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
    if (this.conf.blurEvent) {
      this.conf.blurEvent(this);
    }
  }

  ngOnChanges(): void {
    if (!this.formGroup) {
      return;
    }

    const controls = Object.keys(this.formGroup.controls);
    const configControls = this.controls.map((item) => item.name);

    controls.filter((control) => !configControls.includes(control))
      .forEach((control) => this.formGroup.removeControl(control));

    configControls.filter((control) => !controls.includes(control))
      .forEach((name) => {
        const config = this.fieldConfig.find((control) => control.name === name);
        this.formGroup.addControl(name, this.createControl(config));
      });
  }

  goBack(): void {
    let route = this.conf.routeCancel;
    if (!route) {
      route = this.conf.routeSuccess;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  addCall(body: unknown): Observable<unknown> {
    const payload: unknown[] = [];
    const call = this.conf.addCall;
    payload.push(body);

    if (this.conf.isCreateJob) {
      return this.ws.job(call, payload as ApiParams<keyof ApiDirectory>);
    }
    return this.ws.call(call, payload as ApiParams<keyof ApiDirectory>);
  }

  editCall(body: unknown): Observable<unknown> {
    const payload: unknown[] = [body];
    if (this.pk) {
      payload.unshift(this.pk);
    }

    if (this.conf.isEditJob) {
      return this.ws.job(this.conf.editCall, payload as ApiParams<keyof ApiDirectory>);
    }
    return this.ws.call(this.conf.editCall, payload as ApiParams<keyof ApiDirectory>);
  }

  onSubmit(event: Event): void {
    if (this.conf.confirmSubmit && this.conf.confirmSubmitDialog) {
      this.dialog.confirm({
        title: this.conf.confirmSubmitDialog.title,
        message: this.conf.confirmSubmitDialog.message,
        hideCheckbox: this.conf.confirmSubmitDialog.hasOwnProperty('hideCheckbox')
          ? this.conf.confirmSubmitDialog.hideCheckbox
          : false,
        buttonText: this.conf.confirmSubmitDialog.hasOwnProperty('button')
          ? this.conf.confirmSubmitDialog.button
          : this.translate.instant('Ok'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.doSubmit(event);
      });
    } else {
      this.doSubmit(event);
    }
  }

  doSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);

    if ('id' in value) {
      delete value.id;
    }

    if (this.conf.clean) {
      value = this.conf.clean.call(this.conf, value);
    }

    value = new EntityUtils().changeNullString2Null(value);

    if (this.conf.beforeSubmit) {
      this.conf.beforeSubmit(value);
    }
    if (this.conf.customEditCall && this.pk) {
      this.conf.customEditCall(value);
      return;
    }

    if (this.conf.customSubmit) {
      this.conf.customSubmit(value);
    } else {
      this.loader.open();
      this.loaderOpen = true;
      this.submitFunction(value)
        .pipe(untilDestroyed(this)).subscribe({
          next: (response) => {
            this.loader.close();
            this.loaderOpen = false;

            const responseAsJob = response as Job;
            if ((this.conf.isEditJob || this.conf.isCreateJob) && responseAsJob.error) {
              if (responseAsJob.exc_info && responseAsJob.exc_info.extra) {
                this.dialog.error(this.errorHandler.parseJobError(responseAsJob));
              } else {
                this.dialog.error({
                  title: this.translate.instant('Error'),
                  message: responseAsJob.error,
                  backtrace: responseAsJob.exception,
                });
              }
            } else {
              if (this.conf.afterSave) {
                this.conf.afterSave(this);
              } else {
                if (this.conf.routeSuccess) {
                  this.router.navigate(new Array('/').concat(
                    this.conf.routeSuccess,
                  ));
                } else {
                  this.success = true;
                  this.formGroup.markAsPristine();
                }

                if (this.conf.afterSubmit) {
                  this.conf.afterSubmit(value);
                }
                if (this.conf.responseOnSubmit) {
                  this.conf.responseOnSubmit(response);
                }
              }
              this.modalService.closeSlideIn().then((closed) => {
                if (closed && this.conf.afterModalFormClosed) {
                  this.conf.afterModalFormClosed();
                }
              });
            }
          },
          error: (error: WebsocketError) => {
            this.loader.close();
            this.loaderOpen = false;
            if (this.conf.errorReport) {
              this.conf.errorReport(error);
            } else if (error.hasOwnProperty('reason') && (error.hasOwnProperty('trace'))) {
              this.dialog.error(this.errorHandler.parseWsError(error));
            } else {
              this.dialog.error(this.errorHandler.parseError(error));
            }
          },
        });
    }
  }

  clearErrors(): void {
    this.fieldConfig.forEach((fieldConfig) => {
      fieldConfig.errors = '';
      fieldConfig.hasErrors = false;
    });
  }

  isFieldsetAvailable(fieldset: FieldSet): boolean {
    if (fieldset.config) {
      return fieldset.config.some((config) => !config.isHidden);
    }
    return false;
  }

  isShow(id: string): boolean {
    if (this.conf.isBasicMode) {
      if (this.conf.advancedFields.includes(id)) {
        return false;
      }
    } else if (this.conf.basicFields !== undefined && this.conf.basicFields.includes(id)) {
      return false;
    }

    return true;
  }

  goConf(): void {
    let route = this.conf.routeConf;
    if (!route) {
      route = this.conf.routeSuccess;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  createControl(config: FieldConfig): UntypedFormControl {
    const { disabled, validation, value } = config;
    return this.fb.control({ disabled, value }, validation);
  }

  setDisabled(name: string, disable: boolean, hide?: boolean): void {
    const fieldConfig = this.fieldConfig.find((item) => item.name === name);
    if (fieldConfig) {
      this.fieldRelationService.setDisabled(fieldConfig, this.formGroup, disable, hide);
    }
  }

  setValue(name: string, value: unknown): void {
    this.formGroup.controls[name].setValue(value, { emitEvent: true });
  }

  setArrayValue(data: Record<string, unknown>[], formArray: UntypedFormArray, name: string): void {
    let arrayFieldConfigs: FieldConfig[];
    this.fieldConfig.forEach((config) => {
      if (config.name === name) {
        const arrayConfig = config as FormArrayConfig;
        arrayFieldConfigs = arrayConfig.formarray;
      }
    });

    data.forEach((arrayValue, index) => {
      this.conf.initialCount += 1;
      this.conf.initialCount_default += 1;

      const formGroup = this.entityFormService.createFormGroup(arrayFieldConfigs);
      Object.entries(arrayValue).forEach(([i, value]) => {
        const formControl = formGroup.controls[i];
        formControl.setValue(value);
      });
      formArray.insert(index, formGroup);
    });
  }

  setListValue(data: string[], formArray: UntypedFormArray, fieldName: string): void {
    const fieldConfig = this.fieldConfig.find((conf) => conf.name === fieldName);
    const config: FormListConfig = fieldConfig as FormListConfig;
    const template: FieldConfig[] = config.templateListField;

    config.listFields = [];
    formArray.clear();

    data.forEach((val, index) => {
      this.conf.initialCount += 1;
      this.conf.initialCount_default += 1;
      config.listFields.push(template);
      const formGroup = this.entityFormService.createFormGroup(template);
      for (const field of template) {
        formGroup.setValue({ [field.name]: val });
      }
      formArray.insert(index, formGroup);
    });
  }

  addExtraFieldConfigs(value: Record<string, unknown>[] | Record<string, unknown[]>, fieldConfig: FieldConfig): void {
    if (value) {
      if (fieldConfig.type === 'list' && Array.isArray(value)) {
        const listConfig: FormListConfig = fieldConfig;
        listConfig.listFields = [];
        value.forEach((listValue) => {
          const templateListField = _.cloneDeep(listConfig.templateListField);
          templateListField.forEach((subFieldConfig) => {
            const subValue = listValue[subFieldConfig.name];
            if (subFieldConfig.type === 'list' || subFieldConfig.type === 'dict') {
              this.addExtraFieldConfigs(
                subValue as Record<string, unknown>[] | Record<string, unknown[]>,
                subFieldConfig,
              );
            }
          });
          listConfig.listFields.push(templateListField);
        });
      } else if (fieldConfig.type === 'dict') {
        const dictConfig = fieldConfig;
        if (dictConfig.subFields) {
          dictConfig.subFields.forEach((subFieldConfig) => {
            const subValue = (value as Record<string, unknown[]>)[subFieldConfig.name];
            if (subFieldConfig.type === 'list' || subFieldConfig.type === 'dict') {
              this.addExtraFieldConfigs(
                subValue as Record<string, unknown>[] | Record<string, unknown[]>,
                subFieldConfig,
              );
            }
          });
        }
      }
    }
  }

  addExtraFormControls(fieldConfig: FieldConfig, formControl: AbstractControl): void {
    const listConfig: FormListConfig = fieldConfig as FormListConfig;
    const dictConfig: FormDictConfig = fieldConfig as FormDictConfig;
    if (listConfig.type === 'list' && listConfig.listFields) {
      listConfig.listFields.forEach((field) => {
        const formGroup = this.entityFormService.createFormGroup(field);
        (formControl as UntypedFormArray).push(formGroup);
      });
      for (let i = 0; i < listConfig.listFields.length; i++) {
        listConfig.listFields[i].forEach((subFieldConfig) => {
          this.fieldRelationService.setRelation(
            subFieldConfig, (formControl as UntypedFormArray).at(i) as UntypedFormGroup,
          );
        });
      }
    } else if (dictConfig.type === 'dict' && dictConfig.subFields) {
      dictConfig.subFields.forEach((subFieldConfig) => {
        if (subFieldConfig.type === 'list' || subFieldConfig.type === 'dict') {
          const subFromControl = formControl.get(subFieldConfig.name);
          this.addExtraFormControls(subFieldConfig, subFromControl);
        }
      });
    }
  }

  setObjectListValue(
    values: Record<string, unknown>[] | Record<string, unknown[]>,
    formControl: AbstractControl,
    fieldConfig: FieldConfig,
  ): void {
    this.addExtraFieldConfigs(values, fieldConfig);
    this.addExtraFormControls(fieldConfig, formControl);
  }

  ngOnDestroy(): void {
    if (typeof (this.sub) !== 'undefined' && typeof (this.sub.unsubscribe) !== 'undefined') {
      this.sub.unsubscribe();
      if (this.loaderOpen) {
        this.loader.close();
        this.loaderOpen = false;
      }
    }
  }
}
