import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { AlertDefaults } from 'app/pages/system/alert/alert-defaults.interface';
import { DialogService, WebSocketService } from 'app/services/';
import { LayoutService } from 'app/services/layout.service';

/**
 * This form is unlike other forms in the app which make use of EntityForm.
 * This component's form config is generated based on a response from the
 * middleware.
 */
@UntilDestroy()
@Component({
  selector: 'ix-system-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['../../../modules/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService],
})
export class AlertConfigComponent implements OnInit, AfterViewInit {
  protected queryCall = 'alertclasses.config' as const;
  protected editCall = 'alertclasses.update' as const;
  protected isEntity = true;
  fieldSets: FieldSets;
  readonly productType = window.localStorage.getItem('product_type') as ProductType;
  fieldConfig: FieldConfig[] = [];
  protected settingOptions: Option[] = [];
  protected warningOptions: Option[] = [
    { label: this.translate.instant('INFO'), value: AlertLevel.Info },
    { label: this.translate.instant('NOTICE'), value: AlertLevel.Notice },
    { label: this.translate.instant('WARNING'), value: AlertLevel.Warning },
    { label: this.translate.instant('ERROR'), value: AlertLevel.Error },
    { label: this.translate.instant('CRITICAL'), value: AlertLevel.Critical },
    { label: this.translate.instant('ALERT'), value: AlertLevel.Alert },
    { label: this.translate.instant('EMERGENCY'), value: AlertLevel.Emergency },
  ];
  formGroup: UntypedFormGroup;
  categories: AlertCategory[] = [];
  protected defaults: AlertDefaults[] = [];

  selectedIndex = 0;

  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    public dialog: DialogService,
    protected translate: TranslateService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.loader.open();
    this.ws.call('alert.list_policies').pipe(untilDestroyed(this)).subscribe(
      (policies) => {
        this.settingOptions = policies.map((policy) => {
          let label: string = policy;
          if (policy === AlertPolicy.Immediately) {
            label = policy + ' (Default)';
          }

          return { label, value: policy };
        });
      },
      (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialog);
      },
    );

    const sets: FieldSet[] = [];

    this.ws
      .call('alert.list_categories')
      .toPromise()
      .then((categories) => {
        this.categories = categories;
        categories.forEach((category) => {
          const config: FieldConfig[] = [];
          for (const categoryClass of category.classes) {
            const warningOptions = [];
            for (const warningOption of this.warningOptions) {
              // apparently this is the proper way to clone an object
              const option = JSON.parse(JSON.stringify(warningOption));
              if (option.value === categoryClass.level) {
                option.label = option.label + ' (Default)';
              }
              warningOptions.push(option);
            }
            config.push(
              {
                type: 'select',
                class: 'new-line',
                name: categoryClass.id + '_level',
                inlineLabel: categoryClass.title,
                placeholder: this.translate.instant('Set Warning Level'),
                tooltip: helptext.level_tooltip,
                options: warningOptions,
                value: categoryClass.level,
              },
              {
                type: 'select',
                name: categoryClass.id + '_policy',
                inlineLabel: ' ',
                placeholder: this.translate.instant('Set Frequency'),
                tooltip: helptext.policy_tooltip,
                options: this.settingOptions,
                value: AlertPolicy.Immediately,
              },
            );

            if (categoryClass.proactive_support && this.isEnterprise) {
              config.push({
                type: 'checkbox',
                name: categoryClass.id + '_proactive_support',
                value: true,
                inlineLabel: ' ',
                placeholder: this.translate.instant('Proactive Support'),
              });
            }

            if (categoryClass.proactive_support && this.isEnterprise) {
              this.defaults.push({
                id: categoryClass.id,
                level: categoryClass.level,
                policy: AlertPolicy.Immediately,
                proactive_support: true,
              });
            } else {
              this.defaults.push({
                id: categoryClass.id,
                level: categoryClass.level,
                policy: AlertPolicy.Immediately,
              });
            }
          }

          const fieldSet = {
            name: category.title,
            label: true,
            width: '100%',
            config,
          };

          sets.push(fieldSet);
        });

        this.fieldSets = new FieldSets(sets);

        this.fieldConfig = this.fieldSets.configs();
        this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

        this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe(
          (alertConfig) => {
            this.loader.close();
            for (const alertClass in alertConfig.classes) {
              for (const levelOrPolicy in alertConfig.classes[alertClass]) {
                const controlName = alertClass + '_' + levelOrPolicy;
                const controlValue = alertConfig.classes[alertClass][levelOrPolicy as keyof AlertClassSettings];
                if (this.formGroup.controls[controlName]) {
                  this.formGroup.controls[controlName].setValue(controlValue);
                } else {
                  console.error('Missing control: ' + controlName); // some properties don't exist between both calls?
                }
              }
            }
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWsError(this, err, this.dialog);
          },
        );
      })
      .catch((error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialog);
      });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onCategoryChanged(index: number): void {
    this.selectedIndex = index;
  }

  get isEnterprise(): boolean {
    return this.productType === ProductType.ScaleEnterprise;
  }

  onSubmit(): void {
    const payload: AlertClassesUpdate = { classes: {} };
    for (const key in this.formGroup.value) {
      const keyValues = key.split('_');
      const alertClass = keyValues.shift();
      const classKey = keyValues.reduce((prev, current) => prev + '_' + current);
      const defaultClassValues = _.find(this.defaults, { id: alertClass });
      const defaultValueUpperCased = defaultClassValues[classKey as keyof AlertDefaults].toString().toUpperCase();
      const formValueUpperCased = this.formGroup.value[key].toString().toUpperCase();
      if (defaultValueUpperCased !== formValueUpperCased) {
        // do not submit defaults in the payload
        if (!payload.classes[alertClass]) {
          payload.classes[alertClass] = {};
        }

        // Something wrong with Typescript typing or eslint rule.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        ((payload.classes[alertClass] as any)[classKey] as AlertLevel | AlertPolicy) = this.formGroup.value[key];
      }
    }

    this.loader.open();

    this.ws
      .call(this.editCall, [payload])
      .pipe(untilDestroyed(this)).subscribe(
        () => this.dialog.info(this.translate.instant('Settings saved'), ''),
        (error) => new EntityUtils().handleWsError(this, error, this.dialog),
      )
      .add(() => this.loader.close());
  }
}
