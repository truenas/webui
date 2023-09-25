import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  templateUrl: './console-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleFormComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    consolemenu: [true],
    serialconsole: [true],
    serialport: [''],
    serialspeed: [''],
    motd: [''],
  });

  subscriptions: Subscription[] = [];

  readonly tooltips = {
    consolemenu: helptext.consolemenu_tooltip,
    serialconsole: helptext.serialconsole_tooltip,
    serialport: helptext.serialport_tooltip,
    serialspeed: helptext.serialspeed_tooltip,
    motd: helptext.motd_tooltip,
  };

  readonly serialSpeedOptions$ = of([
    { label: '9600', value: '9600' },
    { label: '19200', value: '19200' },
    { label: '38400', value: '38400' },
    { label: '57600', value: '57600' },
    { label: '115200', value: '115200' },
  ]);

  readonly serialPortOptions$ = this.ws.call('system.advanced.serial_port_choices').pipe(choicesToOptions());

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<ConsoleFormComponent>,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.store$.pipe(
      waitForAdvancedConfig,
      untilDestroyed(this),
    )
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.push(
      this.form.controls.serialport.enabledWhile(this.form.controls.serialconsole.value$),
      this.form.controls.serialspeed.enabledWhile(this.form.controls.serialconsole.value$),
    );
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;

    this.ws.call('system.advanced.update', [values]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.cdr.markForCheck();
        this.slideInRef.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
