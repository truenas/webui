import { Component, ChangeDetectionStrategy, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-harbor-logo',
  templateUrl: './truenas-logo.component.html',
  styleUrls: ['./truenas-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    RouterLink,
  ],
})
export class HarborosLogoComponent {
  private store$ = inject<Store<AppState>>(Store);
  private themeService = inject(ThemeService);

  readonly color = input<'primary' | 'white'>('primary');
  readonly fullSize = input(false);
  readonly hideText = input(false);
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly activeTheme = toSignal(this.themeService.activeTheme$);

  protected useWhiteLogo = computed(() => {
    const activeTheme = this.activeTheme();
    return activeTheme && !['ix-dark', 'high-contrast'].includes(activeTheme);
  });

  protected useWhite = computed(() => {
    return this.color() === 'white' || this.useWhiteLogo();
  });

  readonly logoTypeIcon = computed(() => {
    return this.useWhite()
      ? iconMarker('ix-harbor-logo-type')
      : iconMarker('ix-harbor-logo-type-color');
  });

  readonly logoMarkIcon = computed(() => {
    return this.useWhite()
      ? iconMarker('ix-harbor-logo-mark')
      : iconMarker('ix-harbor-logo-mark-color');
  });

  readonly fullSizeIcon = computed(() => {
    if (this.isEnterprise()) {
      return this.useWhite()
        ? iconMarker('ix-harbor-logo')
        : iconMarker('ix-harbor-logo');
    }
    return this.useWhite()
      ? iconMarker('ix-harbor-logo')
      : iconMarker('ix-harbor-logo');
  });
}
