import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  Component, Input, OnInit, ViewChild,
} from '@angular/core';
import {
  AbstractControl, UntypedFormBuilder, UntypedFormGroup,
} from '@angular/forms';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-entity-wizard',
  templateUrl: './entity-wizard.component.html',
  styleUrls: ['./entity-wizard.component.scss', '../entity-form/entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService],
})
export class EntityWizardComponent implements OnInit {
  @Input() conf: WizardConfiguration;
  @ViewChild('stepper', { static: true }) stepper: MatStepper;

  formGroup: UntypedFormGroup;
  showSpinner = false;

  summaryValue: unknown;
  summaryFieldConfigs: FieldConfig[] = [];

  saveSubmitText: string = this.translate.instant('Save');
  customNextText = this.translate.instant('Next');
  get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

  constructor(
    protected ws: WebSocketService,
    private formBuilder: UntypedFormBuilder,
    private entityFormService: EntityFormService,
    public loader: AppLoaderService,
    protected fieldRelationService: FieldRelationService,
    protected router: Router,
    protected aroute: ActivatedRoute,
    private dialog: DialogService,
    protected translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (this.conf.showSpinner) {
      this.showSpinner = true;
    }
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }

    this.resetFields();

    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  resetFields(): void {
    const wizardformArray = this.formBuilder.array([]);
    this.conf.wizardConfig.forEach((config) => {
      // Fallback if no fieldsets are defined
      if (config.fieldSets) {
        let fieldConfig: FieldConfig[] = [];

        /* Temp patch to support both FieldSet approaches */
        const fieldSets = config.fieldSets;
        fieldSets.forEach((fieldset) => {
          if (fieldset.config) {
            fieldConfig = fieldConfig.concat(fieldset.config);
          }
        });
        config.fieldConfig = fieldConfig;
      } else {
        config.fieldSets = [
          {
            name: 'FallBack',
            class: 'fallback',
            width: '100%',
            divider: false,
            config: config.fieldConfig,
          },
          {
            name: 'divider',
            divider: true,
            width: '100%',
          },
        ];
      }
      wizardformArray.push(this.entityFormService.createFormGroup(config.fieldConfig));
    });

    this.formGroup = this.formBuilder.group({
      formArray: wizardformArray,
    });

    this.conf.wizardConfig.forEach((config, i) => {
      this.summaryFieldConfigs = this.summaryFieldConfigs.concat(config.fieldConfig);
      const formGroup = this.formArray.get(String(i)) as UntypedFormGroup;
      config.fieldConfig.forEach((fieldConfig) => {
        this.fieldRelationService.setRelation(fieldConfig, formGroup);
      });
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

  goBack(): void {
    if (this.conf.customCancel) {
      this.conf.customCancel();
      return;
    }
    let route = this.conf.routeCancel;
    if (!route) {
      route = this.conf.routeSuccess;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  setDisabled(name: string, disable: boolean, stepIndex: number | string, hide?: boolean): void {
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    this.conf.wizardConfig.forEach((config) => {
      config.fieldConfig = config.fieldConfig.map((item) => {
        if (item.name === name) {
          item.disabled = disable;
          item['isHidden'] = hide;
        }
        return item;
      });
    });

    if ((this.formArray.get([stepIndex]) as UntypedFormGroup).controls[name]) {
      const method = disable ? 'disable' : 'enable';
      (this.formArray.get([stepIndex]) as UntypedFormGroup).controls[name][method]();
    }
  }

  onSubmit(): void {
    let value = {};
    for (const i in this.formGroup.value.formArray) {
      value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
    }

    value = new EntityUtils().changeNullString2Null(value);

    if (this.conf.beforeSubmit) {
      value = this.conf.beforeSubmit(value);
    }

    this.clearErrors();
    if (this.conf.customSubmit) {
      this.conf.customSubmit(value);
    } else {
      this.loader.open();

      this.ws.job(this.conf.addWsCall, [value]).pipe(untilDestroyed(this)).subscribe({
        next: (res) => {
          this.loader.close();
          if (res.error) {
            this.dialog.errorReport(res.error, (res as any).reason, res.exception);
          } else if (this.conf.routeSuccess) {
            this.router.navigate(new Array('/').concat(this.conf.routeSuccess));
          } else {
            this.dialog.info(this.translate.instant('Settings saved'), '');
          }
        },
        error: (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        },
      });
    }
  }

  isFieldsetAvailabel(fieldset: FieldSet): boolean {
    if (fieldset.config) {
      return fieldset.config.some((config) => !config.isHidden);
    }
    return false;
  }

  handleNext(currentStep: MatStep): void {
    currentStep.stepControl.markAllAsTouched();
    if (this.conf.customNext !== undefined) {
      this.conf.customNext(this.stepper);
    }
  }

  /**
   * This function is for update summary data whenever step changes
   * We use isAutoSummary flag to generate summary automatically
   */
  selectionChange(event: StepperSelectionEvent): void {
    if (this.conf.isAutoSummary) {
      if (event.selectedIndex === this.conf.wizardConfig.length) {
        let value = {};
        for (const i in this.formGroup.value.formArray) {
          value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
        }
        this.summaryValue = value;
      }
    }
  }

  clearErrors(): void {
    this.conf.wizardConfig.forEach((wizardConfig) => {
      wizardConfig.fieldConfig.forEach((config) => {
        config['errors'] = '';
        config['hasErrors'] = false;
      });
    });
  }
}
