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
import { ClipboardService } from 'app/services/clipboard.service';

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

  protected copyToClipboard(): void {
    this.clipboard.copy(this.text())
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }

  protected copyJsonToClipboard(): void {
    this.clipboard.copy(JSON.stringify(this.jsonText(), null, 2))
      .then(() => this.showSuccessMessage())
      .catch(() => this.showErrorMessage());
  }
}
