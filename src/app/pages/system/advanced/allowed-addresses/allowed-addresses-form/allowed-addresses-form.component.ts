import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, of, switchMap, tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { helptextSystemGeneral } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { ipv4or6OptionalCidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  selector: 'ix-allowed-addresses-form',
  templateUrl: 'allowed-addresses-form.component.html',
  styleUrls: ['./allowed-addresses-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxListComponent,
    IxListItemComponent,
    IxInputComponent,
    WarningComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxFieldsetComponent,
  ],
})
export class AllowedAddressesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly helptext = helptextSystemAdvanced;

  protected isFormLoading = signal(true);
  protected initiallyHadNoAddresses = signal(false);

  protected form = this.fb.nonNullable.group({
    addresses: this.fb.nonNullable.array<string>([]),
  });

  protected isLockoutWarningShown = signal(false);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.api.call('system.general.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.initiallyHadNoAddresses.set(config.ui_allowlist.length === 0);
        config.ui_allowlist.forEach(() => {
          this.addAddress();
        });
        this.form.controls.addresses.patchValue(config.ui_allowlist);
        this.isFormLoading.set(false);

        this.warnWhenAddressesAreAdded();
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private warnWhenAddressesAreAdded(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLockoutWarningShown.set(this.initiallyHadNoAddresses() && Boolean(this.form.value.addresses.length));
    });
  }

  addAddress(): void {
    this.form.controls.addresses.push(
      this.fb.nonNullable.control('', [Validators.required, ipv4or6OptionalCidrValidator()]),
    );
  }

  removeAddress(index: number): void {
    this.form.controls.addresses.removeAt(index);
  }

  handleServiceRestart(): Observable<true> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptextSystemGeneral.restartTitle),
      message: this.translate.instant(helptextSystemGeneral.restartMessage),
    }).pipe(
      switchMap((shouldRestart): Observable<true> => {
        if (!shouldRestart) {
          return of(true);
        }
        return this.api.call('system.general.ui_restart').pipe(
          this.errorHandler.withErrorHandler(),
          map(() => true),
        );
      }),
    );
  }

  onSubmit(): void {
    if (!this.form.dirty) {
      this.slideInRef.close({ response: false });
      return;
    }

    this.isFormLoading.set(true);
    const addresses = this.form.getRawValue().addresses;

    this.api.call('system.general.update', [{ ui_allowlist: addresses }]).pipe(
      tap(() => {
        this.store$.dispatch(generalConfigUpdated());
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Allowed addresses have been updated'));
      }),
      switchMap(() => this.handleServiceRestart()),
      tap(() => {
        this.slideInRef.close({ response: true });
      }),
      untilDestroyed(this),
    ).subscribe({
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
