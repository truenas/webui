import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormListComponent, TnFormListItemComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { defaultIfEmpty, of, switchMap, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { ipv4or6OptionalCidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

@Component({
  selector: 'ix-allowed-addresses-form',
  templateUrl: 'allowed-addresses-form.component.html',
  styleUrls: ['./allowed-addresses-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormListComponent,
    TnFormListItemComponent,
    TnFormFieldComponent,
    TnInputComponent,
    WarningComponent,
    TranslateModule,
  ],
})
export class AllowedAddressesFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private systemGeneralService = inject(SystemGeneralService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly helptext = helptextSystemAdvanced;

  protected initiallyHadNoAddresses = signal(false);
  protected isLockoutWarningShown = signal(false);

  form = this.fb.nonNullable.group({
    addresses: this.fb.nonNullable.array<string>([]),
  });

  constructor() {
    super();
    // Wired once here rather than inside `loadFormConfig`'s patch: a retry replays the patch, and
    // wiring there would register this subscription a second time.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isLockoutWarningShown.set(this.initiallyHadNoAddresses() && Boolean(this.form.value.addresses.length));
    });
  }

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('system.general.config'), (config) => {
      this.initiallyHadNoAddresses.set(config.ui_allowlist.length === 0);
      // `loadFormConfig` replays this patch on retry, so clear before pushing — otherwise every
      // address comes back duplicated.
      this.form.controls.addresses.clear();
      config.ui_allowlist.forEach(() => this.addAddress());
      this.form.controls.addresses.patchValue(config.ui_allowlist);
    });
  }

  protected addAddress(): void {
    this.form.controls.addresses.push(
      this.fb.nonNullable.control('', [Validators.required, ipv4or6OptionalCidrValidator()]),
    );
  }

  protected removeAddress(index: number): void {
    this.form.controls.addresses.removeAt(index);
  }

  protected handleSubmit = (): SubmitResult => {
    // Saving an unchanged allowlist would still prompt for a UI service restart, so a pristine
    // form closes as a cancel instead — `false` is what `FormSidePanelService` reads as one.
    const isDirty = this.form.dirty;
    const addresses = this.form.getRawValue().addresses;

    return {
      request$: isDirty
        ? this.api.call('system.general.update', [{ ui_allowlist: addresses }]).pipe(
            tap(() => this.store$.dispatch(generalConfigUpdated())),
            switchMap(() => this.systemGeneralService.handleUiServiceRestart()),
            // `handleUiServiceRestart` reports a failed `system.general.ui_restart` itself and
            // catches into EMPTY, which would complete this chain without emitting — no success
            // message and, worse, no close, leaving the panel open over an allowlist that WAS
            // saved. The restart is a follow-up action, not part of the save.
            defaultIfEmpty(true),
          )
        : of(undefined),
      successMessage: () => (isDirty ? this.translate.instant('Allowed addresses have been updated') : null),
      closeWith: () => isDirty,
    };
  };
}
