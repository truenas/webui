import {
  Component, Input,
} from '@angular/core';
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

  copyToClipboard(): void {
    if (!navigator.clipboard) {
      /** @deprecated */
      document.execCommand('copy', false, this.text);
      this.snackbar.success(this.translate.instant('Copied to clipboard'));
    } else {
      navigator.clipboard.writeText(this.text).then(() => {
        this.snackbar.success(this.translate.instant('Copied to clipboard'));
      });
    }
  }
}
