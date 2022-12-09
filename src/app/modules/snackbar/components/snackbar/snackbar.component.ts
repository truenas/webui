import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from '@angular/material/legacy-snack-bar';
import { SnackbarConfig } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';

@Component({
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public config: SnackbarConfig,
  ) {}

  get iconColor(): string {
    return this.config.iconCssColor || 'var(--primary)';
  }
}
