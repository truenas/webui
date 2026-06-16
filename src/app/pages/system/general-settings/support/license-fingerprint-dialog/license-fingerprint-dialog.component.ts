import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnIconButtonComponent, TnSpinnerComponent,
} from '@truenas/ui-components';
import { LicenseFingerprintValue } from 'app/interfaces/system-info.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface FingerprintField {
  key: string;
  label: string;
  values: string[];
}

type FingerprintPrimitive = string | number | boolean | null;

const emptyPlaceholder = '—';

function isFingerprintPrimitive(value: unknown): value is FingerprintPrimitive {
  return value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean';
}

function isFingerprintValue(value: unknown): value is LicenseFingerprintValue {
  if (isFingerprintPrimitive(value)) {
    return true;
  }
  return Array.isArray(value) && value.every(isFingerprintPrimitive);
}

// Translatable labels for known middleware-supplied fingerprint keys. Unknown
// keys fall through to a generic snake_case → Title Case formatter so the UI
// still renders something when middleware adds new fields. Fallback labels are
// passed through `| translate` unchanged (since they don't exist as translation
// keys) — that's intentional, not a bug.
export const fingerprintLabels: Record<string, string> = {
  macs: T('MAC Addresses'),
  cpu_id: T('CPU ID'),
  machine_id: T('Machine ID'),
  smbios_uuid: T('SMBIOS UUID'),
  product_serial: T('Product Serial'),
  chassis_serial: T('Chassis Serial'),
  board_serial: T('Board Serial'),
};

export function formatFingerprintLabel(key: string): string {
  if (fingerprintLabels[key]) {
    return fingerprintLabels[key];
  }
  return key
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFingerprintPrimitive(value: FingerprintPrimitive, translate: TranslateService): string {
  if (value === null || value === '') {
    return emptyPlaceholder;
  }
  if (typeof value === 'boolean') {
    return translate.instant(value ? T('Yes') : T('No'));
  }
  return String(value);
}

export function buildFingerprintField(
  key: string,
  value: LicenseFingerprintValue,
  translate: TranslateService,
): FingerprintField {
  const label = formatFingerprintLabel(key);
  if (Array.isArray(value)) {
    const values = value.map((item) => formatFingerprintPrimitive(item, translate));
    return { key, label, values: values.length > 0 ? values : [emptyPlaceholder] };
  }
  return { key, label, values: [formatFingerprintPrimitive(value, translate)] };
}

@Component({
  selector: 'ix-license-fingerprint-dialog',
  templateUrl: './license-fingerprint-dialog.component.html',
  styleUrls: ['./license-fingerprint-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnIconButtonComponent,
    TnSpinnerComponent,
    TranslateModule,
  ],
})
export class LicenseFingerprintDialog implements OnInit {
  protected dialogRef = inject<DialogRef<unknown, LicenseFingerprintDialog>>(DialogRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(true);
  protected readonly fingerprintRaw = signal<string | null>(null);

  protected readonly fingerprintFields = computed<FingerprintField[] | null>(() => {
    const raw = this.fingerprintRaw();
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(atob(raw));
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const entries = Object.entries(parsed as Record<string, unknown>);
      if (entries.length === 0 || !entries.every(([, value]) => isFingerprintValue(value))) {
        return null;
      }
      return (entries as [string, LicenseFingerprintValue][])
        .map(([key, value]) => buildFingerprintField(key, value, this.translate));
    } catch {
      return null;
    }
  });

  protected readonly fingerprintFallback = computed(() => {
    if (this.fingerprintFields()) {
      return null;
    }
    return this.fingerprintRaw();
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
