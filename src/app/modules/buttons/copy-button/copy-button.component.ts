import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ClipboardService } from 'app/services/clipboard.service';

@Component({
  selector: 'ix-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    MatTooltip,
    TranslateModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    TestDirective,
  ],
})
export class CopyButtonComponent {
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private clipboard = inject(ClipboardService);

  readonly text = input.required<string>();
  readonly jsonText = input<unknown>();

  readonly isValidJson = computed(() => typeof this.jsonText() === 'object');

  private showSuccessMessage(): void {
    this.snackbar.success(this.translate.instant('Copied to clipboard'));
  }

  // The copy can fail with nothing else to report it: `writeText` rejects when
  // the document isn't focused or the permission is denied, and the
  // insecure-context fallback reports a refusal by returning false.
  private showErrorMessage(): void {
    this.snackbar.error(this.translate.instant('Failed to copy to clipboard'));
  }

  copyToClipboard(): void {
    this.clipboard.copy(this.text())
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }

  copyJsonToClipboard(): void {
    this.clipboard.copy(JSON.stringify(this.jsonText(), null, 2))
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }
}
