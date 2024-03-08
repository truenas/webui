import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Observable, of, switchMap, tap,
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { helptextSystemGeneral } from 'app/helptext/system/general';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { ipv4or6OptionalCidrValidator } from 'app/modules/ix-forms/validators/ip-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
  protected requiredRoles = [Role.FullAdmin];
  protected readonly helpText = helptextSystemAdvanced;

  isFormLoading = true;
  form = this.fb.group({
    addresses: this.fb.array<string>([]),
  });

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private slideInRef: ChainedRef<unknown>,
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
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }

  addAddress(): void {
    this.form.controls.addresses.push(
      this.fb.control('', [Validators.required, ipv4or6OptionalCidrValidator()]),
    );
  }

  removeAddress(index: number): void {
    this.form.controls.addresses.removeAt(index);
  }

  handleServiceRestart(): Observable<true> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptextSystemGeneral.dialog_confirm_title),
      message: this.translate.instant(helptextSystemGeneral.dialog_confirm_message),
    }).pipe(
      switchMap((shouldRestart): Observable<true> => {
        if (!shouldRestart) {
          return of(true);
        }
        return this.ws.call('system.general.ui_restart').pipe(
          catchError((error: WebSocketError) => {
            this.dialogService.error({
              title: helptextSystemGeneral.dialog_error_title,
              message: error.reason,
              backtrace: error.trace?.formatted,
            });
            return EMPTY;
          }),
          map(() => true),
        );
      }),
    );
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const addresses = this.form.value.addresses;

    this.ws.call('system.general.update', [{ ui_allowlist: addresses }]).pipe(
      tap(() => {
        this.store$.dispatch(generalConfigUpdated());
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.snackbar.success(this.translate.instant('Allowed addresses have been updated'));
      }),
      switchMap(() => this.handleServiceRestart()),
      tap(() => {
        this.slideInRef.close({ response: true, error: null });
      }),
      untilDestroyed(this),
    ).subscribe({
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
