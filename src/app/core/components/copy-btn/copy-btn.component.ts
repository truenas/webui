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

  private handleCopyToClipboard(): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(this.text);
    }

    return this.copyViaDeprecatedExecCommand();
  }

  copyToClipboard(): void {
    this.handleCopyToClipboard().then(() => this.showSuccessMessage());
  }
}
