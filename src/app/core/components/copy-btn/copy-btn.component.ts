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

  private copyViaDeprecatedExecCommand(): Promise<void> {
    const textArea = document.createElement('textarea');
    textArea.value = this.text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve) => {
      document.execCommand('copy');
      textArea.remove();
      resolve();
    });
  }

  private handleCopyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }

    return this.copyViaDeprecatedExecCommand();
  }

  copyToClipboard(): void {
    this.handleCopyToClipboard(this.text).then(() => this.showSuccessMessage());
  }

  copyJsonToClipboard(): void {
    this.handleCopyToClipboard(JSON.stringify(this.jsonText, null, 2)).then(() => this.showSuccessMessage());
  }
}
