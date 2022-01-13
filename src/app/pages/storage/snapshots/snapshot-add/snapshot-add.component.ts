import {
  AfterViewInit, Component,
} from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-add',
  template: `
  <div *ngIf="initialized">
    <entity-form [conf]="this"></entity-form>
  </div>`,
})

export class SnapshotAddComponent implements AfterViewInit, FormConfiguration {
  routeSuccess = ['storage', 'snapshots'];
  isEntity = true;
  isNew = true;
  initialized = true;
  addCall = 'zfs.snapshot.create' as const;
  private entityForm: EntityFormComponent;
  private nameValidator: ValidatorFn;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_snapshot,
      label: true,
      class: 'snapshot',
      width: '49%',
      config: [{
        type: 'select',
        name: 'dataset',
        placeholder: helptext.snapshot_add_dataset_placeholder,
        tooltip: helptext.snapshot_add_dataset_tooltip,
        options: [],
        validation: helptext.snapshot_add_dataset_validation,
        required: true,
      },
      {
        type: 'input',
        name: 'name',
        placeholder: helptext.snapshot_add_name_placeholder,
        tooltip: helptext.snapshot_add_name_tooltip,
        errors: this.translate.instant('Name or Naming Schema is required. Only one field can be used at a time.'),
        blurStatus: true,
        blurEvent: this.updateNameValidity.bind(this),
      },
      {
        type: 'select',
        name: 'naming_schema',
        placeholder: helptext.snapshot_add_naming_schema_placeholder,
        tooltip: helptext.snapshot_add_naming_schema_tooltip,
        options: [],
        onChangeOption: this.updateNameValidity.bind(this),
      },
      {
        type: 'checkbox',
        name: 'recursive',
        value: false,
        placeholder: helptext.snapshot_add_recursive_placeholder,
        tooltip: helptext.snapshot_add_recursive_tooltip,
      }],
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    private sysGeneralService: SystemGeneralService,
    protected translate: TranslateService,
  ) {
  }

  ngAfterViewInit(): void {
    this.ws.call('pool.dataset.query', [[['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { extra: { flat: false } }]).pipe(untilDestroyed(this)).subscribe((datasets) => {
      const rows = new EntityUtils().flattenData(datasets);

      rows.forEach((dataItem: { name: string }) => {
        if (typeof (dataItem.name) !== 'undefined' && dataItem.name.length > 0) {
          const config = this.fieldConfig[0] as FormSelectConfig;
          config.options.push({
            label: dataItem.name,
            value: dataItem.name,
          });
        }
      });

      this.initialized = true;
    });

    this.ws
      .call('replication.list_naming_schemas')
      .pipe(map(new EntityUtils().array1dToLabelValuePair))
      .pipe(untilDestroyed(this)).subscribe(
        (options) => {
          const config = this.fieldConfig.find((config) => config.name === 'naming_schema') as FormSelectConfig;
          config.options = [
            { label: '---', value: undefined },
            ...options,
          ];
        },
        (error) => new EntityUtils().handleWsError(this, error, this.dialog),
      );
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    const nameControl = this.entityForm.formGroup.get('name');
    const nameConfig = this.fieldConfig.find((config) => config.name === 'name');
    const namingSchemaControl = this.entityForm.formGroup.get('naming_schema');

    this.sysGeneralService.getGeneralConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      nameControl.setValue(
        'manual-' + format(
          utcToZonedTime(
            zonedTimeToUtc(
              new Date(),
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            ),
            res.timezone,
          ),
          'yyyy-MM-dd_HH-mm',
          { timeZone: res.timezone },
        ),
      );
    });

    this.nameValidator = (nc: FormControl): { [error_key: string]: string } | null => {
      if (!!nc.value && !!namingSchemaControl.value) {
        nameConfig.hasErrors = nc.touched;
        return {
          duplicateNames: this.translate.instant('Name and Naming Schema cannot be provided at the same time.'),
        };
      }

      if (!nc.value && !namingSchemaControl.value) {
        nameConfig.hasErrors = nc.touched;
        return {
          nameRequired: this.translate.instant('Name or Naming Schema must be provided.'),
        };
      }

      nameConfig.hasErrors = false;
      return null;
    };

    nameControl.setValidators(this.nameValidator.bind(this));
  }

  beforeSubmit(snapshot: any): void {
    if (!snapshot.name) {
      delete snapshot.name;
    } else if (!snapshot.naming_schema) {
      delete snapshot.naming_schema;
    }
  }

  updateNameValidity(): void {
    this.entityForm.formGroup.get('name').updateValueAndValidity();
  }
}
