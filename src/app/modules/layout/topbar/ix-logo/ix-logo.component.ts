import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'ix-logo',
  templateUrl: './ix-logo.component.html',
  styleUrls: ['./ix-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    AsyncPipe,
    TestDirective,
  ],
})
export class IxLogoComponent {
  constructor(
    private themeService: ThemeService,
    private breakpointObserver: BreakpointObserver,
  ) {}

  readonly isXsScreen$ = this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
    map((result) => result.matches),
  );

  logoIcon$ = combineLatest([
    this.themeService.activeTheme$,
    this.isXsScreen$,
  ]).pipe(
    map(([activeTheme, isXsScreen]) => {
      const isBlueTheme = activeTheme === 'ix-blue' || activeTheme === 'midnight';
      if (isBlueTheme && isXsScreen) {
        return 'ix:logo_mark';
      }
      if (!isBlueTheme && isXsScreen) {
        return 'ix:logo_mark_rgb';
      }
      if (isBlueTheme && !isXsScreen) {
        return 'ix:logo_full';
      }
      return 'ix:logo_full_rgb';
    }),
  );
}
