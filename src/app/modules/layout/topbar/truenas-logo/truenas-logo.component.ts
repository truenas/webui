import { Component, ChangeDetectionStrategy, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { tnIconMarker, TnIconComponent } from '@truenas/ui-components';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-harbor-logo',
  templateUrl: './truenas-logo.component.html',
  styleUrls: ['./truenas-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    RouterLink,
  ],
})
export class TruenasLogoComponent {
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
      ? tnIconMarker('harbor-logo-type', 'custom')
      : tnIconMarker('harbor-logo-type-color', 'custom');
  });

  readonly logoMarkIcon = computed(() => {
    return this.useWhite()
      ? tnIconMarker('harbor-logo-mark', 'custom')
      : tnIconMarker('harbor-logo-mark-color', 'custom');
  });

  readonly fullSizeIcon = computed(() => {
    return tnIconMarker('harbor-logo', 'custom');
  });
}
