import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-console-form',
  templateUrl: './console-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ConsoleFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

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

  private consoleConfig: ConsoleConfig;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private chainedRef: ChainedRef<ConsoleConfig>,
  ) {
    this.consoleConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    this.form.patchValue({
      consolemenu: this.consoleConfig.consolemenu,
      serialconsole: this.consoleConfig.serialconsole,
      serialport: this.consoleConfig.serialport,
      serialspeed: this.consoleConfig.serialspeed,
      motd: this.consoleConfig.motd,
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
        this.chainedRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
