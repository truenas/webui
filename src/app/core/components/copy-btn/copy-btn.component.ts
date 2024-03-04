import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Component({
  selector: 'ix-copy-btn',
  templateUrl: './copy-btn.component.html',
  styleUrls: ['./copy-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  @Input() text: string;
  @Input() jsonText: unknown;

  get isValidJson(): boolean {
    return typeof this.jsonText === 'object';
  }

  constructor(
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  private showSuccessMessage(): void {
    this.snackbar.success(this.translate.instant('Copied to clipboard'));
  }

  private copyViaDeprecatedExecCommand(text: string): Promise<void> {
    return new Promise((resolve) => {
      const textArea = document.createElement('textarea');
      Object.assign(textArea.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      resolve();
    });
  }

  private handleCopyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }

    return this.copyViaDeprecatedExecCommand(text);
  }

  copyToClipboard(): void {
    this.handleCopyToClipboard(this.text).then(() => this.showSuccessMessage());
  }

  copyJsonToClipboard(): void {
    this.handleCopyToClipboard(JSON.stringify(this.jsonText, null, 2)).then(() => this.showSuccessMessage());
  }
}
