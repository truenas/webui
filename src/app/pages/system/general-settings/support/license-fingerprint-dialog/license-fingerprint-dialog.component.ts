import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { LicenseFingerprint } from 'app/interfaces/system-info.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-license-fingerprint-dialog',
  templateUrl: './license-fingerprint-dialog.component.html',
  styleUrls: ['./license-fingerprint-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatIconButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatProgressSpinner,
    MatTooltip,
    TestDirective,
    TnIconComponent,
    TranslateModule,
  ],
})
export class LicenseFingerprintDialog implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly fingerprintRaw = signal<string | null>(null);

  protected readonly fingerprintDecoded = computed(() => {
    const raw = this.fingerprintRaw();
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(atob(raw)) as LicenseFingerprint;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  });

  ngOnInit(): void {
    this.api.call('truenas.license.fingerprint').pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (value) => {
        this.fingerprintRaw.set(value);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected copyToClipboard(): void {
    const raw = this.fingerprintRaw();
    if (!raw) {
      return;
    }
    navigator.clipboard.writeText(raw).then(
      () => this.snackbar.success(this.translate.instant('Copied to clipboard')),
      () => this.snackbar.error(this.translate.instant('Failed to copy to clipboard')),
    );
  }
}
