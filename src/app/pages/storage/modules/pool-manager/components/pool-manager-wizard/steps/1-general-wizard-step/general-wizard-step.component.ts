import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  combineLatest, map, Observable,
} from 'rxjs';
import { startWith, take } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Option } from 'app/interfaces/option.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

const defaultEncryptionStandard = 'AES-256-GCM';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxInputComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    PoolWarningsComponent,
    FormActionsComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    TranslateModule,
  ],
})
export class GeneralWizardStepComponent implements OnInit, OnChanges {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private store = inject(PoolManagerStore);
  private store$ = inject<Store<AppState>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private poolWizardNameValidationService = inject(PoolWizardNameValidationService);

  readonly isAddingVdevs = input(false);
  readonly pool = input<Pool | undefined>(undefined);

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    encryptionType: [EncryptionType.None],
    encryptionStandard: [defaultEncryptionStandard, Validators.required],
    sedPassword: [''],
    sedPasswordConfirm: [''],
  }, {
    validators: [
      matchOthersFgValidator(
        'sedPasswordConfirm',
        ['sedPassword'],
        this.translate.instant(helptextPoolCreation.sedPasswordsMustMatch),
      ),
    ],
  });

  protected readonly EncryptionType = EncryptionType;
  protected readonly helptext = helptextPoolCreation;

  isLoading$ = this.store.isLoading$;
  poolNames$ = this.api.call('pool.query', [[], { select: ['name'], order_by: ['name'] }]).pipe(
    map((pools) => pools.map((pool) => pool.name)),
  );

  private readonly oldNameForbiddenValidator = forbiddenAsyncValues(this.poolNames$);

  readonly encryptionAlgorithmOptions$ = this.api
    .call('pool.dataset.encryption_algorithm_choices')
    .pipe(choicesToOptions());

  hasSedCapableDisks$ = this.store.hasSedCapableDisks$;
  isEnterprise$ = this.store$.select(selectIsEnterprise);
  isSedPasswordSet$ = this.api.call('system.advanced.sed_global_password_is_set');

  encryptionTypeOptions$: Observable<Option<EncryptionType>[]> = combineLatest([
    this.hasSedCapableDisks$,
    this.isEnterprise$,
  ]).pipe(
    map(([hasSedDisks, isEnterprise]) => {
      const options: Option<EncryptionType>[] = [
        { label: this.translate.instant(helptextPoolCreation.encryptionTypeNone), value: EncryptionType.None },
        { label: this.translate.instant(helptextPoolCreation.encryptionTypeSoftware), value: EncryptionType.Software },
      ];

      if (hasSedDisks && isEnterprise) {
        options.push({
          label: this.translate.instant(helptextPoolCreation.encryptionTypeSed),
          value: EncryptionType.Sed,
        });
      }

      return options;
    }),
  );

  ngOnChanges(): void {
    if (this.isAddingVdevs()) {
      this.form.controls.encryptionType.disable();
      this.form.controls.encryptionStandard.disable();
      this.form.controls.sedPassword.disable();
      this.form.controls.sedPasswordConfirm.disable();
      this.form.controls.name.setValue(this.pool()?.name || '');
      this.form.controls.name.removeAsyncValidators(this.oldNameForbiddenValidator);
      this.form.controls.name.updateValueAndValidity();

      // Set encryption type based on pool's SED status for disk filtering
      if (this.pool()?.all_sed) {
        this.form.controls.encryptionType.setValue(EncryptionType.Sed);
      }
    } else {
      this.form.controls.name.addAsyncValidators([
        this.oldNameForbiddenValidator,
        this.poolWizardNameValidationService.validatePoolName,
      ]);
      this.form.controls.name.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    this.initEncryptionField();
    this.initSedDefaults();
    this.connectGeneralOptionsToStore();

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.resetForm();
    });
  }

  /**
   * Returns an observable that emits the default encryption type based on
   * available SED-capable disks and Enterprise license status.
   */
  private getDefaultEncryptionType$(): Observable<EncryptionType> {
    return combineLatest([this.hasSedCapableDisks$, this.isEnterprise$]).pipe(
      take(1),
      map(([hasSedDisks, isEnterprise]) => {
        return (hasSedDisks && isEnterprise) ? EncryptionType.Sed : EncryptionType.None;
      }),
    );
  }

  private resetForm(): void {
    this.getDefaultEncryptionType$()
      .pipe(untilDestroyed(this))
      .subscribe((defaultEncryptionType) => {
        this.form.reset({
          encryptionType: defaultEncryptionType,
          encryptionStandard: defaultEncryptionStandard,
        });
      });
  }

  private initSedDefaults(): void {
    // Set SED as default if SED-capable disks detected and Enterprise license
    if (this.isAddingVdevs()) {
      return;
    }

    this.getDefaultEncryptionType$()
      .pipe(untilDestroyed(this))
      .subscribe((defaultEncryptionType) => {
        if (defaultEncryptionType === EncryptionType.Sed) {
          this.form.patchValue({ encryptionType: defaultEncryptionType });
        }
      });
  }

  private initEncryptionField(): void {
    this.form.controls.encryptionType.valueChanges.pipe(untilDestroyed(this)).subscribe((encryptionType) => {
      // Reset password fields when encryption type changes (don't emit events to avoid triggering validation display)
      this.form.controls.sedPassword.reset('', { emitEvent: false });
      this.form.controls.sedPasswordConfirm.reset('', { emitEvent: false });
      this.form.controls.sedPassword.markAsUntouched();
      this.form.controls.sedPasswordConfirm.markAsUntouched();

      // Update password field validators based on encryption type
      if (encryptionType === EncryptionType.Sed) {
        // Only require password if global SED password is not already set
        this.isSedPasswordSet$.pipe(take(1)).subscribe((isPasswordSet) => {
          if (isPasswordSet) {
            // Password is optional when one already exists
            this.form.controls.sedPassword.clearValidators();
            this.form.controls.sedPasswordConfirm.clearValidators();
          } else {
            // Password is required when none exists
            this.form.controls.sedPassword.setValidators([Validators.required]);
            this.form.controls.sedPasswordConfirm.setValidators([Validators.required]);
          }
          // Update validity without emitting events to prevent immediate error display
          this.form.controls.sedPassword.updateValueAndValidity({ emitEvent: false });
          this.form.controls.sedPasswordConfirm.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        this.form.controls.sedPassword.clearValidators();
        this.form.controls.sedPasswordConfirm.clearValidators();
        this.form.controls.sedPassword.updateValueAndValidity({ emitEvent: false });
        this.form.controls.sedPasswordConfirm.updateValueAndValidity({ emitEvent: false });
      }

      // Show warning dialogs for encryption types
      if (encryptionType === EncryptionType.Software) {
        this.showSoftwareEncryptionWarning();
      }
    });
  }

  private showSoftwareEncryptionWarning(): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Warning'),
        message: this.translate.instant(helptextPoolCreation.encryptionMessage),
        buttonText: this.translate.instant('I Understand'),
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) {
          this.form.controls.encryptionType.setValue(EncryptionType.None);
        }
        this.cdr.markForCheck();
      });
  }

  private connectGeneralOptionsToStore(): void {
    combineLatest([
      this.form.controls.name.statusChanges.pipe(startWith(this.form.controls.name.status)),
      this.form.controls.name.valueChanges.pipe(startWith('')),
      this.form.controls.encryptionType.valueChanges.pipe(startWith(EncryptionType.None)),
      this.form.controls.encryptionStandard.valueChanges.pipe(startWith(defaultEncryptionStandard)),
      this.form.controls.sedPassword.valueChanges.pipe(startWith('')),
    ]).pipe(untilDestroyed(this)).subscribe(([, name, encryptionType, encryptionStandard, sedPassword]) => {
      this.store.setGeneralOptions({
        name,
        nameErrors: this.form.controls.name.errors,
        encryption: encryptionType === EncryptionType.Software ? encryptionStandard : null,
      });

      this.store.setEncryptionOptions({
        encryptionType,
        encryption: encryptionType === EncryptionType.Software ? encryptionStandard : null,
        sedPassword: encryptionType === EncryptionType.Sed ? sedPassword : null,
      });
    });
  }
}
