import { Component, ChangeDetectionStrategy, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { tnIconMarker, TnIconComponent, TnTestIdDirective } from '@truenas/ui-components';
import { ProductType } from 'app/enums/product-type.enum';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppState } from 'app/store';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-truenas-logo',
  templateUrl: './truenas-logo.component.html',
  styleUrls: ['./truenas-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnTestIdDirective,
    RouterLink,
  ],
})
export class TruenasLogoComponent {
  private store$ = inject<Store<AppState>>(Store);
  private themeService = inject(ThemeService);

  readonly color = input<'primary' | 'white'>('primary');
  readonly fullSize = input(false);
  readonly hideText = input(false);
  readonly productType = toSignal(this.store$.select(selectProductType));
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
      ? tnIconMarker('truenas-logo-type', 'custom')
      : tnIconMarker('truenas-logo-type-color', 'custom');
  });

  readonly logoMarkIcon = computed(() => {
    return this.useWhite()
      ? tnIconMarker('truenas-logo-mark', 'custom')
      : tnIconMarker('truenas-logo-mark-color', 'custom');
  });

  readonly fullSizeIcon = computed(() => {
    const productType = this.productType();
    if (productType === ProductType.Enterprise) {
      return this.useWhite()
        ? tnIconMarker('truenas-logo-enterprise', 'custom')
        : tnIconMarker('truenas-logo-enterprise-color', 'custom');
    }
    if (productType === ProductType.Commercial) {
      // There is no Commercial edition artwork: show the plain logo rather than another edition's name.
      return tnIconMarker('truenas-logo', 'custom');
    }
    return this.useWhite()
      ? tnIconMarker('truenas-logo-ce', 'custom')
      : tnIconMarker('truenas-logo-ce-color', 'custom');
  });
}
