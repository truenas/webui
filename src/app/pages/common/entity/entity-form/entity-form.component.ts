import {Location} from '@angular/common';
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
  AfterViewChecked
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

import {RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject, Subscription } from 'rxjs';
import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import {FieldConfig} from './models/field-config.interface';
import {FieldSet} from './models/fieldset.interface';
import {EntityFormService} from './services/entity-form.service';
import {FieldRelationService} from './services/field-relation.service';
import {  DialogService } from '../../../../services/';
import { T } from '../../../../translate-marker';

export interface Formconfiguration {
  prerequisite?;
  fieldSets?;
  fieldSetDisplay?;
  values?;
  saveSubmitText?;
  preInit?;
  target?: Subject<CoreEvent>;
  resource_name?;
  isEntity?;
  addCall?;
  editCall?;
  isEditJob?;
  queryCall?;
  queryCallOption?;
  queryKey?;  // use this to define your id for websocket call
  isNew?;
  pk?;
  rowid?;
  custom_get_query?;
  fieldConfig?: FieldConfig[];
  resourceTransformIncomingRestData?;
  route_usebaseUrl?;
  afterInit?;
  initial?;
  dataHandler?;
  dataAttributeHandler?;
  route_cancel?;
  route_success?;
  route_delete?;
  custom_edit_query?;
  custom_add_query?
  custActions?: any[];
  compactCustomActions?: any[];
  customFilter?:any[];
  confirmSubmit?;
  confirmSubmitDialog?:Object;
  afterSave?;
  blurEvent?;
  customEditCall?;
  save_button_enabled?;
  hideSaveBtn?:boolean;
  form_message?: {
    type: string; // info || warning
    content: string;
  };

  afterSubmit?;
  beforeSubmit?;
  customSubmit?;
  clean?;
  errorReport?;
  hide_fileds?;
  isBasicMode?
  advanced_field?
  basic_field?;
  route_conf?;
  preHandler?;
  initialCount?
  initialCount_default?;
  responseOnSubmit?;
  title?;
  columnsOnForm?: number;

  closeModalForm?();
  afterModalFormClosed?(); // function will called once the modal form closed
  goBack?();
  onSuccess?(res);
}

@Component({
  selector : 'entity-form',
  templateUrl : './entity-form.component.html',
  styleUrls : [ './entity-form.component.scss' ],
  providers : [ EntityFormService, FieldRelationService ]
})
export class EntityFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, AfterViewChecked {

  @Input('conf') conf: Formconfiguration;

  public pk: any;
  public fieldSetDisplay: string = 'default';
  public fieldSets: FieldSet[]
  public formGroup: FormGroup;
  public fieldConfig: FieldConfig[];
  public resourceName: string;
  public getFunction;
  public submitFunction = this.editCall;
  public isNew = false;
  public hasConf = true;
  public wsResponse;
  public wsfg;
  public wsResponseIdx;
  public queryResponse;
  public saveSubmitText = T("Save");
  public showPassword = false;
  public successMessage = T('Settings saved.')
  private getAdvancedConfig: Subscription;

  protected loaderOpen = false;
  protected keepLoaderOpen = false;

  get controls() {
    return this.fieldConfig.filter(({type}) => type !== 'button');
  }
  get changes() { return this.formGroup.valueChanges; }
  get valid() { return this.formGroup.valid; }
  get value() { return this.formGroup.value; }

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;

  @ViewChildren('component') components;

  public busy: Subscription;

  public sub: any;
  public error: string;
  public success = false;
  public data: Object = {};
  public showSpinner: boolean = false;
  public isFromPending = false;
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected location: Location, private fb: FormBuilder,
              protected entityFormService: EntityFormService,
              protected fieldRelationService: FieldRelationService,
              protected loader: AppLoaderService,
              private dialog:DialogService,
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
    if(this.conf.fieldSets){
      this.fieldConfig = [];
      /* Temp patch to support both FieldSet approaches */
      this.fieldSets = this.conf.fieldSets.list ? this.conf.fieldSets.list() : this.conf.fieldSets;
      for(let i = 0; i < this.fieldSets.length; i++){
        let fieldset = this.fieldSets[i];
        if (!fieldset.divider) {
          if(fieldset.maxWidth)
            fieldset.width = '100%';
          else
            fieldset.width = this.conf.columnsOnForm === 1 || fieldset.colspan === 2 ? '100%' : '50%';
        }

        if(fieldset.config){
          this.fieldConfig = this.fieldConfig.concat(fieldset.config);
        }
      }
      this.conf.fieldConfig = this.fieldConfig;
    } else {
      this.fieldConfig = this.conf.fieldConfig;
      this.fieldSets = [
        {
          name:'FallBack',
          class:'fallback',
          width:'100%',
          divider:false,
          config: this.fieldConfig
        },
        {
          name:'divider',
          divider:true,
          width:'100%'
        }
      ]
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    }
  }

  async ngOnInit() {
    //get system general setting
    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res)=> {
      if (res) {
        if (this.conf.isBasicMode) {
          if(res.advancedmode) {
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
    if(this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }
    if (this.conf.prerequisite) {
      await this.conf.prerequisite();
    }

    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.sub = this.route.params.subscribe(params => {
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
            this.submitFunction = this.editCall;  // this is strange so I AM NOTING it...  this.editCall internally calls this.conf.editCall with some fluff.
                                                  // But to my eyes it almost looks like a bug when I first saw it. FYI
          } else {
            //this.submitFunction = this.editSubmit;
            this.resourceName = this.resourceName + this.pk + '/';
          }      
        } else {
          if (this.conf.saveSubmitText === undefined) {
            this.saveSubmitText = T('Save');
          }
          if (this.conf.addCall) {
            this.submitFunction = this.addCall;
          } else {
            //this.submitFunction = this.addSubmit;
          }
          this.isNew = true;
        }
      }


      // Make sure fieldSetDisplay is defined
      if(this.conf.fieldSetDisplay){
        this.fieldSetDisplay = this.conf.fieldSetDisplay;
      } else {
        this.fieldSetDisplay = "default";
      }

      this.makeFormGroup();

      if (this.conf.queryCall === 'none') {
        this.getFunction = this.noGetFunction();
      } else {
        if (this.conf.queryCall) {
          if(this.pk) {
            let pk = this.pk;
            let filter = []
            if (this.conf.pk) {
             filter.push(this.conf.pk);
             pk = this.conf.pk;
            }
            if (this.conf.queryCallOption) {
              filter.push(this.conf.queryCallOption);
            }
            if (this.conf.customFilter){
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
      }

      if (!this.isNew && this.conf.queryCall !== 'none' && this.getFunction) {
        this.loader.open();
        this.loaderOpen = true;
        this.getFunction.subscribe((res) => {
          if (res.data){
            this.data = res.data;
            if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
              this.data = this.conf.resourceTransformIncomingRestData(this.data);
              if (this.data['changed_schema']) {
                this.makeFormGroup();
                delete this.data['changed_schema'];
              }
            }
            for (const i in this.data) {
              const fg = this.formGroup.controls[i];
              if (fg) {
                const current_field = this.fieldConfig.find((control) => control.name === i);
                if (current_field.type === "array") {
                    this.setArrayValue(this.data[i], fg, i);
                } else if (current_field.type === "list") {
                  this.setListValue(this.data[i], fg as FormArray, i)
                } else {
                  if (!_.isArray(this.data[i]) && current_field.type === "select" && current_field.multiple) {
                    if (this.data[i]) {
                      this.data[i] = _.split(this.data[i], ',');
                    }
                  }
                  fg.setValue(this.data[i]);
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

            if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
              this.wsResponse = this.conf.resourceTransformIncomingRestData(this.wsResponse);
              if (this.wsResponse['changed_schema']) {
                this.makeFormGroup();
                delete this.wsResponse['changed_schema'];
              }
            }
            if (this.conf.dataHandler) {
              this.conf.dataHandler(this);
            } else {
              for (const i in this.wsResponse){
                this.wsfg = this.formGroup.controls[i];
                this.wsResponseIdx = this.wsResponse[i];
                if (this.wsfg) {
                  const current_field = this.fieldConfig.find((control) => control.name === i);
                  if (current_field.type === "array") {
                      this.setArrayValue(this.wsResponse[i], this.wsfg, i);
                  } else if (current_field.type === "list") {
                    this.setObjectListValue(this.wsResponse[i], this.wsfg, i)
                  } else {
                    this.wsfg.setValue(this.wsResponse[i]);
                  }
                } else {
                  if (this.conf.dataAttributeHandler) {
                    this.conf.dataAttributeHandler(this);
                  }
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
    return;
  }

  ngOnChanges() {
    if (this.formGroup) {
      const controls = Object.keys(this.formGroup.controls);
      const configControls = this.controls.map((item) => item.name);

      controls.filter((control) => !configControls.includes(control))
          .forEach((control) => this.formGroup.removeControl(control));

      configControls.filter((control) => !controls.includes(control))
          .forEach((name) => {
            const config =
                this.fieldConfig.find((control) => control.name === name);
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
    const payload = []
    const call = this.conf.addCall;
    payload.push(body)
    return this.ws.call(call, payload);
  }

  editSubmit(body: any) { 
    let resource = this.resourceName;
    if (this.conf.custom_edit_query) {
      resource = this.conf.custom_edit_query;
    }

    return this.rest.put(resource, {body}, this.conf.route_usebaseUrl);
  }

  editCall(body: any) {
    const payload = [body];
    if (this.pk) {
      payload.unshift(this.pk);
    }

    if (this.conf.isEditJob) {
      return this.ws.job(this.conf.editCall, payload);
    } else {
      return this.ws.call(this.conf.editCall, payload);
    }
  }

  addSubmit(body: any) {
    let resource = this.resourceName;
    if (this.conf.custom_add_query) {
      resource = this.conf.custom_add_query;
    }

    return this.rest.post(resource, {body}, this.conf.route_usebaseUrl); 
  }

  onSubmit(event: Event) {   
    if (this.conf.confirmSubmit && this.conf.confirmSubmitDialog) {
      this.dialog.confirm(this.conf.confirmSubmitDialog['title'],
                          this.conf.confirmSubmitDialog['message'], 
                          this.conf.confirmSubmitDialog.hasOwnProperty("hideCheckbox") ?
                              this.conf.confirmSubmitDialog['hideCheckbox'] : false,
                          this.conf.confirmSubmitDialog.hasOwnProperty("button") ?
                              this.conf.confirmSubmitDialog['button']: T("Ok")).subscribe((confirm) => {
                            if (!confirm) {
                              return;
                            } else {
                              this.doSubmit(event);
                            }
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
        if (this.conf['clean_' + i]) {
          value = this.conf['clean_' + i](value, i);
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
      this.busy = this.conf.customSubmit(value);
    } else {
      this.loader.open();
      this.loaderOpen = true;
      this.busy = this.submitFunction(value)
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
                                    this.conf.route_success));
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
                            this.modalService.close('slide-in-form').then(closed => {
                              if (closed && this.conf.afterModalFormClosed) {
                                this.conf.afterModalFormClosed();
                              }
                            });
                          }
                        },
                        (res) => {
                          this.loader.close();
                          this.loaderOpen = false;
                          if (this.conf.errorReport){
                            this.conf.errorReport(res);
                          } else if (res.hasOwnProperty("reason") && (res.hasOwnProperty("trace"))) {
                            new EntityUtils().handleWSError(this, res); 
                          }
                          else {
                            new EntityUtils().handleError(this, res);
                          }
                        });
    }
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  isFieldsetAvailabel(fieldset) {
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
    } else {
      if (this.conf.basic_field !== undefined && this.conf.basic_field.indexOf(id) > -1) {
        return false;
      }
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
    const {disabled, validation, value} = config;
    return this.fb.control({disabled, value}, validation);
  }

  setDisabled(name: string, disable: boolean, hide?: boolean, status?:string) {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
        item['isHidden'] = hide;
      }
      return item;
    });

    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }
  }

  setValue(name: string, value: any) {
    this.formGroup.controls[name].setValue(value, {emitEvent : true});
  }

  setArrayValue(data: any[], formArray: any, name: string) {
    let array_controls: any;
    for (const i in this.fieldConfig) {
      const config = this.fieldConfig[i];
      if (config.name === name) {
        array_controls = config.formarray;
      }
    }

    if(this.conf.preHandler) {
      data = this.conf.preHandler(data, formArray);
    }

    data.forEach((value, index) => {
      if (this.conf.initialCount.hasOwnProperty(name)) {
        this.conf.initialCount[name] += 1;
        this.conf.initialCount_default[name] += 1;
      } else {
        this.conf.initialCount += 1;
        this.conf.initialCount_default += 1;
      }

      const formGroup = this.entityFormService.createFormGroup(array_controls);
      for (const i in value) {
        const formControl = formGroup.controls[i];
        formControl.setValue(value[i]);
      }
      formArray.insert(index, formGroup);
    });
  }

  setListValue(data: string[], formArray: FormArray, fieldName: string): void {
    const config = this.fieldConfig.find(conf => conf.name === fieldName);
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

  setObjectListValue(listValue: object[], formArray: FormArray, fieldName: string) {
    for (let i = 0; i < listValue.length; i++) {
      const templateListField = _.cloneDeep(_.find(this.conf.fieldConfig, {'name': fieldName}).templateListField);
      if (formArray.controls[i] == undefined) {

        const newfg =  this.entityFormService.createFormGroup(templateListField);
        newfg.setParent(formArray);
        formArray.controls.push(newfg);

        if (typeof listValue[i] === 'object') {
          for (const [key, value] of Object.entries(listValue[i])) {
            const fieldConfig = _.find(templateListField, {'name': key});
            if (fieldConfig && fieldConfig.type == "list") {
              const subTemplateListField = _.cloneDeep(fieldConfig.templateListField);
              
              for(let j=0; j < value.length; j++) {
                const subNewfg =  this.entityFormService.createFormGroup(subTemplateListField);
                subNewfg.setParent(newfg);
                (<FormArray>newfg.controls[key]).push(subNewfg);
                _.find(templateListField, {'name': key}).listFields.push(subTemplateListField);
              }            
            }
          }
        }

        _.find(this.conf.fieldConfig, {'name': fieldName}).listFields.push(templateListField);
      }

      if (typeof listValue[i] === 'object') {
        for (const [key, value] of Object.entries(listValue[i])) {
          const control = <FormArray>(<FormGroup>formArray.controls[i]).controls[key];
          if (control) {
            const fieldConfig = _.find(templateListField, {'name': key});
            if (fieldConfig.type == "list") {
              for (let j = 0; j < value.length; j++) {
                const subList = value[j];
                
                for (const [subKey, subValue] of Object.entries(subList)) {
                  if (<FormGroup>control.controls[j]) {
                    const subControl = (<FormGroup>control.controls[j]).controls[subKey];
                    subControl.setValue(subValue);
                  }
                }
              }
  
            } else {
              control.setValue(value);
            }
          }        
        }
      } else {
        const key = templateListField[0].name;
        const control = (<FormGroup>formArray.controls[i]).controls[key];
        if (control) {
          control.setValue(listValue[i]);
        }      
      }
      
    }
    formArray.markAllAsTouched();
  }

  setRelation(config: FieldConfig) {
    const activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, this.formGroup);
      const tobeHide = this.fieldRelationService.isFormControlToBeHide(activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled, tobeHide);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup).forEach(control => {
        control.valueChanges.subscribe((value) => { 
          setTimeout(() => {
            this.relationUpdate(config, activations); 
          }, 100);
        });
      });
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, this.formGroup);
    const tobeHide = this.fieldRelationService.isFormControlToBeHide(activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled, tobeHide);
  }

  ngOnDestroy() { 
    
    if( typeof(this.sub) !== "undefined" && typeof(this.sub.unsubscribe) !== "undefined" ) {
      this.sub.unsubscribe(); 
    }
    this.getAdvancedConfig.unsubscribe();
  }
}
