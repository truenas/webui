import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnChanges, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnFormFieldComponent, TnInputComponent, TnRadioComponent, TnRadioGroupComponent,
  TnStepperNextDirective,
} from '@truenas/ui-components';
import {
  combineLatest, map, Observable,
} from 'rxjs';
import { startWith, take } from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { translated } from 'app/helpers/translated.helper';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Option } from 'app/interfaces/option.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { EntitlementsService } from 'app/services/entitlements.service';

@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnRadioComponent,
    TnRadioGroupComponent,
    PoolWarningsComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperNextDirective,
    TranslateModule,
    WarningComponent,
  ],
})
export class GeneralWizardStepComponent implements OnInit, OnChanges {
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private store = inject(PoolManagerStore);
  private cdr = inject(ChangeDetectorRef);
  private poolWizardNameValidationService = inject(PoolWizardNameValidationService);
  private destroyRef = inject(DestroyRef);

  readonly isAddingVdevs = input(false);
  readonly pool = input<Pool | undefined>(undefined);

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    encryptionType: [EncryptionType.None],
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
  protected readonly InputType = InputType;
  protected readonly helptext = helptextPoolCreation;

  isLoading$ = this.store.isLoading$;
  poolNames$ = this.api.call('pool.query', [[], { select: ['name'], order_by: ['name'] }]).pipe(
    map((pools) => pools.map((pool) => pool.name)),
  );

  private readonly oldNameForbiddenValidator = forbiddenAsyncValues(this.poolNames$);

  hasSedCapableDisks$ = this.store.hasSedCapableDisks$;
  hasSedEntitlement$ = this.entitlements.entitled$(EntitlementFeature.Sed);
  isSedPasswordSet$ = this.api.call('system.advanced.sed_global_password_is_set');

  private readonly hasSedCapableDisks = toSignal(this.hasSedCapableDisks$, { initialValue: false });
  private readonly hasSedEntitlement = toSignal(this.hasSedEntitlement$, { initialValue: false });

  // `translated`, not a plain `computed`: the labels are composed with `instant()` in
  // TypeScript rather than piped in the template, so they would otherwise freeze at whatever was
  // loaded the first time this ran — including the raw keys, if the bundle had not been merged yet.
  protected readonly encryptionTypeOptions = translated<Option<EncryptionType>[]>((translate) => {
    const options: Option<EncryptionType>[] = [
      { label: translate.instant(helptextPoolCreation.encryptionTypeNone), value: EncryptionType.None },
      { label: translate.instant(helptextPoolCreation.encryptionTypeSoftware), value: EncryptionType.Software },
    ];

    if (this.hasSedCapableDisks() && this.hasSedEntitlement()) {
      options.push({
        label: translate.instant(helptextPoolCreation.encryptionTypeSed),
        value: EncryptionType.Sed,
      });
    }

    return options;
  });

  ngOnChanges(): void {
    if (this.isAddingVdevs()) {
      this.form.controls.encryptionType.disable();
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

    this.store.startOver$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetForm();
    });
  }

  /**
   * Returns an observable that emits the default encryption type based on
   * available SED-capable disks and the SED entitlement.
   */
  private getDefaultEncryptionType$(): Observable<EncryptionType> {
    return combineLatest([this.hasSedCapableDisks$, this.hasSedEntitlement$]).pipe(
      take(1),
      map(([hasSedDisks, hasSedEntitlement]) => {
        return (hasSedDisks && hasSedEntitlement) ? EncryptionType.Sed : EncryptionType.None;
      }),
    );
  }

  private resetForm(): void {
    this.getDefaultEncryptionType$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((defaultEncryptionType) => {
        // When adding VDEVs to existing pool, preserve the pool name (it's read-only)
        // When creating new pool, clear the name field (undefined allows form.reset to clear it)
        const poolName = this.isAddingVdevs() ? this.pool()?.name || '' : undefined;

        this.form.reset({
          name: poolName,
          encryptionType: defaultEncryptionType,
        });
      });
  }

  private initSedDefaults(): void {
    // Set SED as default if SED-capable disks detected and Enterprise license
    if (this.isAddingVdevs()) {
      return;
    }

    this.getDefaultEncryptionType$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((defaultEncryptionType) => {
        if (defaultEncryptionType === EncryptionType.Sed) {
          this.form.patchValue({ encryptionType: defaultEncryptionType });
        }
      });
  }

  private initEncryptionField(): void {
    this.form.controls.encryptionType.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((encryptionType) => {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      this.form.controls.sedPassword.valueChanges.pipe(startWith('')),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([, name, encryptionType, sedPassword]) => {
      this.store.setGeneralOptions({
        name,
        nameErrors: this.form.controls.name.errors,
      });

      this.store.setEncryptionOptions({
        encryptionType,
        sedPassword: encryptionType === EncryptionType.Sed ? sedPassword : null,
      });
    });
  }
}
