import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, Inject, OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  FormBuilder, Validators, ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { alertServiceNames, AlertServiceType } from 'app/enums/alert-service-type.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextAlertService } from 'app/helptext/system/alert-service';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
  TelegramServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/telegram-service/telegram-service.component';
import {
  VictorOpsServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/victor-ops-service/victor-ops-service.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-service',
  templateUrl: './alert-service.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    FormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class AlertServiceComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

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

  isLoading = false;

  @ViewChild('alertServiceContainer', { static: true, read: ViewContainerRef }) alertServiceContainer: ViewContainerRef;

  readonly helptext = helptextAlertService;

  private alertServiceForm: BaseAlertServiceForm;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private slideInRef: SlideInRef<AlertService>,
    @Inject(SLIDE_IN_DATA) private existingAlertService: AlertService,
  ) {
    this.setFormEvents();
  }

  get isNew(): boolean {
    return !this.existingAlertService;
  }

  get canSubmit(): boolean {
    return this.commonForm.valid && this.alertServiceForm.form.valid;
  }

  ngOnInit(): void {
    this.renderAlertServiceForm();

    if (this.existingAlertService) {
      this.setAlertServiceForEdit();
    }
  }

  setAlertServiceForEdit(): void {
    this.commonForm.patchValue(this.existingAlertService);

    setTimeout(() => {
      this.alertServiceForm.setValues(this.existingAlertService.attributes);
    });
  }

  onSendTestAlert(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    const payload = this.generatePayload();

    this.ws.call('alertservice.test', [payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (wasAlertSent) => {
          this.isLoading = false;
          this.cdr.detectChanges();
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
          this.isLoading = false;
          this.cdr.detectChanges();
          this.errorHandler.handleWsFormError(error, this.commonForm);
        },
      });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.cdr.detectChanges();

    const payload = this.generatePayload();

    const request$ = this.isNew
      ? this.ws.call('alertservice.create', [payload])
      : this.ws.call('alertservice.update', [this.existingAlertService.id, payload]);

    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.snackbar.success(this.translate.instant('Alert service saved'));
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.errorHandler.handleWsFormError(error, this.commonForm);
        },
      });
  }

  private generatePayload(): AlertServiceEdit {
    return {
      ...this.commonForm.value,
      attributes: this.alertServiceForm.getSubmitAttributes(),
    };
  }

  private setFormEvents(): void {
    this.commonForm.controls.type.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.renderAlertServiceForm();
      });
  }

  private renderAlertServiceForm(): void {
    this.alertServiceContainer?.clear();

    const formClass = this.getAlertServiceClass();
    const formRef = this.alertServiceContainer.createComponent(formClass);
    this.alertServiceForm = formRef.instance;
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
      [AlertServiceType.VictorOps, VictorOpsServiceComponent],
    ]);

    return formMapping.get(this.commonForm.controls.type.value);
  }
}
