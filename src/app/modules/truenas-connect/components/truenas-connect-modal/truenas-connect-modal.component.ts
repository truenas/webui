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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
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
    private loader: AppLoaderService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<TruenasConnectModalComponent>,
    public tnc: TruenasConnectService,
  ) {
    effect(() => {
      if (this.tnc.config().status === TruenasConnectStatus.Disabled) {
        this.form.enable();
      } else {
        this.form.disable();
      }
    });
  }

  protected save(): void {
    const formValue = this.form.getRawValue();
    const payload = {
      ips: this.tnc.config().ips,
      enabled: true,
      tnc_base_url: formValue.tnc_base_url,
      account_service_base_url: formValue.account_service_base_url,
      leca_service_base_url: formValue.leca_service_base_url,
    };
    this.loader.open();
    this.tnc.enableService(payload)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
      });
  }

  protected enableService(): void {
    const config = this.tnc.config();
    const payload = {
      ips: config.ips,
      enabled: true,
      tnc_base_url: config.tnc_base_url,
      account_service_base_url: config.account_service_base_url,
      leca_service_base_url: config.leca_service_base_url,
    };
    this.loader.open();
    this.tnc.enableService(payload)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
      });
  }

  protected disableService(): void {
    this.loader.open();
    this.tnc.disableService()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
      });
  }

  protected generateToken(): void {
    this.loader.open();
    this.tnc.generateToken()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
      });
  }

  protected connect(): void {
    this.loader.open();
    this.tnc.connect()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loader.close();
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
