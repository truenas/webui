import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import helptext from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AlertDefaults } from 'app/pages/system/alert/alert-defaults.interface';
import { DialogService, WebSocketService } from 'app/services/';
import { CoreService } from 'app/services/core-service/core.service';

/**
 * This form is unlike other forms in the app which make use of EntityForm.
 * This component's form config is generated based on a response from the
 * middleware.
 */
@UntilDestroy()
@Component({
  selector: 'app-system-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['../../../modules/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService],
})
export class AlertConfigComponent implements OnInit {
  formEvent$: Subject<CoreEvent>;
  protected queryCall = 'alertclasses.config' as const;
  protected editCall = 'alertclasses.update' as const;
  protected isEntity = true;
  fieldSets: FieldSets;
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
  formGroup: FormGroup;
  isReady = false;
  protected defaults: AlertDefaults[] = [];

  selectedIndex = 0;

  constructor(
    protected core: CoreService,
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    public dialog: DialogService,
    protected translate: TranslateService,
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
        this.addButtons(categories);
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

            this.defaults.push({
              id: categoryClass.id,
              level: categoryClass.level,
              policy: AlertPolicy.Immediately,
            });
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

  addButtons(categories: AlertCategory[]): void {
    const options: Option[] = [];
    categories.forEach((category, index) => {
      options.push({ label: category.title, value: index });
    });
    this.formEvent$ = new Subject();
    this.formEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control === 'save') {
        this.onSubmit();
      } else {
        this.selectedIndex = evt.data.category.value;
      }
    });

    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvent$,
        controls: [
          {
            name: 'save',
            label: 'Save',
            type: 'button',
            color: 'primary',
          },
          {
            name: 'category',
            label: 'Category',
            type: 'menu',
            options,
          },
        ],
      },
    };

    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
  }

  onSubmit(): void {
    const payload: AlertClassesUpdate = { classes: {} };

    for (const key in this.formGroup.value) {
      const keyValues = key.split('_');
      const alertClass = keyValues[0];
      const classKey = keyValues[1] as 'policy' | 'level';
      const def = _.find(this.defaults, { id: alertClass });
      if (def[classKey].toUpperCase() !== this.formGroup.value[key].toUpperCase()) {
        // do not submit defaults in the payload
        if (!payload.classes[alertClass]) {
          payload.classes[alertClass] = {};
        }

        // Something wrong with Typescript typing or eslint rule.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        (payload.classes[alertClass][classKey] as AlertLevel | AlertPolicy) = this.formGroup.value[key];
      }
    }

    this.loader.open();

    this.ws
      .call(this.editCall, [payload])
      .pipe(untilDestroyed(this)).subscribe(
        () => this.dialog.info(this.translate.instant('Settings saved'), '', '300px', 'info', true),
        (error) => new EntityUtils().handleWsError(this, error, this.dialog),
      )
      .add(() => this.loader.close());
  }
}
