import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnTooltipDirective,
} from '@truenas/ui-components';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Component({
  selector: 'ix-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TnTooltipDirective,
    TranslateModule,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
  ],
})
export class CopyButtonComponent {
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  readonly text = input.required<string>();
  readonly jsonText = input<unknown>();

  readonly isValidJson = computed(() => typeof this.jsonText() === 'object');

  private showSuccessMessage(): void {
    this.snackbar.success(this.translate.instant('Copied to clipboard'));
  }

  // `navigator.clipboard.writeText` rejects when the document isn't focused or the
  // permission is denied, so the copy can fail with nothing else to report it.
  private showErrorMessage(): void {
    this.snackbar.error(this.translate.instant('Failed to copy to clipboard'));
  }

  private copyViaDeprecatedExecCommand(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      Object.assign(textArea.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      // Fallback for browsers that don't support navigator.clipboard
      // eslint-disable-next-line sonarjs/deprecation
      const isCopied = document.execCommand('copy');
      textArea.remove();

      // `execCommand` reports a refused copy by returning false rather than throwing, so
      // without this the fallback path would always claim success.
      if (isCopied) {
        resolve();
      } else {
        reject(new Error('document.execCommand("copy") was refused'));
      }
    });
  }

  private handleCopyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }

    return this.copyViaDeprecatedExecCommand(text);
  }

  protected copyToClipboard(): void {
    this.handleCopyToClipboard(this.text())
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }

  protected copyJsonToClipboard(): void {
    this.handleCopyToClipboard(JSON.stringify(this.jsonText(), null, 2))
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }
}
