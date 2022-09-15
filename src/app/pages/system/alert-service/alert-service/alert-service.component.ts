import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertLevel, alertLevelLabels } from 'app/enums/alert-level.enum';
import { alertServiceNames, AlertServiceType } from 'app/enums/alert-service-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/system/alert-service';
import { AlertService, AlertServiceEdit } from 'app/interfaces/alert-service.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './alert-service.component.html',
  styleUrls: ['./alert-service.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertServiceComponent implements OnInit {
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
  existingAlertService: AlertService;

  @ViewChild('alertServiceContainer', { static: true, read: ViewContainerRef }) alertServiceContainer: ViewContainerRef;

  readonly helptext = helptext;

  private alertServiceForm: BaseAlertServiceForm;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
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
  }

  setAlertServiceForEdit(alertService: AlertService): void {
    this.existingAlertService = alertService;
    this.commonForm.patchValue(alertService);

    setTimeout(() => {
      this.alertServiceForm.setValues(alertService.attributes);
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
        error: (error) => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.errorHandler.handleWsFormError(error, this.commonForm);
        },
      });
  }

  onSubmit(): void {
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
          this.slideInService.close();
        },
        error: (error) => {
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
