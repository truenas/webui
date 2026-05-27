import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TnToastConfig, TnToastPosition, TnToastRef, TnToastService, TnToastType,
} from '@truenas/ui-components';
import { take } from 'rxjs/operators';
import { SnackbarOptions } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

// tn-toast picks its icon from the toast type, so legacy SnackbarOptions
// color hints are mapped to the nearest semantic type.
const colorToType: Record<string, TnToastType> = {
  'var(--green)': TnToastType.Success,
  'var(--red)': TnToastType.Error,
  'var(--orange)': TnToastType.Warning,
  'var(--yellow)': TnToastType.Warning,
};

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private tnToast = inject(TnToastService);
  private translate = inject(TranslateService);

  private activeRef: TnToastRef | null = null;

  open(options: SnackbarOptions): TnToastRef {
    const config: TnToastConfig = {
      duration: options.duration ?? 4000,
      position: options.verticalPosition === 'bottom' ? TnToastPosition.Bottom : TnToastPosition.Top,
      type: inferTypeFromColor(options.iconCssColor),
    };

    const ref = options.button
      ? this.tnToast.open(options.message, options.button.title, config)
      : this.tnToast.open(options.message, config);

    const buttonAction = options.button?.action;
    if (buttonAction) {
      ref.onAction().pipe(take(1)).subscribe(() => buttonAction());
    }

    // Track the active toast so dismiss() can close it, and stop tracking once
    // it goes away on its own (auto-dismiss, action, or programmatic dismiss)
    // to avoid holding a stale ref.
    this.activeRef = ref;
    ref.afterDismissed().pipe(take(1)).subscribe(() => {
      if (this.activeRef === ref) {
        this.activeRef = null;
      }
    });

    return ref;
  }

  dismiss(): void {
    this.activeRef?.dismiss();
    this.activeRef = null;
  }

  success(message: TranslatedString): TnToastRef {
    return this.open({ message, iconCssColor: 'var(--green)' });
  }

  error(message: TranslatedString): TnToastRef {
    // The Close button only needs to dismiss the toast; tn-toast's action
    // handler dismisses on click, so no `action` callback is required.
    return this.open({
      message,
      iconCssColor: 'var(--red)',
      button: { title: this.translate.instant('Close') },
    });
  }
}

function inferTypeFromColor(color: string | undefined): TnToastType {
  return (color && colorToType[color]) || TnToastType.Info;
}
