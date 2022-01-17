import { Location } from '@angular/common';
import {
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  OnChanges,
  AfterViewInit, SimpleChanges,
} from '@angular/core';
import {
  FormArray,
  FormBuilder, FormControl, FormGroup, NgForm,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subscription, Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { FieldConfig, FormArrayConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { RelationGroup } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';
import { EntityTemplateDirective } from 'app/modules/entity/entity-template.directive';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

export interface EmbeddedFormConfig {
  fieldSets?: FieldSets | FieldSet[];
  fieldSetDisplay?: string;
  values?: unknown;
  saveSubmitText?: string;
  preInit?: (entityForm: EntityFormEmbeddedComponent) => void;
  target?: Subject<CoreEvent>;
  resourceName?: string;
  isEntity?: boolean;
  isNew?: boolean;
  pk?: number | string;
  fieldConfig?: FieldConfig[];
  afterInit?: (entityForm: EntityFormEmbeddedComponent) => void;
  initial?: (this: EmbeddedFormConfig, entityForm: EntityFormEmbeddedComponent) => void;
  routeCancel?: string[];
  routeSuccess?: string[];
  // TODO: Broken
  routeDelete?: string[];
  actionButtonsAlign?: string;
  custActions?: {
    name: string;
    id: string;
    eventName: string;
  }[];
  isCustActionVisible?: (action: string) => boolean;

  beforeSubmit?: (value: unknown) => void;
  afterSubmit?: (value: unknown) => void;
  customSubmit?: (value: unknown) => void;
  clean?: (this: EmbeddedFormConfig, value: unknown) => void;
  isBasicMode?: boolean;
  advancedFields?: string[];
  basicFields?: string[];
  routeConf?: string[];
  preHandler?: (data: unknown, formArray: FormArray) => any;
  initialCount?: number;
  initialCount_default?: number;

  goBack?: () => void;
  multiStateSubmit?: boolean;
}

@UntilDestroy()
@Component({
  selector: 'entity-form-embedded',
  templateUrl: './entity-form-embedded.component.html',
  styleUrls: ['./entity-form-embedded.component.scss'],
  providers: [EntityFormService, FieldRelationService],
})
export class EntityFormEmbeddedComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() conf: EmbeddedFormConfig;
  @Input() data: any;
  @Input() hiddenFieldSets: string[] = [];
  @Input() target: Subject<CoreEvent>;

  formGroup: FormGroup;
  fieldSetDisplay: string;
  fieldSets: FieldSet[];
  fieldConfig: FieldConfig[];
  hasConf = true;
  saveSubmitText: string = this.translate.instant('Save');
  saveSubmitStatus = '';
  actionButtonsAlign = 'center';

  get controls(): FieldConfig[] {
    return this.fieldConfig.filter(({ type }) => type !== 'button');
  }
  get changes(): Observable<any> {
    return this.formGroup.valueChanges;
  }
  get statusChanges(): Observable<string> {
    return this.formGroup.statusChanges;
  }
  get dirty(): boolean { return this.entityForm ? this.entityForm.dirty : false; }
  get valid(): boolean { return this.formGroup.valid; }
  get value(): boolean { return this.formGroup.value; }

  templateTop: TemplateRef<unknown>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;

  @ViewChild('entityForm', { static: false }) entityForm: NgForm;

  busy: Subscription;

  sub: Subscription;
  error: string;
  success = false;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected location: Location, private fb: FormBuilder,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    this.templates.forEach((item) => {
      if (item.type === 'TOP') {
        this.templateTop = item.templateRef;
      }
    });
  }

  ngOnInit(): void {
    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.init();
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }

    if (this.target) {
      this.target.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
        switch (evt.name) {
          case 'SetHiddenFieldsets':
            this.setHiddenFieldSets(evt.data);
            break;
          case 'UpdateSaveButtonText':
            this.saveSubmitText = evt.data;
            break;
          case 'ResetSaveButtonText':
            this.saveSubmitText = this.conf.saveSubmitText;
            break;
          case 'SubmitStart':
            this.saveSubmitStatus = '';
            break;
          case 'SubmitComplete':
            this.saveSubmitStatus = 'checkmark';
            this.entityForm.form.markAsPristine();
            break;
        }
      });
    }
  }

  init(): void {
    // Setup Fields
    this.fieldConfig = this.conf.fieldConfig;
    this.actionButtonsAlign = this.conf.actionButtonsAlign;
    this.fieldSetDisplay = this.conf.fieldSetDisplay;
    if (this.conf.fieldSets) {
      /* Temp patch to support both FieldSet approaches */
      this.fieldSets = 'list' in this.conf.fieldSets ? this.conf.fieldSets.list() : this.conf.fieldSets;
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.setControlChangeDetection();

    this.fieldConfig.forEach((config) => {
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    });

    if (this.conf.values) {
      // We are no longer responsible for API calls.
      for (const i in this.data) {
        const fg = this.formGroup.controls[i];
        if (fg) {
          const fieldConfig = this.fieldConfig.find((control) => control.name === i);
          if (fieldConfig.type === 'array') {
            this.setArrayValue(this.data[i], fg as FormArray, i);
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.formGroup) {
      this.onFormGroupChanged();
    }

    if (changes.data) {
      this.init();
      this.onFormGroupChanged();
      if (this.entityForm) {
        this.entityForm.form.markAsPristine();
      }
    }
  }

  setControlChangeDetection(): void {
    this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe((evt) => {
      this.target.next({ name: 'FormGroupValueChanged', data: evt, sender: this.formGroup });
    });
    const fg = Object.keys(this.formGroup.controls);
    fg.forEach((control) => {
      this.formGroup.controls[control].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      });
    });
  }

  onFormGroupChanged(): void {
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

  goBack(): void {
    this.target.next({ name: 'FormCancelled', sender: this.conf });
  }

  onSubmit(event: Event, eventName?: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);

    // TODO: remove
    for (const i in value) {
      if (value.hasOwnProperty(i)) {
        const cleanMethod = new EntityUtils().getCleanMethod(i);
        if ((this.conf as any)[cleanMethod]) {
          value = (this.conf as any)[cleanMethod](value, i);
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

    if (!eventName) {
      this.target.next({ name: 'FormSubmitted', data: value, sender: this.conf });
      this.after(value);
    } else {
      this.target.next({ name: eventName, data: value, sender: this.conf });
      this.after(value);
    }
  }

  after(value: any): void {
    if (this.conf.afterSubmit) {
      this.conf.afterSubmit(value);
    }
  }

  clearErrors(): void {
    this.fieldConfig.forEach((config) => {
      config['errors'] = '';
      config['hasErrors'] = false;
    });
  }

  isShow(id: string): boolean {
    if (this.conf.isBasicMode) {
      if (this.conf.advancedFields.includes(id)) {
        return false;
      }
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

  createControl(config: FieldConfig): FormControl {
    const { disabled, validation, value } = config;
    return this.fb.control({ disabled, value }, validation);
  }

  setDisabled(name: string, disable: boolean): void {
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

  setValue(name: string, value: any): void {
    this.formGroup.controls[name].setValue(value, { emitEvent: true });
  }

  setArrayValue(data: any[], formArray: FormArray, name: string): void {
    let arrayFieldConfigs: FieldConfig[];
    this.fieldConfig.forEach((config) => {
      if (config.name === name) {
        const arrayConfig = config as FormArrayConfig;
        arrayFieldConfigs = arrayConfig.formarray;
      }
    });

    if (this.conf.preHandler) {
      data = this.conf.preHandler(data, formArray);
    }

    data.forEach((value, index) => {
      this.conf.initialCount += 1;
      this.conf.initialCount_default += 1;

      const formGroup = this.entityFormService.createFormGroup(arrayFieldConfigs);
      for (const i in value) {
        const formControl = formGroup.controls[i];
        formControl.setValue(value[i]);
      }
      formArray.insert(index, formGroup);
    });
  }

  setRelation(config: FieldConfig): void {
    const activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup,
      );
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup).forEach((control) => {
        control.valueChanges.pipe(untilDestroyed(this)).subscribe(
          () => { this.relationUpdate(config, activations); },
        );
      });
    }
  }

  relationUpdate(config: FieldConfig, activations: RelationGroup): void {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, this.formGroup,
    );
    this.setDisabled(config.name, tobeDisabled);
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  setHiddenFieldSets(fs: string[]): void {
    this.hiddenFieldSets = fs;
  }
}
