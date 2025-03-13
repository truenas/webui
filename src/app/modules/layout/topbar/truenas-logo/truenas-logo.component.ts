import {
  Component, ChangeDetectionStrategy, computed,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-truenas-logo',
  templateUrl: './truenas-logo.component.html',
  styleUrls: ['./truenas-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    RouterLink,
  ],
})
export class TruenasLogoComponent {
  readonly color = input<'primary' | 'white'>('primary');
  readonly fullSize = input(false);
  readonly hideText = input(false);
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly activeTheme = toSignal(this.themeService.activeTheme$);

  protected useWhiteLogo = computed(() => {
    const activeTheme = this.activeTheme();
    return activeTheme && !['ix-dark', 'high-contrast', 'midnight'].includes(activeTheme);
  });

  protected useWhite = computed(() => {
    return this.color() === 'white' || this.useWhiteLogo();
  });

  readonly logoTypeIcon = computed(() => {
    return this.useWhite()
      ? iconMarker('ix-truenas-logo-type')
      : iconMarker('ix-truenas-logo-type-color');
  });

  readonly logoMarkIcon = computed(() => {
    return this.useWhite()
      ? iconMarker('ix-truenas-logo-mark')
      : iconMarker('ix-truenas-logo-mark-color');
  });

  readonly fullSizeIcon = computed(() => {
    if (this.isEnterprise()) {
      return this.useWhite()
        ? iconMarker('ix-truenas-logo-enterprise')
        : iconMarker('ix-truenas-logo-enterprise-color');
    }
    return this.useWhite()
      ? iconMarker('ix-truenas-logo-ce')
      : iconMarker('ix-truenas-logo-ce-color');
  });

  constructor(
    private store$: Store<AppState>,
    private themeService: ThemeService,
  ) {}
}
