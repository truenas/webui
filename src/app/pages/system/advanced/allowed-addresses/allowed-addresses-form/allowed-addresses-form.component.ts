import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, filter, switchMap, tap,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { helptextSystemGeneral } from 'app/helptext/system/general';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'allowed-addresses-form.component.html',
  styleUrls: ['./allowed-addresses-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedAddressesFormComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    addresses: this.fb.array<string>([]),
  });

  constructor(
    private fb: FormBuilder,
    private slideInRef: IxSlideInRef<AllowedAddressesFormComponent>,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  ngOnInit(): void {
    this.ws.call('system.general.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        config.ui_allowlist.forEach(() => {
          this.addAddress();
        });
        this.form.controls.addresses.patchValue(config.ui_allowlist);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }

  addAddress(): void {
    this.form.controls.addresses.push(
      this.fb.control('', [
        this.validatorsService.withMessage(ipv4Validator(), this.translate.instant('Enter a valid IPv4 address.')),
        Validators.required,
      ]),
    );
  }

  removeAddress(index: number): void {
    this.form.controls.addresses.removeAt(index);
  }

  handleServiceRestart(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextSystemGeneral.dialog_confirm_title),
      message: this.translate.instant(helptextSystemGeneral.dialog_confirm_message),
    }).pipe(
      tap(() => this.slideInRef.close()),
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('system.general.ui_restart').pipe(
          catchError((error: WebsocketError) => {
            this.dialogService.error({
              title: helptextSystemGeneral.dialog_error_title,
              message: error.reason,
              backtrace: error.trace.formatted,
            });
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const addresses = this.form.value.addresses;
    this.ws.call('system.general.update', [{ ui_allowlist: addresses }]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Allowed addresses have been updated'));
        this.cdr.markForCheck();
        this.handleServiceRestart();
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
