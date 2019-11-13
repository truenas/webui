import {Location} from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  OnChanges,
  AfterViewInit
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import {RestService, WebSocketService} from '../../../../services/';
import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import {FieldConfig} from './models/field-config.interface';
import {FieldSet} from './models/fieldset.interface';
import {EntityFormService} from './services/entity-form.service';
import {FieldRelationService} from './services/field-relation.service';
import { Subscription ,  Subject } from 'rxjs';
import { Formconfiguration } from './entity-form.component';
import { CoreEvent } from 'app/core/services/core.service';

export interface FormConfig {
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
  queryCall?;
  queryCallOption?;
  isNew?;
  pk?;
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
  custom_add_query?;
  actionButtonsAlign?: string;
  custActions?: any[];
  customFilter?:any[];
  
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

  goBack?();
  onSuccess?(res);
  multiStateSubmit?:boolean;
}

@Component({
  selector : 'entity-form-embedded',
  templateUrl : './entity-form-embedded.component.html',
  styleUrls : [ './entity-form-embedded.component.css' ],
  providers : [ EntityFormService, FieldRelationService ]
})
export class EntityFormEmbeddedComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input('conf') conf: FormConfig;
  @Input() data:any;
  @Input() hiddenFieldSets: string[] = [];
  @Input() target: Subject<CoreEvent>;

  public formGroup: FormGroup;
  public fieldSetDisplay: string;
  public fieldSets: FieldSet[]
  public fieldConfig: FieldConfig[];
  public hasConf = true;
  public saveSubmitText = "Save";
  public saveSubmitStatus:string = ""; 
  public actionButtonsAlign = "center";

  get controls() {
    return this.fieldConfig.filter(({type}) => type !== 'button');
  }
  get changes() { return this.formGroup.valueChanges; }
  get statusChanges() { return this.formGroup.statusChanges; }
  get dirty() { return this.entityForm ? this.entityForm.dirty : false; }
  get valid() { return this.formGroup.valid; }
  get value() { return this.formGroup.value; }

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;

  @ViewChildren('component') components;
  @ViewChild('entityForm', {static: false}) entityForm;

  public busy: Subscription;

  public sub: any;
  public error: string;
  public success = false;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected location: Location, private fb: FormBuilder,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public snackBar: MatSnackBar,
    public translate: TranslateService) {}

  ngAfterViewInit() {
    this.templates.forEach((item) => {
      if (item.type === 'TOP') {
	this.templateTop = item.templateRef;
      }
    });
  }

  ngOnInit() {
    if(this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }
    
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.init();
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }

    if(this.target){
      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
          case "SetHiddenFieldsets":
            this.setHiddenFieldSets(evt.data);
            break;
          case "UpdateSaveButtonText":
            this.saveSubmitText = evt.data;
            break;
          case "ResetSaveButtonText":
            this.saveSubmitText = this.conf.saveSubmitText;
            break;
          case "SubmitStart":
            this.saveSubmitStatus = '';
            break;
          case "SubmitComplete":
            this.saveSubmitStatus = 'checkmark';
            this.entityForm.form.markAsPristine();
            break;
        }
      });
    }
  }

  init(){

    // Setup Fields
    this.fieldConfig = this.conf.fieldConfig;
    this.actionButtonsAlign = this.conf.actionButtonsAlign;
    this.fieldSetDisplay = this.conf.fieldSetDisplay;
    this.fieldSets = this.conf.fieldSets;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.setControlChangeDetection();

      for (const i in this.fieldConfig) {
        const config = this.fieldConfig[i];
        if (config.relation.length > 0) {
          this.setRelation(config);
        }
      }

    if (this.conf.values) {
      // We are no longer responsible for API calls.
	for (let i in this.data) {
	  let fg = this.formGroup.controls[i];
	  if (fg) {
	    const current_field = this.fieldConfig.find((control) => control.name === i);
	    if (current_field.type === "array") {
	      this.setArrayValue(this.data[i], fg, i);
	    } else {
	      fg.setValue(this.data[i]);
	    }
	  }
	}
	if (this.conf.initial) {
	  this.conf.initial.bind(this.conf)(this);
	}
    } 
  }

  ngOnChanges(changes) {
    if (changes.formGroup) {
      this.onFormGroupChanged();
    }

    if(changes.data){
      this.init();
      this.onFormGroupChanged();
      if(this.entityForm){
        this.entityForm.form.markAsPristine();
      }
    }
  }

  setControlChangeDetection(){ 
    this.formGroup.valueChanges.subscribe((evt) => {
        this.target.next({name:"FormGroupValueChanged",data:evt,sender:this.formGroup});
    });
    let fg = Object.keys(this.formGroup.controls);
    fg.forEach((control) => {
      this.formGroup.controls[control].valueChanges.subscribe((evt) => { 
      });
    });
  }

  onFormGroupChanged(){
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

      let fg = Object.assign({}, this.formGroup);
  }

  goBack() {
    this.target.next({name:"FormCancelled", sender:this.conf});
  }

  onSubmit(event: Event, eventName?:string) {
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

    if (this.conf.beforeSubmit) {
      this.conf.beforeSubmit(value);
    }

    if(!eventName){
      this.target.next({name:"FormSubmitted", data:value, sender:this.conf});
    } else {
      this.target.next({name:eventName, data:value, sender:this.conf});
    }
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
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

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
	item.disabled = disable;
      }
      return item;
    });
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

  setRelation(config: FieldConfig) {
    const activations =
      this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
	activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
	.forEach(control => {
	  control.valueChanges.subscribe(
	    () => { this.relationUpdate(config, activations); });
	});
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled);
  }

  ngOnDestroy() { 
    if(this.sub){
      this.sub.unsubscribe(); 
    }
  }

  setHiddenFieldSets(fs: string[]){
    this.hiddenFieldSets = fs;
  }
}
