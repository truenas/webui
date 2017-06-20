import { Component, ContentChildren, Input, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { FieldConfig } from './models/field-config.interface';
import { EntityFormService } from './services/entity-form.service';
import { FieldRelationService } from './services/field-relation.service';

import { RestService, WebSocketService } from '../../../../services/';
import { Subscription } from 'rxjs';
import { EntityUtils } from '../utils';
import { EntityTemplateDirective } from '../entity-template.directive';
import { Location } from '@angular/common';
import * as _ from 'lodash';

@Component({
  selector: 'entity-form',
  templateUrl: './entity-form.component.html',
  styleUrls: ['./entity-form.component.css'],
  providers: [EntityFormService, FieldRelationService]
})
export class EntityFormComponent implements OnInit, OnDestroy {

  @Input('conf') conf: any;

  protected pk: any;
  public formGroup: FormGroup;
  protected fieldConfig: FieldConfig [];
  protected resourceName: string;
  private submitFunction = this.editSubmit;
  private isNew: boolean = false;
  public hasConf: boolean = true;

  get controls() { return this.fieldConfig.filter(({type}) => type !== 'button'); }
  get changes() { return this.formGroup.valueChanges; }
  get valid() { return this.formGroup.valid; }
  get value() { return this.formGroup.value; }

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective) templates: QueryList<EntityTemplateDirective>;

  @ViewChildren('component') components;

  private busy: Subscription;

  private sub: any;
  public error: string;
  public success: boolean = false;
  public data: Object = {};


  constructor(protected router: Router,
              protected route: ActivatedRoute,
              protected rest: RestService,
              protected ws: WebSocketService,
              protected location: Location,
              private fb: FormBuilder,
              protected entityFormService: EntityFormService,
              protected fieldRelationService: FieldRelationService) {
  }

  ngAfterViewInit() {
    this.templates.forEach((item) => {
      if(item.type == 'TOP') {
        this.templateTop = item.templateRef;
      }
    });
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.resourceName = this.conf.resource_name;
      if (!this.resourceName.endsWith('/')) {
        this.resourceName = this.resourceName + '/';
      }
      if (this.conf.isEntity) {
        this.pk = params['pk'];
        if (this.pk) {
          this.resourceName = this.resourceName + this.pk + '/';
        } else {
          this.submitFunction = this.addSubmit;
          this.isNew = true;
        }
      }

      if (this.conf.preInit) {
        this.conf.preInit(this);
      }
      this.fieldConfig = this.conf.fieldConfig;
      this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

      for (let i in this.fieldConfig) {
        let config = this.fieldConfig[i];
        if(config.relation.length > 0) {
          this.setRelation(config);
        }
      }

      let getQuery = this.resourceName;
      if (this.conf.custom_get_query) {
        getQuery = this.conf.custom_get_query;
      }
      if (!this.isNew) {
        this.rest.get(getQuery, {}).subscribe((res) => {
          this.data = res.data;
          for(let i in this.data) {
            let fg = this.formGroup.controls[i];
            if(fg) {
              fg.setValue(this.data[i]);
            }
          }
          if(this.conf.initial) {
            this.conf.initial.bind(this.conf)(this);
          }
        });
      }
    });
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  ngOnChanges() {
    if (this.formGroup) {
      const controls = Object.keys(this.formGroup.controls);
      const configControls = this.controls.map((item) => item.name);

      controls
        .filter((control) => !configControls.includes(control))
        .forEach((control) => this.formGroup.removeControl(control));

      configControls
        .filter((control) => !controls.includes(control))
        .forEach((name) => {
          const config = this.fieldConfig.find((control) => control.name === name);
          this.formGroup.addControl(name, this.createControl(config));
        });

    }
  }

  goBack() {
     let route = this.conf.route_cancel;
     if(!route) {
       route = this.conf.route_success;
     }
     this.router.navigate(new Array('/pages').concat(route));
  }

  editSubmit(body: any) {
     return this.rest.put(this.resourceName, body);
  }

  addSubmit(body: any) {
     return this.rest.post(this.resourceName, body);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);
    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        let clean = this['clean_' + i];
        if (clean) {
          value = clean(value, i);
        }
      }
    }
    if ('id' in value) {
      delete value['id'];
    }

    if (this.conf.clean) {
      value = this.conf.clean.bind(this.conf)(value);
    }

    this.busy = this.submitFunction(
      {body: JSON.stringify(value)}).subscribe((res) => {
      if (this.conf.route_success) {
        this.router.navigate(new Array('/pages').concat(this.conf.route_success));
      } else {
        this.success = true;
      }
    }, (res) => {
      new EntityUtils().handleError(this, res);
    });
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f].errors = '';
      this.fieldConfig[f].hasErrors = false;
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
    if(!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/pages').concat(route));
  }

  createControl(config: FieldConfig) {
    const { disabled, validation, value } = config;
    return this.fb.control({ disabled, value }, validation);
  }

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable': 'enable';
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
    this.formGroup.controls[name].setValue(value, {emitEvent: true});
  }

  setRelation(config: FieldConfig) {
    let activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup).forEach(control => {
        control.valueChanges.subscribe(() => {
          this.relationUpdate(config, activations);
        });
      });
    }
  }

  relationUpdate(config: FieldConfig, activations: any) {
    let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
