import {
  ChangeDetectionStrategy, Component, OnInit, output, signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter, take } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { terminalFontSizeUpdated } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-terminal-font-size',
  templateUrl: './terminal-font-size.component.html',
  styleUrls: ['./terminal-font-size.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class TerminalFontSizeComponent implements OnInit {
  fontSizeChanged = output<number>();

  protected fontSize = signal(14);
  protected readonly minFontSize = 10;
  protected readonly maxFontSize = 25;

  constructor(private store$: Store<AppState>) {}

  ngOnInit(): void {
    this.store$.pipe(
      waitForPreferences,
      filter((preferences) => preferences.terminalFontSize !== undefined),
      take(1),
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.fontSize.set(preferences.terminalFontSize);
      this.fontSizeChanged.emit(preferences.terminalFontSize);
    });
  }

  protected change(step: number): void {
    const newSize = this.fontSize() + step;
    if (newSize < this.minFontSize || newSize > this.maxFontSize) {
      return;
    }

    this.fontSize.set(newSize);
    this.store$.dispatch(terminalFontSizeUpdated({ fontSize: newSize }));
    this.fontSizeChanged.emit(newSize);
  }
}
