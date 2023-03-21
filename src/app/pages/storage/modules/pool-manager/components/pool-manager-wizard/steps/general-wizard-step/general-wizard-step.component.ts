import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { AsyncValidatorFn, FormControl, ValidationErrors } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY,
  map, Observable, of, take,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option } from 'app/interfaces/option.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { forbiddenValuesError } from 'app/modules/entity/entity-form/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit {
  @Input() form: PoolManagerWizardComponent['form']['controls']['general'];
  hasNonUniqueSerialDisks = false;
  exportedPoolsOptions$: Observable<Option[]>;
  exportedPoolsTooltip: string = this.translate.instant('Some of the disks are attached to the exported pools \
  mentioned in this list. Checking a pool name means you want to \
  allow reallocation of the disks attached to that pool.');
  exportedPools: string[] = [];
  includeNonUniqueSerialDisks = false;
  allowNonUniqueSerialDisksOptions$: Observable<Option[]> = of([
    { label: this.translate.instant('Allow'), value: 'true' },
    { label: this.translate.instant('Don\'t Allow'), value: 'false' },
  ]);

  readonly encryptionAlgorithmOptions$ = this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(
    choicesToOptions(),
  );

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const poolQuery$ = this.ws.call('pool.query');
    this.form.controls.name.addAsyncValidators(this.poolNamesAsyncValidator(poolQuery$));

    this.form.controls.encryption_standard.disable();
    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((isEncrypted) => {
      if (isEncrypted) {
        this.dialog.confirm({
          title: this.translate.instant('Warning'),
          message: helptext.manager_encryption_message,
          buttonText: this.translate.instant('I Understand'),
        }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
          if (!confirmed) {
            this.form.controls.encryption.setValue(false);
            this.form.controls.encryption_standard.disable();
          } else {
            this.form.controls.encryption_standard.enable();
          }
          this.cdr.markForCheck();
        });
      } else {
        this.form.controls.encryption_standard.disable();
        this.cdr.markForCheck();
      }
    });

    this.store.select((state) => state.unusedDisks).pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.hasNonUniqueSerialDisks = unusedDisks.some((disk) => disk.duplicate_serial.length);
      this.exportedPools = unusedDisks.filter((disk) => !!disk.exported_zpool)
        .map((disk) => disk.exported_zpool)
        .filter((value, index, self) => self.indexOf(value) === index);
      this.exportedPoolsOptions$ = of(this.exportedPools.map((pool) => ({ label: pool, value: pool })));
      this.cdr.markForCheck();
    });
  }

  allowNonUniqueSerialDisks(allow: boolean): void {
    this.includeNonUniqueSerialDisks = allow;
  }

  poolNamesAsyncValidator(poolsQuery$: Observable<Pool[]>): AsyncValidatorFn {
    let existingPools: string[];

    poolsQuery$.pipe(
      map((pools) => pools.map((pool) => pool.name)),
      untilDestroyed(this),
    ).subscribe((poolNames) => existingPools = poolNames);

    return (control: FormControl): Observable<ValidationErrors> | null => {
      if (control.value === '' || control.value === undefined) {
        return null;
      }

      if (existingPools) {
        return of(existingPools).pipe(
          map((arrayOfValues) => {
            return forbiddenValuesError(arrayOfValues, false, control);
          }),
          take(1),
        );
      }

      return poolsQuery$.pipe(
        map((pools) => {
          const poolNames = pools.map((pool) => pool.name);
          return forbiddenValuesError(poolNames, false, control);
        }),
        catchError((error) => {
          console.error(error);
          return EMPTY;
        }),
        take(1),
      );
    };
  }
}
