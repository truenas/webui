import { Location } from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChildren,
  AfterViewInit,
  OnChanges,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormArray, Validators, AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import { RestService, WebSocketService, SystemGeneralService } from '../../../../services';
import { Subscription } from 'rxjs';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { EntityTemplateDirective } from '../entity-template.directive';
import { EntityUtils } from '../utils';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldConfig } from './models/field-config.interface';
import { FieldSet } from './models/fieldset.interface';
import { EntityFormService } from './services/entity-form.service';
import { FieldRelationService } from './services/field-relation.service';
import { DialogService } from '../../../../services';
import { T } from '../../../../translate-marker';

import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'entity-form',
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService],
})
export class EntityFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, AfterViewChecked {
  @Input('conf') conf: FormConfiguration;

  pk: any;
  fieldSetDisplay = 'default';
  fieldSets: FieldSet[];
  formGroup: FormGroup;
  fieldConfig: FieldConfig[];
  resourceName: string;
  getFunction: any;
  submitFunction = this.editCall;
  isNew = false;
  hasConf = true;
  wsResponse: any;
  wsfg: any;
  wsResponseIdx: number;
  queryResponse: any;
  saveSubmitText = T('Save');
  showPassword = false;
  successMessage = T('Settings saved.');
  private getAdvancedConfig: Subscription;

  protected loaderOpen = false;
  protected keepLoaderOpen = false;

  get controls() {
    return this.fieldConfig.filter(({ type }) => type !== 'button');
  }
  get changes() { return this.formGroup.valueChanges; }
  get valid() { return this.formGroup.valid; }
  get value() { return this.formGroup.value; }

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;

  @ViewChildren('component') components: any[];

  sub: any;
  error: string;
  success = false;
  data: any = {};
  showSpinner = false;
  isFromPending = false;
  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected location: Location, private fb: FormBuilder,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    private dialog: DialogService,
    public translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private sysGeneralService: SystemGeneralService) {
    this.loader.callStarted.subscribe(() => this.showSpinner = true);
    this.loader.callDone.subscribe(() => this.showSpinner = false);
  }

  ngAfterViewInit() {
    this.templates.forEach((item) => {
      if (item.type === 'TOP') {
        this.templateTop = item.templateRef;
      }
    });
  }

  ngAfterViewChecked() {
    // detect form.pending which will be changed if form use async validator
    if (this.formGroup && this.formGroup.pending !== this.isFromPending) {
      this.isFromPending = this.formGroup.pending;
      this.cdr.detectChanges();
    }
  }

  makeFormGroup() {
    // Fallback if no fieldsets are defined
    if (this.conf.fieldSets) {
      this.fieldConfig = [];
      /* Temp patch to support both FieldSet approaches */
      this.fieldSets = (this.conf.fieldSets instanceof FieldSets) ? this.conf.fieldSets.list() : this.conf.fieldSets;
      for (let i = 0; i < this.fieldSets.length; i++) {
        const fieldset = this.fieldSets[i];
        if (!fieldset.divider) {
          if (fieldset.maxWidth) fieldset.width = '100%';
          else fieldset.width = this.conf.columnsOnForm === 1 || fieldset.colspan === 2 ? '100%' : '50%';
        }

        if (fieldset.config) {
          this.fieldConfig = this.fieldConfig.concat(fieldset.config);
        }
      }
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

    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.fieldRelationService.setRelation(config, this.formGroup);
      }
    }
  }

  addFormControls(fieldSet: FieldSet) {
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

    this.fieldConfig = this.fieldConfig.concat(fieldSet.config);
    this.conf.fieldConfig = this.fieldConfig;
  }

  async ngOnInit() {
    // get system general setting
    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res) => {
      if (res) {
        if (this.conf.isBasicMode) {
          if (res.advancedmode) {
            this.conf.isBasicMode = false;
          } else {
            this.conf.isBasicMode = true;
          }
        }
      }
    });

    if (this.conf.save_button_enabled == undefined) {
      this.conf.save_button_enabled = true;
    }
    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }
    if (this.conf.prerequisite) {
      await this.conf.prerequisite();
    }

    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.sub = this.route.params.subscribe((params) => {
      this.resourceName = this.conf.resource_name;
      if (this.resourceName && !this.resourceName.endsWith('/')) {
        this.resourceName = this.resourceName + '/';
      }
      if (this.conf.isEntity) {
        if (this.conf.rowid) {
          this.pk = this.conf.rowid;
          // delete this.conf.rowid;
        } else {
          this.pk = params['pk'];
        }

        if (this.pk && !this.conf.isNew) {
          if (this.conf.editCall) {
            this.submitFunction = this.editCall; // this is strange so I AM NOTING it...  this.editCall internally calls this.conf.editCall with some fluff.
            // But to my eyes it almost looks like a bug when I first saw it. FYI
          } else {
            // this.submitFunction = this.editSubmit;
            this.resourceName = this.resourceName + this.pk + '/';
          }
        } else {
          if (this.conf.saveSubmitText === undefined) {
            this.saveSubmitText = T('Save');
          }
          if (this.conf.addCall) {
            this.submitFunction = this.addCall;
          } else {
            // this.submitFunction = this.addSubmit;
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

      this.makeFormGroup();

      if (!this.conf.queryCall) {
        this.getFunction = this.noGetFunction();
      } else if (this.conf.queryCall) {
        if (this.pk) {
          let pk = this.pk;
          let filter = [];
          if (this.conf.pk) {
            filter.push(this.conf.pk);
            pk = this.conf.pk;
          }
          if (this.conf.queryCallOption) {
            filter.push(this.conf.queryCallOption);
          }
          if (this.conf.customFilter) {
            filter = this.conf.customFilter;
          }
          if (this.conf.queryKey) {
            filter = [[[this.conf.queryKey, '=', parseInt(pk, 10) || pk]]]; // parse pk to int if possible (returns NaN otherwise)
          }
          this.getFunction = this.ws.call(this.conf.queryCall, filter);
        } else {
          this.getFunction = this.ws.call(this.conf.queryCall, []);
        }
      } else {
        let getQuery = this.resourceName;
        if (this.conf.custom_get_query) {
          getQuery = this.conf.custom_get_query;
        }
        this.getFunction = this.rest.get(getQuery, {}, this.conf.route_usebaseUrl);
      }

      if (!this.isNew && this.conf.queryCall && this.getFunction) {
        this.loader.open();
        this.loaderOpen = true;
        this.getFunction.subscribe((res: any) => {
          if (res.data) {
            this.data = res.data;
            if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
              this.data = this.conf.resourceTransformIncomingRestData(this.data);
              const extraFieldSet = this.data['extra_fieldset'];
              if (extraFieldSet) {
                this.fieldSets.push(extraFieldSet);
                this.addFormControls(extraFieldSet);
                delete this.data['extra_fieldset'];
              }
            }
            for (const key in this.data) {
              const fg = this.formGroup.controls[key];
              if (fg) {
                const current_field = this.fieldConfig.find((control) => control.name === key);
                if (current_field.type === 'array') {
                  this.setArrayValue(this.data[key], fg, key);
                } else if (current_field.type === 'list') {
                  this.setListValue(this.data[key], fg as FormArray, key);
                } else if (current_field.type === 'dict') {
                  fg.patchValue(this.data[key]);
                } else {
                  if (!_.isArray(this.data[key]) && current_field.type === 'select' && current_field.multiple) {
                    if (this.data[key]) {
                      this.data[key] = _.split(this.data[key], ',');
                    }
                  }
                  if (!(current_field.type === 'select' && current_field.options.length == 0)) {
                    fg.setValue(this.data[key]);
                  }
                }
              }
            }
          } else {
            this.queryResponse = res;
            if (res[0]) {
              this.wsResponse = res[0];
            } else {
              this.wsResponse = res;
            }

            if (typeof (this.conf.resourceTransformIncomingRestData) !== 'undefined') {
              this.wsResponse = this.conf.resourceTransformIncomingRestData(this.wsResponse);
              const extraFieldSet = this.wsResponse['extra_fieldset'];
              if (extraFieldSet) {
                this.fieldSets.push(extraFieldSet);
                this.addFormControls(extraFieldSet);
                delete this.wsResponse['extra_fieldset'];
              }
            }
            if (this.conf.dataHandler) {
              this.conf.dataHandler(this);
            } else {
              for (const key in this.wsResponse) {
                this.wsfg = this.formGroup.controls[key];
                this.wsResponseIdx = this.wsResponse[key];
                if (this.wsfg) {
                  const current_field = this.fieldConfig.find((control) => control.name === key);
                  console.log('current=', key, current_field);
                  if (current_field.type === 'array') {
                    this.setArrayValue(this.wsResponse[key], this.wsfg, key);
                  } else if (current_field.type === 'list') {
                    this.setObjectListValue(this.wsResponse[key], this.wsfg, current_field);
                  } else if (current_field.type === 'dict') {
                    this.wsfg.patchValue(this.wsResponse[key]);
                  } else if (!(current_field.type === 'select' && current_field.options.length == 0)) {
                    this.wsfg.setValue(this.wsResponse[key]);
                  }
                } else if (this.conf.dataAttributeHandler) {
                  this.conf.dataAttributeHandler(this);
                }
              }
            }
          }

          if (this.conf.initial) {
            this.conf.initial.bind(this.conf)(this);
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

  noGetFunction() {

  }

  ngOnChanges() {
    if (this.formGroup) {
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
  }

  goBack() {
    let route = this.conf.route_cancel;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  addCall(body: any) {
    const payload = [];
    const call = this.conf.addCall;
    payload.push(body);
    return this.ws.call(call, payload);
  }

  editSubmit(body: any) {
    let resource = this.resourceName;
    if (this.conf.custom_edit_query) {
      resource = this.conf.custom_edit_query;
    }

    return this.rest.put(resource, { body }, this.conf.route_usebaseUrl);
  }

  editCall(body: any) {
    const payload = [body];
    if (this.pk) {
      payload.unshift(this.pk);
    }

    if (this.conf.isEditJob) {
      return this.ws.job(this.conf.editCall, payload);
    }
    return this.ws.call(this.conf.editCall, payload);
  }

  addSubmit(body: any) {
    let resource = this.resourceName;
    if (this.conf.custom_add_query) {
      resource = this.conf.custom_add_query;
    }

    return this.rest.post(resource, { body }, this.conf.route_usebaseUrl);
  }

  onSubmit(event: Event) {
    if (this.conf.confirmSubmit && this.conf.confirmSubmitDialog) {
      this.dialog.confirm(
        this.conf.confirmSubmitDialog['title'],
        this.conf.confirmSubmitDialog['message'],
        this.conf.confirmSubmitDialog.hasOwnProperty('hideCheckbox')
          ? this.conf.confirmSubmitDialog['hideCheckbox']
          : false,
        this.conf.confirmSubmitDialog.hasOwnProperty('button')
          ? this.conf.confirmSubmitDialog['button']
          : T('Ok'),
      ).subscribe((confirm: boolean) => {
        if (!confirm) {
          return;
        }

        this.doSubmit(event);
      });
    } else {
      this.doSubmit(event);
    }
  }

  doSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);
    for (const i in value) {
      if (value.hasOwnProperty(i)) {
        if ((this.conf as any)['clean_' + i]) {
          value = (this.conf as any)['clean_' + i](value, i);
        }
      }
    }
    if ('id' in value) {
      delete value['id'];
    }

    if (this.conf.clean) {
      value = this.conf.clean.bind(this.conf)(value);
    }

    value = new EntityUtils().changeNullString2Null(value);

    if (this.conf.beforeSubmit) {
      this.conf.beforeSubmit(value);
    }
    if (this.conf.customEditCall && this.pk) {
      return this.conf.customEditCall(value);
    }

    if (this.conf.customSubmit) {
      this.conf.customSubmit(value);
    } else {
      this.loader.open();
      this.loaderOpen = true;
      this.submitFunction(value)
        .subscribe(
          (res) => {
            this.loader.close();
            this.loaderOpen = false;

            if (this.conf.isEditJob && res.error) {
              if (res.exc_info && res.exc_info.extra) {
                new EntityUtils().handleWSError(this, res);
              } else {
                this.dialog.errorReport('Error', res.error, res.exception);
              }
            } else {
              if (this.conf.afterSave) {
                this.conf.afterSave(this);
              } else {
                if (this.conf.route_success) {
                  this.router.navigate(new Array('/').concat(
                    this.conf.route_success,
                  ));
                } else {
                  this.success = true;
                  this.formGroup.markAsPristine();
                }

                if (this.conf.afterSubmit) {
                  this.conf.afterSubmit(value);
                }
                if (this.conf.responseOnSubmit) {
                  this.conf.responseOnSubmit(res);
                }
              }
              this.modalService.close('slide-in-form').then((closed) => {
                if (closed && this.conf.afterModalFormClosed) {
                  this.conf.afterModalFormClosed();
                }
              });
            }
          },
          (res) => {
            this.loader.close();
            this.loaderOpen = false;
            if (this.conf.errorReport) {
              this.conf.errorReport(res);
            } else if (res.hasOwnProperty('reason') && (res.hasOwnProperty('trace'))) {
              new EntityUtils().handleWSError(this, res);
            } else {
              new EntityUtils().handleError(this, res);
            }
          },
        );
    }
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  isFieldsetAvailabel(fieldset: any) {
    if (fieldset.config) {
      for (let i = 0; i < fieldset.config.length; i++) {
        if (!fieldset.config[i].isHidden) {
          return true;
        }
      }
    }
    return false;
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
        return false;
      }
    } else if (this.conf.basic_field !== undefined && this.conf.basic_field.indexOf(id) > -1) {
      return false;
    }

    if (this.conf.hide_fileds !== undefined) {
      if (this.conf.hide_fileds.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

  goConf() {
    let route = this.conf.route_conf;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  createControl(config: FieldConfig) {
    const { disabled, validation, value } = config;
    return this.fb.control({ disabled, value }, validation);
  }

  setDisabled(name: string, disable: boolean, hide?: boolean, status?: string) {
    const fieldConfig = this.fieldConfig.find((item) => item.name === name);
    if (fieldConfig) {
      this.fieldRelationService.setDisabled(fieldConfig, this.formGroup, disable, hide, status);
    }
  }

  setValue(name: string, value: any) {
    this.formGroup.controls[name].setValue(value, { emitEvent: true });
  }

  setArrayValue(data: any[], formArray: any, name: string) {
    let array_controls: any;
    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.name === name) {
        array_controls = config.formarray;
      }
    }

    if (this.conf.preHandler) {
      data = this.conf.preHandler(data, formArray);
    }

    data.forEach((value, index) => {
      this.conf.initialCount += 1;
      this.conf.initialCount_default += 1;

      const formGroup = this.entityFormService.createFormGroup(array_controls);
      for (const i in value) {
        const formControl = formGroup.controls[i];
        formControl.setValue(value[i]);
      }
      formArray.insert(index, formGroup);
    });
  }

  setListValue(data: string[], formArray: FormArray, fieldName: string): void {
    const config = this.fieldConfig.find((conf) => conf.name === fieldName);
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

  createFieldConfigForList(values: any[], fieldConfig: FieldConfig) {
    fieldConfig['listFields'] = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const templateListField = _.cloneDeep(fieldConfig.templateListField);

      templateListField.forEach((subFieldConfig) => {
        if (subFieldConfig.type == 'list') {
          if (value[subFieldConfig.name]) {
            const subValues = value[subFieldConfig.name];
            this.createFieldConfigForList(subValues, subFieldConfig);
          }
        } else if (value[subFieldConfig.name] !== undefined) {
          subFieldConfig.value = value[subFieldConfig.name];
        }
      });
      fieldConfig['listFields'].push(templateListField);
    }
  }

  setObjectListValue(values: object[], formArray: FormArray, fieldConfig: FieldConfig) {
    this.createFieldConfigForList(values, fieldConfig);

    for (let i = 0; i < fieldConfig['listFields'].length; i++) {
      const formGroup = this.entityFormService.createFormGroup(fieldConfig['listFields'][i]);
      formArray.push(formGroup);
    }

    for (let i = 0; i < fieldConfig['listFields'].length; i++) {
      fieldConfig['listFields'][i].forEach((subFieldConfig) => {
        this.fieldRelationService.setRelation(subFieldConfig, formArray.at(i) as FormGroup);
      });
    }

    formArray.markAllAsTouched();
  }

  ngOnDestroy() {
    if (typeof (this.sub) !== 'undefined' && typeof (this.sub.unsubscribe) !== 'undefined') {
      this.sub.unsubscribe();
    }
    this.getAdvancedConfig.unsubscribe();
  }
}
