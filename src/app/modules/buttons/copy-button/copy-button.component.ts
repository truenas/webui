import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconButtonComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective, TnTooltipDirective,
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

  private copyViaDeprecatedExecCommand(text: string): Promise<void> {
    return new Promise((resolve) => {
      const textArea = document.createElement('textarea');
      Object.assign(textArea.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      // Fallback for browsers that don't support navigator.clipboard
      // eslint-disable-next-line sonarjs/deprecation
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
    this.handleCopyToClipboard(this.text()).then(() => this.showSuccessMessage());
  }

  copyJsonToClipboard(): void {
    this.handleCopyToClipboard(JSON.stringify(this.jsonText(), null, 2)).then(() => this.showSuccessMessage());
  }
}
