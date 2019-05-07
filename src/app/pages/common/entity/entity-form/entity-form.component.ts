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
  OnChanges
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Rx';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import {RestService, WebSocketService} from '../../../../services/';
import { CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {EntityTemplateDirective} from '../entity-template.directive';
import {EntityUtils} from '../utils';

import {FieldConfig} from './models/field-config.interface';
import {FieldSet} from './models/fieldset.interface';
import {EntityFormService} from './services/entity-form.service';
import {FieldRelationService} from './services/field-relation.service';
import {  DialogService } from '../../../../services/';
import { T } from '../../../../translate-marker';

import {AdminLayoutComponent} from '../../../../components/common/layouts/admin-layout/admin-layout.component';


export interface Formconfiguration {
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
  queryKey?;  // use this to define your id for websocket call
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
  custom_add_query?
  custActions?: any[];
  customFilter?:any[];
  confirmSubmit?;
  confirmSubmitDialog?:Object;
  afterSave?;
  blurEvent?;
  customEditCall?;
  save_button_enabled?;
 
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

  goBack?();
  onSuccess?(res);
}

@Component({
  selector : 'entity-form',
  templateUrl : './entity-form.component.html',
  styleUrls : [ './entity-form.component.scss' ],
  providers : [ EntityFormService, FieldRelationService ]
})
export class EntityFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  @Input('conf') conf: Formconfiguration;

  public pk: any;
  public fieldSetDisplay: string = 'default';
  public fieldSets: FieldSet[]
  public formGroup: FormGroup;
  public fieldConfig: FieldConfig[];
  public resourceName: string;
  public getFunction;
  public submitFunction = this.editSubmit;
  public isNew = false;
  public hasConf = true;
  public wsResponse;
  public wsfg;
  public wsResponseIdx;
  public queryResponse;
  public saveSubmitText = "Save";
  public showPassword = false;
  public isFooterConsoleOpen: boolean;

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
  public showDefaults: boolean = false;
  public showSpinner: boolean = false;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected location: Location, private fb: FormBuilder,
              protected entityFormService: EntityFormService,
              protected fieldRelationService: FieldRelationService,
              protected loader: AppLoaderService,
              public snackBar: MatSnackBar,
              public adminLayout: AdminLayoutComponent,
              private dialog:DialogService,
              public translate: TranslateService) {
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

  ngOnInit() {
    //get system general setting
    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        if (this.conf.isBasicMode) {
          if(res.advancedmode) {
            this.conf.isBasicMode = false;
          } else {
            this.conf.isBasicMode = true;
          }
        }
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

    if (this.conf.save_button_enabled == undefined) {
      this.conf.save_button_enabled = true;
    }
    if(this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
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
        this.pk = params['pk'];
        if (this.pk && !this.conf.isNew) {
          if (this.conf.editCall) {
            this.submitFunction = this.editCall;  // this is strange so I AM NOTING it...  this.editCall internally calls this.conf.editCall with some fluff.
                                                  // But to my eyes it almost looks like a bug when I first saw it. FYI
          } else {
            this.submitFunction = this.editSubmit;
            this.resourceName = this.resourceName + this.pk + '/';
          }      
        } else {
          if (this.conf.addCall) {
            this.submitFunction = this.addCall;
          } else {
            this.submitFunction = this.addSubmit;
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

      // Fallback if no fieldsets are defined
      if(this.conf.fieldSets){
        this.fieldConfig = [];
        this.fieldSets = this.conf.fieldSets;
        for(let i = 0; i < this.fieldSets.length; i++){
          let fieldset = this.fieldSets[i];
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
            filter = [[[this.conf.queryKey, '=', pk]]];
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

      if (!this.isNew) {
        this.getFunction.subscribe((res) => {
          if (res.data){
            this.data = res.data;
            if( typeof(this.conf.resourceTransformIncomingRestData) !== "undefined" ) {
              this.data = this.conf.resourceTransformIncomingRestData(this.data);
            }
            for (const i in this.data) {
              const fg = this.formGroup.controls[i];
              if (fg) {
                const current_field = this.fieldConfig.find((control) => control.name === i);
                if (current_field.type === "array") {
                    this.setArrayValue(this.data[i], fg, i);
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
            }

            for (const i in this.wsResponse){
              this.wsfg = this.formGroup.controls[i];
              this.wsResponseIdx = this.wsResponse[i];
              if (this.wsfg) {
                const current_field = this.fieldConfig.find((control) => control.name === i);
                if (current_field.type === "array") {
                    this.setArrayValue(this.wsResponse[i], this.wsfg, i);
                } else {
                  if (this.conf.dataHandler) {
                    this.conf.dataHandler(this);
                  }
                  else {
                    this.wsfg.setValue(this.wsResponse[i]);
                  }
                }

              } else {
                if (this.conf.dataAttributeHandler) {
                  this.conf.dataAttributeHandler(this);
                }
              }
            }
          }

          if (this.conf.initial) {
            this.conf.initial.bind(this.conf)(this);
          }
          // Gets called on most entity forms after ws data returns, 
          // thus hiding messages like 'no data'
          this.showDefaults = true;
        });
      }
    });
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
    if (this.conf.blurEvent) {
      this.conf.blurEvent(this);
    }
    // ...but for entity forms that don't make a data request, this kicks in 
    setTimeout(() => { this.setShowDefaults(); }, 500);
  }

  checkIfConsoleMsgShows() {
    setTimeout(() => {
      this.ws.call('system.advanced.config').subscribe((res)=> {
        if (res) {
          this.isFooterConsoleOpen = res.consolemsg;
        }
      });
    }, 500)
  }

  setShowDefaults() {
    this.showDefaults = true;
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
    return this.ws.call(this.conf.editCall, [this.pk, body]);
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
    this.checkIfConsoleMsgShows();
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
    if (this.conf.customEditCall && this.pk) {
      return this.conf.customEditCall(value);
    }

    if (this.conf.customSubmit) {
      this.busy = this.conf.customSubmit(value);
    } else {
      this.loader.open();
      this.busy = this.submitFunction(value)
                    .subscribe(
                        (res) => {
                          this.loader.close();
                          if (this.conf.afterSave) {
                            this.conf.afterSave(this);
                          } else { 
                            if (this.conf.route_success) {
                              this.router.navigate(new Array('/').concat(
                                  this.conf.route_success));
                            } else {
                              this.snackBar.open("Settings saved.", 'close', { duration: 5000 })
                              this.success = true;
                            }

                            if (this.conf.afterSubmit) {
                              this.conf.afterSubmit(value);
                            }
                          }

                        },
                        (res) => {
                          this.loader.close();
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

  setRelation(config: FieldConfig) {
    const activations =
        this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
          activations, this.formGroup);
      const tobeHide = this.fieldRelationService.isFormControlToBeHide(
          activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled, tobeHide);

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
    const tobeHide = this.fieldRelationService.isFormControlToBeHide(
          activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled, tobeHide);
  }

  ngOnDestroy() { 
    
    if( typeof(this.sub) !== "undefined" && typeof(this.sub.unsubscribe) !== "undefined" ) {
      this.sub.unsubscribe(); 
    }
  }
}
