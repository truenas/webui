import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of, Subscription, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-console-form',
  templateUrl: './console-form.component.html',
  styleUrls: ['./console-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ConsoleFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected isFormLoading = signal(false);

  form = this.fb.group({
    consolemenu: [true],
    serialconsole: [true],
    serialport: [''],
    serialspeed: [''],
    motd: [''],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  private subscriptions: Subscription[] = [];

  readonly tooltips = {
    consolemenu: helptext.consoleMenuTooltip,
    serialconsole: helptext.serialConsoleTooltip,
    serialport: helptext.serialPortTooltip,
    serialspeed: helptext.serialSpeedTooltip,
    motd: helptext.motdTooltip,
  };

  readonly serialSpeedOptions$ = of([
    { label: '9600', value: '9600' },
    { label: '19200', value: '19200' },
    { label: '38400', value: '38400' },
    { label: '57600', value: '57600' },
    { label: '115200', value: '115200' },
  ]);

  readonly serialPortOptions$ = this.api.call('system.advanced.serial_port_choices').pipe(choicesToOptions());

  ngOnInit(): void {
    this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.form.patchValue({
        consolemenu: config.consolemenu,
        serialconsole: config.serialconsole,
        serialport: config.serialport,
        serialspeed: config.serialspeed,
        motd: config.motd,
      });
    });

    this.subscriptions.push(
      this.form.controls.serialport.enabledWhile(this.form.controls.serialconsole.value$),
      this.form.controls.serialspeed.enabledWhile(this.form.controls.serialconsole.value$),
    );
    this.destroyRef.onDestroy(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
    });
  }

  protected onSubmit(): void {
    this.isFormLoading.set(true);
    const values = this.form.value;

    this.api.call('system.advanced.update', [values]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
