import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService, WebSocketService } from '../../../../services';
import { AbstractControl, FormControl, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../../translate-marker';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {FieldSet} from '../../entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../entity/entity-form/services/field-relation.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

import { MatStepper } from '@angular/material/stepper';
import { DialogService } from '../../../../services/';
import { EntityUtils } from '../utils';

@Component({
  selector: 'entity-wizard',
  templateUrl: './entity-wizard.component.html',
  styleUrls: ['./entity-wizard.component.css', '../entity-form/entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService]
})
export class EntityWizardComponent implements OnInit {
  @Input('conf') conf: any;
  @ViewChild('stepper', {static: true}) stepper: MatStepper;

  public formGroup: FormGroup;
  public showSpinner = false;
  public busy: Subscription;

  public saveSubmitText = T("Submit");
  public customNextText = T("Next");

  get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

  constructor(protected rest: RestService, protected ws: WebSocketService,
    private formBuilder: FormBuilder, private entityFormService: EntityFormService,
    protected loader: AppLoaderService, protected fieldRelationService: FieldRelationService,
    protected router: Router, protected aroute: ActivatedRoute,
    private dialog: DialogService, protected translate: TranslateService) {

  }

  ngOnInit() {
    if (this.conf.showSpinner) {
      this.showSpinner = true;
    }
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }

    let wizardformArray = this.formBuilder.array([]);
    for (let i in this.conf.wizardConfig) {

      // Fallback if no fieldsets are defined
      if(this.conf.wizardConfig[i].fieldSets){
        let fieldConfig = [];
        /* Temp patch to support both FieldSet approaches */
        const fieldSets = this.conf.wizardConfig[i].fieldSets.list ? this.conf.wizardConfig[i].fieldSets.list() : this.conf.wizardConfig[i].fieldSets;
        for(let j = 0; j < fieldSets.length; j++){
          const fieldset = fieldSets[j];
          if(fieldset.config){
            fieldConfig = fieldConfig.concat(fieldset.config);
          }
        }
        this.conf.wizardConfig[i].fieldConfig = fieldConfig;
      } else {
        // const fieldConfig = this.conf.wizardConfig[i].fieldConfig;
        this.conf.wizardConfig[i].fieldSets = [
          {
            name:'FallBack',
            class:'fallback',
            width:'100%',
            divider:false,
            config: this.conf.wizardConfig[i].fieldConfig
          },
          {
            name:'divider',
            divider:true,
            width:'100%'
          }
        ]

      }
      wizardformArray.push(this.entityFormService.createFormGroup(this.conf.wizardConfig[i].fieldConfig));
    }

    this.formGroup = this.formBuilder.group({
      formArray: wizardformArray
    });

    for (let i in this.conf.wizardConfig) {
      for (let j in this.conf.wizardConfig[i].fieldConfig) {
        let config = this.conf.wizardConfig[i].fieldConfig[j];
        if (config.relation.length > 0) {
          this.setRelation(config, i);
        }
      }
    }

    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
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

  goBack() {
    if(this.conf.customCancel) {
      return this.conf.customCancel();
    }
    let route = this.conf.route_cancel;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  setRelation(config: FieldConfig, stepIndex: any) {
    let activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, < FormGroup > this.formArray.get(stepIndex));
      const tobeHide = this.fieldRelationService.isFormControlToBeHide(activations, < FormGroup > this.formArray.get(stepIndex));
      this.setDisabled(config.name, tobeDisabled, stepIndex, tobeHide);

      this.fieldRelationService.getRelatedFormControls(config, < FormGroup > this.formArray.get(stepIndex))
        .forEach(control => {
          control.valueChanges.subscribe(
            () => { this.relationUpdate(config, activations, stepIndex); });
        });
    }
  }

  setDisabled(name: string, disable: boolean, stepIndex: any, hide?: boolean) {
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    for (let i in this.conf.wizardConfig) {
      this.conf.wizardConfig[i].fieldConfig = this.conf.wizardConfig[i].fieldConfig.map((item) => {
        if (item.name === name) {
          item.disabled = disable;
          item['isHidden'] = hide;
        }
        return item;
      });
    }

    if (( < FormGroup > this.formArray.get([stepIndex])).controls[name]) {
      const method = disable ? 'disable' : 'enable';
      ( < FormGroup > this.formArray.get([stepIndex])).controls[name][method]();
      return;
    }
  }

  relationUpdate(config: FieldConfig, activations: any, stepIndex: any) {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, < FormGroup > this.formArray.get(stepIndex));
    const tobeHide = this.fieldRelationService.isFormControlToBeHide(
      activations, < FormGroup > this.formArray.get(stepIndex));
    this.setDisabled(config.name, tobeDisabled, stepIndex, tobeHide);
  }

  onSubmit() {
    let value = {};
    for (let i in this.formGroup.value.formArray) {
      value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
    }

    value = new EntityUtils().changeNullString2Null(value);

    if (this.conf.beforeSubmit) {
      value = this.conf.beforeSubmit(value);
    }

    if (this.conf.customSubmit) {
      this.busy = this.conf.customSubmit(value);
    } else {
      this.loader.open();

      this.ws.job(this.conf.addWsCall, [value]).subscribe(
        (res) => {
          this.loader.close();
          if (res.error) {
            this.dialog.errorReport(res.error, res.reason, res.exception);
          } else {
            if (this.conf.route_success) {
              this.router.navigate(new Array('/').concat(this.conf.route_success));
            } else {
              this.dialog.Info(T("Settings saved"), '', '300px', 'info', true);
            }
          }
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        },
      );
    }
  }

  originalOrder = function () {};


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

  handleNext(currentStep) {
    currentStep.stepControl.markAllAsTouched();
    if (this.conf.customNext !== undefined) {
      this.conf.customNext(this.stepper);
    }
  }

  selectionChange(event: StepperSelectionEvent) {
    /**
     * This function is for update summary data whenever step changes
     * We use isAutoSummary flag to generate summary automatically
     */
    if (this.conf.isAutoSummary) {
      if (event.selectedIndex == this.conf.wizardConfig.length) {
        this.conf.summary = [];
        for(let step=0; step<this.conf.wizardConfig.length; step++){
          const wizard = this.conf.wizardConfig[step];
          wizard.fieldConfig.forEach(fieldConfig => {
            const formControl = ( < FormGroup > this.formArray.get([step]).get(fieldConfig.name));
            if (formControl) {
              let summaryName = fieldConfig.placeholder;
              if (!summaryName) {
                summaryName = fieldConfig.name;
              }
              this.conf.summary[summaryName] = this.getSummaryValue(fieldConfig, formControl);
            }
          });
        }
      }
    }
  }

  getSummaryValue(fieldConfig: FieldConfig, formControl: AbstractControl) {
    let result = formControl.value;

    if (fieldConfig.type === 'select') {
      const selectedOption = fieldConfig.options.find(option => option.value == formControl.value);
        if (selectedOption) {
          result = selectedOption.label;
        }
    } else if (Array.isArray(formControl.value)) {
      let arrayValueCount = 0;
      formControl.value.forEach(item => {
        const isNotEmptyArray = new EntityUtils().filterArrayFunction(item);
        if (isNotEmptyArray) {
          arrayValueCount++;
        }
      });
      result = arrayValueCount;
    }

    return result;
  }
}
