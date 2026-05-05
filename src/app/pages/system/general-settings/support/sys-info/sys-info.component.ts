import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { Observable, of, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport } from 'app/helptext/system/support';
import { getLabelForContractType } from 'app/interfaces/system-info.interface';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  LicenseFingerprintDialog,
} from 'app/pages/system/general-settings/support/license-fingerprint-dialog/license-fingerprint-dialog.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-sys-info',
  templateUrl: './sys-info.component.html',
  styleUrls: ['../../common-settings-card.scss', './sys-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatIconButton,
    MatListModule,
    MatTooltip,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    RequiresRolesDirective,
    TestDirective,
    TnIconComponent,
    TranslateModule,
  ],
})
export class SysInfoComponent {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly hasLicense = input<boolean>();
  readonly licenseInfo = input<LicenseInfoInSupport>();
  readonly systemInfo = input.required<SystemInfoInSupport>();
  readonly productionControl = input<FormControl<boolean>>();
  readonly isProactiveSupportAvailable = input<boolean>(false);
  readonly isProactiveSupportEnabled = input<boolean>(false);

  readonly editContacts = output();

  protected readonly productionToggleRoles = [Role.FullAdmin];
  protected readonly manageProactiveRoles = [Role.SupportWrite];
  protected readonly getLabelForContractType = getLabelForContractType;
  protected readonly helptext = helptextSystemSupport;

  protected readonly isFingerprintBusy = signal(false);
  private fingerprintRaw: string | null = null;

  protected openFingerprintDialog(): void {
    this.matDialog.open(LicenseFingerprintDialog, { autoFocus: false });
  }

  protected copyFingerprint(): void {
    this.loadFingerprint().subscribe({
      next: (raw) => {
        navigator.clipboard.writeText(raw).then(
          () => this.snackbar.success(this.translate.instant('Copied to clipboard')),
          () => this.snackbar.error(this.translate.instant('Failed to copy to clipboard')),
        );
      },
    });
  }

  private loadFingerprint(): Observable<string> {
    if (this.fingerprintRaw) {
      return of(this.fingerprintRaw);
    }
    this.isFingerprintBusy.set(true);
    return this.api.call('truenas.license.fingerprint').pipe(
      tap({
        next: (value) => {
          this.fingerprintRaw = value;
          this.isFingerprintBusy.set(false);
        },
        error: () => this.isFingerprintBusy.set(false),
      }),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    );
  }
}
