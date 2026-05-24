import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TnToastConfig, TnToastPosition, TnToastRef, TnToastService, TnToastType,
} from '@truenas/ui-components';
import { SnackbarOptions } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

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
      type: this.inferTypeFromColor(options.iconCssColor),
    };

    const ref = options.button
      ? this.tnToast.open(options.message, options.button.title, config)
      : this.tnToast.open(options.message, config);

    const buttonAction = options.button?.action;
    if (buttonAction) {
      ref.onAction().subscribe(() => buttonAction());
    }

    this.trackActiveRef(ref);
    return ref;
  }

  dismiss(): void {
    this.activeRef?.dismiss();
    this.activeRef = null;
  }

  success(message: TranslatedString): TnToastRef {
    const ref = this.tnToast.open(message, {
      type: TnToastType.Success,
      duration: 4000,
      position: TnToastPosition.Top,
    });
    this.trackActiveRef(ref);
    return ref;
  }

  error(message: TranslatedString): TnToastRef {
    const ref = this.tnToast.open(message, this.translate.instant('Close'), {
      type: TnToastType.Error,
      duration: 4000,
      position: TnToastPosition.Top,
    });
    this.trackActiveRef(ref);
    return ref;
  }

  private trackActiveRef(ref: TnToastRef): void {
    this.activeRef = ref;
    ref.afterDismissed().subscribe(() => {
      if (this.activeRef === ref) {
        this.activeRef = null;
      }
    });
  }

  // tn-toast picks its icon from the toast type, so the SnackbarOptions
  // icon/color hints from legacy callers are mapped to the nearest type.
  private inferTypeFromColor(color: string | undefined): TnToastType {
    if (!color) {
      return TnToastType.Info;
    }
    if (color.includes('green')) {
      return TnToastType.Success;
    }
    if (color.includes('red')) {
      return TnToastType.Error;
    }
    if (color.includes('orange') || color.includes('yellow')) {
      return TnToastType.Warning;
    }
    return TnToastType.Info;
  }
}
