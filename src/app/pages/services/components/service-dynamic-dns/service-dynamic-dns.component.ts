import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-dynamic-dns';
import { numberValidator } from 'app/modules/entity/entity-form/validators/number-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

const customProvider = 'custom';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  templateUrl: './service-dynamic-dns.component.html',
  styleUrls: ['./service-dynamic-dns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDynamicDnsComponent implements OnInit {
  isFormLoading = false;
  subscriptions: Subscription[] = [];

  form = this.fb.group({
    provider: [null as string],
    checkip_ssl: [false],
    checkip_server: [''],
    checkip_path: [''],
    ssl: [false],
    custom_ddns_server: [''],
    custom_ddns_path: [''],
    domain: [[] as string[], [Validators.required]],
    period: [null as number, numberValidator()],
    username: ['', [Validators.required]],
    password: [''],
  });

  readonly tooltips = {
    provider: helptext.provider_tooltip,
    checkip_ssl: helptext.checkip_ssl_tooltip,
    checkip_server: helptext.checkip_server_tooltip,
    checkip_path: helptext.checkip_path_tooltip,
    ssl: helptext.ssl_tooltip,
    custom_ddns_server: helptext.custom_ddns_server_tooltip,
    custom_ddns_path: helptext.custom_ddns_path_tooltip,
    domain: helptext.domain_tooltip,
    period: helptext.period_tooltip,
    username: helptext.username_tooltip,
    password: helptext.password_tooltip,
  };

  readonly providerOptions$ = this.ws.call('dyndns.provider_choices').pipe(
    choicesToOptions(),
    map((options) => [
      ...options,
      { label: this.translate.instant('Custom Provider'), value: customProvider },
    ]),
  );
  readonly isCustomProvider$ = this.form.select((values) => values.provider === customProvider);

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('dyndns.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.isFormLoading = false;
          this.form.patchValue(config);
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.push(
      this.form.controls['custom_ddns_server'].enabledWhile(this.isCustomProvider$),
      this.form.controls['custom_ddns_path'].enabledWhile(this.isCustomProvider$),
    );
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('dyndns.update', [values]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }
}
