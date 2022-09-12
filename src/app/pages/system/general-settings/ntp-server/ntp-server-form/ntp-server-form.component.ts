import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { helptextSystemNtpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ValidationService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './ntp-server-form.component.html',
  styleUrls: ['./ntp-server-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerFormComponent {
  isFormLoading = false;

  formGroup = this.fb.group({
    address: [''],
    burst: [false],
    iburst: [true],
    prefer: [false],
    minpoll: [6, [Validators.required, Validators.min(4)]],
    maxpoll: [10, [Validators.required, Validators.max(17), this.validationService.greaterThan('minpoll', [helptext.minpoll.label])]],
    force: [false],
  });

  readonly helptext = helptext;
  private editingServer: NtpServer;
  get isNew(): boolean {
    return !this.editingServer;
  }
  get title(): string {
    return this.isNew ? this.translate.instant('Add NTP Server') : this.translate.instant('Edit NTP Server');
  }

  constructor(
    private slideInService: IxSlideInService,
    private validationService: ValidationService,
    private fb: UntypedFormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  /**
   * @param server Skip argument to add new server.
   */
  setupForm(server?: NtpServer): void {
    this.editingServer = server;
    if (!this.isNew) {
      this.formGroup.patchValue({
        address: server.address,
        burst: server.burst,
        iburst: server.iburst,
        prefer: server.prefer,
        minpoll: server.minpoll,
        maxpoll: server.maxpoll,
      });
    }
  }

  onSubmit(): void {
    const values = this.formGroup.value;
    const body: CreateNtpServer = {
      address: values.address,
      burst: values.burst,
      iburst: values.iburst,
      prefer: values.prefer,
      minpoll: values.minpoll,
      maxpoll: values.maxpoll,
      force: values.force,
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('system.ntpserver.create', [body]);
    } else {
      request$ = this.ws.call('system.ntpserver.update', [this.editingServer.id, body]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.formGroup);
      },
    });
  }
}
