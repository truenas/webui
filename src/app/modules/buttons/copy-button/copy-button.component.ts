import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    TranslateModule,
    IxIconComponent,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    TestDirective,
  ],
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  readonly jsonText = input<unknown>();

  readonly isValidJson = computed(() => typeof this.jsonText() === 'object');

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
    this.handleCopyToClipboard(this.text()).then(() => this.showSuccessMessage());
  }

  copyJsonToClipboard(): void {
    this.handleCopyToClipboard(JSON.stringify(this.jsonText(), null, 2)).then(() => this.showSuccessMessage());
  }
}
