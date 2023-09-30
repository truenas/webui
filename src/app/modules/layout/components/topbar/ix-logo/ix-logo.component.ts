import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-logo',
  templateUrl: './ix-logo.component.html',
  styleUrls: ['./ix-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxLogoComponent {
  constructor(
    private mediaObserver: MediaObserver,
    private themeService: ThemeService,
  ) {}

  screenSize$ = this.mediaObserver.asObservable().pipe(
    map((changes) => changes[0].mqAlias),
  );

  logoIcon$ = combineLatest([
    this.themeService.activeTheme$,
    this.screenSize$,
  ]).pipe(
    map(([activeTheme, screenSize]) => {
      const isBlueTheme = activeTheme === 'ix-blue' || activeTheme === 'midnight';
      if (isBlueTheme && screenSize === 'xs') {
        return 'ix:logo_mark';
      }
      if (!isBlueTheme && screenSize === 'xs') {
        return 'ix:logo_mark_rgb';
      }
      if (isBlueTheme && screenSize !== 'xs') {
        return 'ix:logo_full';
      }
      return 'ix:logo_full_rgb';
    }),
  );
}
