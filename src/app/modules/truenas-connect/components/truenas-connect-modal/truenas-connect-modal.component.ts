import {
  ChangeDetectionStrategy, Component, computed, effect, Inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-truenas-connect-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    IxIconComponent,
    IxInputComponent,
    MatButton,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './truenas-connect-modal.component.html',
  styleUrl: './truenas-connect-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectModalComponent {
  readonly helptext = helptextTopbar;
  readonly TruenasConnectStatus = TruenasConnectStatus;
  protected readonly requiredRoles = [Role.TrueCommandWrite];
  protected form = this.formBuilder.group({
    tnc_base_url: [this.tnc.config().tnc_base_url, [Validators.required]],
    account_service_base_url: [this.tnc.config().account_service_base_url, [Validators.required]],
    leca_service_base_url: [this.tnc.config().leca_service_base_url, [Validators.required]],
  });

  private formChanges = toSignal(this.form.valueChanges);
  hasChange = computed(() => {
    const initialValue = this.tnc.config();
    const formValue = this.formChanges();
    return Object.keys(formValue).some((key: keyof typeof formValue) => formValue[key] !== (initialValue)[key]);
  });

  protected readonly tooltips = {
    account_service_base_url: T('Account Service Base Url'),
    leca_service_base_url: T('Leca Service Base Url'),
    tnc_base_url: T('TNC Base Url'),
  };

  constructor(
    @Inject(WINDOW) private window: Window,
    private api: ApiService,
    private loader: AppLoaderService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<TruenasConnectModalComponent>,
    public tnc: TruenasConnectService,
  ) {
    effect(() => {
      const config = this.tnc.config();
      if (config.status === TruenasConnectStatus.Disabled) {
        this.form.enable();
      } else {
        this.form.disable();
      }
    });
  }

  save(): void {
    const formValue = this.form.getRawValue();
    this.api.call('tn_connect.update', [{
      ips: this.tnc.config().ips,
      enabled: true,
      tnc_base_url: formValue.tnc_base_url,
      account_service_base_url: formValue.account_service_base_url,
      leca_service_base_url: formValue.leca_service_base_url,
    }])
      .pipe(
        filter((config) => {
          return config.status === TruenasConnectStatus.ClaimTokenMissing;
        }),
        switchMap(() => {
          return this.api.call('tn_connect.generate_claim_token');
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  stop(): void {
    const config = this.tnc.config();
    this.api.call('tn_connect.update', [{
      ips: config.ips,
      enabled: false,
      tnc_base_url: config.tnc_base_url,
      account_service_base_url: config.account_service_base_url,
      leca_service_base_url: config.leca_service_base_url,
    }])
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  start(): void {
    const config = this.tnc.config();
    this.api.call('tn_connect.update', [{
      ips: config.ips,
      enabled: true,
      tnc_base_url: config.tnc_base_url,
      account_service_base_url: config.account_service_base_url,
      leca_service_base_url: config.leca_service_base_url,
    }])
      .pipe(
        filter((configRes) => {
          return configRes.status === TruenasConnectStatus.ClaimTokenMissing;
        }),
        switchMap(() => {
          return this.api.call('tn_connect.generate_claim_token');
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  generateToken(): void {
    this.api.call('tn_connect.generate_claim_token')
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  connect(): void {
    this.api.call('tn_connect.get_registration_uri')
      .pipe(untilDestroyed(this))
      .subscribe((url) => {
        this.window.open(url);
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
