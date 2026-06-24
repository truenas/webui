import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, ViewContainerRef, viewChild, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Validators, ReactiveFormsModule, FormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  finalize, Observable, of, startWith, Subscription,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { alertServiceNames, AlertServiceType } from 'app/enums/alert-service-type.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextAlertService } from 'app/helptext/system/alert-service';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AwsSnsServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/aws-sns-service/aws-sns-service.component';
import { BaseAlertServiceForm } from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';
import {
  EmailServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/email-service/email-service.component';
import {
  InfluxDbServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/influx-db-service/influx-db-service.component';
import {
  MattermostServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/mattermost-service/mattermost-service.component';
import {
  OpsGenieServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/ops-genie-service/ops-genie-service.component';
import {
  PagerDutyServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/pager-duty-service/pager-duty-service.component';
import {
  SlackServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/slack-service/slack-service.component';
import {
  SnmpTrapServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/snmp-trap-service/snmp-trap-service.component';
import {
  SplunkOnCallServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/splunk-on-call-service/splunk-on-call-service.component';
import {
  TelegramServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/telegram-service/telegram-service.component';

@Component({
  selector: 'ix-alert-service',
  templateUrl: './alert-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    IxFormComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AlertServiceComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  slideInRef = inject<SlideInRef<AlertService | undefined, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AlertWrite];

  commonForm = this.formBuilder.group({
    name: ['', Validators.required],
    enabled: [true],
    type: [AlertServiceType.AwsSns],
    level: [AlertLevel.Warning],
  });

  services$ = of(alertServiceNames);
  levels$ = of(alertLevelLabels).pipe(
    map((levels) => mapToOptions(levels, this.translate)),
  );

  // Drives the modal-header progress bar while a Send Test Alert call is in
  // flight. Submit's own loading state is handled by the wrapper internally.
  protected readonly testAlertLoading = signal(false);
  protected readonly existingAlertService = this.slideInRef.getData();

  // Mirrors the dynamic child form's `invalid` state into a signal so the
  // wrapper's OnPush `[extraDisabled]` binding (and the Send Test Alert
  // button's `[disabled]`) re-evaluate reactively. The child lives in a
  // ViewContainerRef, so its statusChanges don't flow through Angular's
  // input system to this host — without this mirror, a programmatic
  // setValidators/setValue on the child wouldn't tick CD on the host and
  // the gate would appear stuck.
  protected readonly childFormInvalid = signal(true);
  private childFormStatusSub?: Subscription;

  private readonly alertServiceContainer = viewChild.required('alertServiceContainer', { read: ViewContainerRef });

  readonly helptext = helptextAlertService;

  protected alertServiceForm: BaseAlertServiceForm;

  constructor() {
    this.setFormEvents();
  }

  get isNew(): boolean {
    return !this.existingAlertService;
  }

  get canSubmit(): boolean {
    return this.commonForm.valid && !this.childFormInvalid();
  }

  // True once the user has ever caused the child form to re-render by
  // changing `type`. The new child form starts pristine even though the
  // user has clearly edited the parent — we keep a sticky bit so that
  // post-rerender state is still counted as dirty.
  //
  // Intentionally never reset: even if the user flips back to the
  // original type, the act of swapping replaced the child form with a
  // fresh instance, so the original child's pristine/dirty bookkeeping
  // is gone. Treating that round-trip as "still dirty" is the safer
  // default — false positive on dirty-confirm vs. silently losing edits.
  private hadTypeChange = false;

  // Combined dirty: both the top-level commonForm and the dynamic
  // alertServiceForm child (rendered into a ViewContainerRef, so its dirty
  // state is invisible to commonForm). Also stays true once the user has
  // changed `type` at least once, since rerendering the child resets its
  // dirty flag while the parent's edit clearly hasn't been undone.
  //
  // `alertServiceForm` is set synchronously in `ngOnInit` via
  // `renderAlertServiceForm()`. The slide-in framework only invokes this
  // predicate when the user attempts to close, which is necessarily after
  // ngOnInit — so the optional chain here is defensive, not load-bearing.
  protected dirtyPredicate = (): Observable<boolean> => {
    return of(Boolean(
      this.commonForm.dirty || this.alertServiceForm?.form.dirty || this.hadTypeChange,
    ));
  };

  ngOnInit(): void {
    if (this.existingAlertService) {
      this.setAlertServiceForEdit(this.existingAlertService);
    } else {
      this.renderAlertServiceForm();
    }
  }

  private setAlertServiceForEdit(alertService: AlertService): void {
    // Patch silently: the `type.valueChanges` subscription (wired in the
    // constructor) sets the sticky `hadTypeChange` dirty flag and re-renders the
    // child form. Letting this edit-open patch fire it would mark the form dirty
    // before the user touched anything, prompting a bogus unsaved-changes
    // confirmation on close. Suppress the event and re-render the child here.
    this.commonForm.patchValue({
      ...alertService,
      type: alertService.attributes.type,
    }, { emitEvent: false });
    this.renderAlertServiceForm();

    setTimeout(() => {
      this.alertServiceForm.setValues(alertService.attributes);
    });
  }

  protected onSendTestAlert(): void {
    this.testAlertLoading.set(true);
    const payload = this.generatePayload();

    this.api.call('alertservice.test', [payload])
      .pipe(
        finalize(() => this.testAlertLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (wasAlertSent) => {
          if (wasAlertSent) {
            this.snackbar.success(this.translate.instant('Test alert sent'));
          } else {
            this.dialogService.warn(
              this.translate.instant('Failed'),
              this.translate.instant('Failed sending test alert!'),
            );
          }
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.commonForm);
        },
      });
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const payload = this.generatePayload();

    const request$ = this.existingAlertService
      ? this.api.call('alertservice.update', [this.existingAlertService.id, payload])
      : this.api.call('alertservice.create', [payload]);

    return {
      request$,
      successMessage: this.translate.instant('Alert service saved'),
    };
  };

  private generatePayload(): AlertServiceEdit {
    const { type, ...rest } = this.commonForm.value;

    return {
      ...rest,
      attributes: {
        type,
        ...this.alertServiceForm.getSubmitAttributes(),
      },
    };
  }

  private setFormEvents(): void {
    this.commonForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.hadTypeChange = true;
        this.renderAlertServiceForm();
      });
  }

  private renderAlertServiceForm(): void {
    this.alertServiceContainer()?.clear();

    const formClass = this.getAlertServiceClass();
    const formRef = this.alertServiceContainer().createComponent(formClass);
    this.alertServiceForm = formRef.instance;

    // Re-subscribe each render: the previous child's statusChanges belongs
    // to a destroyed FormGroup and would never emit again, but the explicit
    // unsubscribe keeps the subscription list bounded if `type` is flipped
    // many times in one session.
    this.childFormStatusSub?.unsubscribe();
    this.childFormStatusSub = this.alertServiceForm.form.statusChanges.pipe(
      startWith(this.alertServiceForm.form.status),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.childFormInvalid.set(this.alertServiceForm.form.invalid));
  }

  private getAlertServiceClass(): Type<BaseAlertServiceForm> {
    const formMapping = new Map<AlertServiceType, Type<BaseAlertServiceForm>>([
      [AlertServiceType.AwsSns, AwsSnsServiceComponent],
      [AlertServiceType.Mail, EmailServiceComponent],
      [AlertServiceType.InfluxDb, InfluxDbServiceComponent],
      [AlertServiceType.Mattermost, MattermostServiceComponent],
      [AlertServiceType.OpsGenie, OpsGenieServiceComponent],
      [AlertServiceType.PagerDuty, PagerDutyServiceComponent],
      [AlertServiceType.Slack, SlackServiceComponent],
      [AlertServiceType.SnmpTrap, SnmpTrapServiceComponent],
      [AlertServiceType.Telegram, TelegramServiceComponent],
      [AlertServiceType.SplunkOnCall, SplunkOnCallServiceComponent],
    ]);

    const serviceClass = formMapping.get(this.commonForm.controls.type.value);
    if (!serviceClass) {
      throw new Error(`Invalid alert service type: ${this.commonForm.controls.type.value}`);
    }

    return serviceClass;
  }
}
