import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { tooltips } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Omit } from 'utility-types';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TruenasConnectUpdate } from 'app/interfaces/truenas-connect-config.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogActions,
    MatDialogContent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    IxIconComponent,
    IxInputComponent,
    MatButton,
    ReactiveFormsModule,
    TranslateModule,
    TestDirective,
  ],
  templateUrl: './truenas-connect-modal.component.html',
  styleUrl: './truenas-connect-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectModalComponent {
  readonly helptext = helptextTopbar;
  readonly TruenasConnectStatus = TruenasConnectStatus;
  protected form = this.formBuilder.group({
    tnc_base_url: [this.tnc.config().tnc_base_url || '', [Validators.required]],
    account_service_base_url: [this.tnc.config().account_service_base_url || '', [Validators.required]],
    leca_service_base_url: [this.tnc.config().leca_service_base_url || '', [Validators.required]],
    heartbeat_url: [this.tnc.config().heartbeat_url, Validators.required],
  });

  private formChanges = toSignal(this.form.valueChanges);
  hasChange = computed(() => {
    const initialValue = this.tnc.config();
    const formValue = this.formChanges();
    return Object.keys(formValue).some((key: keyof typeof formValue) => formValue[key] !== (initialValue)[key]);
  });

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<TruenasConnectModalComponent>,
    protected tnc: TruenasConnectService,
  ) {
    effect(() => {
      if (this.tnc.config()?.status === TruenasConnectStatus.Disabled) {
        this.form.enable();
      } else {
        this.form.disable();
      }
    });
  }

  protected save(): void {
    const formValue = this.form.getRawValue();
    const payload = {
      tnc_base_url: formValue.tnc_base_url,
      account_service_base_url: formValue.account_service_base_url,
      leca_service_base_url: formValue.leca_service_base_url,
      heartbeat_url: formValue.heartbeat_url,
    };
    this.enableService(payload);
  }

  protected enableService(data?: Omit<TruenasConnectUpdate, 'enabled' | 'ips'>): void {
    this.tnc.enableService(data as TruenasConnectUpdate)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected disableService(): void {
    this.tnc.disableService()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected connect(): void {
    this.tnc.connect()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected readonly tooltips = tooltips;
}
