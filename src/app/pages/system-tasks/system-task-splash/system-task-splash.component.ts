import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, viewChild,
} from '@angular/core';
import { TnCardComponent, TnIconComponent } from '@truenas/ui-components';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Full screen splash shown while the system is restarting, shutting down, failing over or
 * resetting its configuration. Presentational only - the hosting page owns the API calls.
 */
@Component({
  selector: 'ix-system-task-splash',
  templateUrl: './system-task-splash.component.html',
  styleUrls: ['./system-task-splash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnIconComponent,
    CopyrightLineComponent,
  ],
})
export class SystemTaskSplashComponent implements AfterViewInit {
  /**
   * Status line for the task in progress. Required: these screens are shown for minutes at a
   * time, so a logo with no text leaves a screen reader with nothing to announce.
   */
  readonly message = input.required<TranslatedString>();

  private heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  ngAfterViewInit(): void {
    // These pages replace the whole screen without any user interaction, and whatever had
    // focus is gone with the view they came from. Moving focus to the heading is what
    // actually gets the message read out - the text is static, so a live region would have
    // no mutation to announce.
    this.heading().nativeElement.focus();
  }
}
