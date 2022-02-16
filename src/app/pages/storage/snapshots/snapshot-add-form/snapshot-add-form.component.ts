import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns-tz';
import {
  Observable, combineLatest, of,
} from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { Option } from 'app/interfaces/option.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { atLeastOne } from 'app/modules/entity/entity-form/validators/at-least-one-validation';
import { hasTwoValuesValidator } from 'app/modules/entity/entity-form/validators/has-two-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import IxValidatorsService from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-add-form.component.html',
  styleUrls: ['./snapshot-add-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotAddFormComponent implements OnInit {
  isFormLoading = true;
  form = this.fb.group({
    dataset: ['', Validators.required],
    name: [this.getDefaultSnapshotName()],
    naming_schema: ['', [this.validatorsService.withMessage(
      atLeastOne('name', [helptext.snapshot_add_name_placeholder, helptext.snapshot_add_naming_schema_placeholder]),
      {
        forProperty: 'atLeastOne',
        message: this.translate.instant('Name or Naming Schema must be provided.'),
      },
    ), this.validatorsService.withMessage(
      hasTwoValuesValidator('name'),
      {
        forProperty: 'hasTwoValues',
        message: this.translate.instant('Name and Naming Schema cannot be provided at the same time.'),
      },
    )]],
    recursive: [false],
  });

  datasetOptions$: Observable<Option[]>;
  namingSchemaOptions$: Observable<Option[]>;

  readonly helptext = helptext;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private validatorsService: IxValidatorsService,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.getDatasetOptions(),
      this.getNamingSchemaOptions(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(
      ([datasetOptions, namingSchemaOptions]) => {
        this.datasetOptions$ = of(datasetOptions);
        this.namingSchemaOptions$ = of(namingSchemaOptions);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    );
  }

  onSubmit(): void {
    const values = this.form.value;
    const params: CreateZfsSnapshot = {
      dataset: values.dataset,
      recursive: values.recursive,
    };
    if (values.naming_schema) {
      params.naming_schema = values.naming_schema;
    } else {
      params.name = values.name;
    }

    this.isFormLoading = true;
    this.ws.call('zfs.snapshot.create', [params]).pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.isFormLoading = false;
      this.slideIn.close();
      this.cdr.markForCheck();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  private getDefaultSnapshotName(): string {
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `manual-${datetime}`;
  }

  private getDatasetOptions(): Observable<Option[]> {
    return this.ws.call('pool.dataset.query', [
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { extra: { flat: false } },
    ]).pipe(
      map((datasets) => datasets.map((dataset) => ({ label: dataset.name, value: dataset.name }))),
    );
  }

  private getNamingSchemaOptions(): Observable<Option[]> {
    return this.ws.call('replication.list_naming_schemas').pipe(
      map(new EntityUtils().array1dToLabelValuePair),
      map((options) => [{ label: '---', value: undefined }, ...options]),
    );
  }
}
