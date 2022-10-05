import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Component({
  selector: 'ix-copy-btn',
  templateUrl: './copy-btn.component.html',
  styleUrls: ['./copy-btn.component.scss'],
})
export class CopyButtonComponent {
  @Input() text: string;

  constructor(
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  private showSuccessMessage(): void {
    this.snackbar.success(this.translate.instant('Copied to clipboard'));
  }

  private handleCopyToClipboard(textToCopy: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(textToCopy);
    }

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.execCommand('copy') ? resolve() : reject();
      textArea.remove();
    });
  }

  copyToClipboard(): void {
    this.handleCopyToClipboard(this.text).then(() => this.showSuccessMessage());
  }
}
