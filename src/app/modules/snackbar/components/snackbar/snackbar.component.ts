import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarConfig } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SnackbarComponent {
  config = inject<SnackbarConfig>(MAT_SNACK_BAR_DATA);
  private snackBarRef = inject(MatSnackBarRef);

  get iconColor(): string {
    return this.config.iconCssColor || 'var(--primary)';
  }

  onButtonClick(): void {
    if (this.config.button?.action) {
      this.config.button.action();
    }
    this.snackBarRef.dismiss();
  }
}
