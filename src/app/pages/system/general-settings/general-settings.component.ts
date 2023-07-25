import {
  AfterViewInit, ChangeDetectionStrategy, Component,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent implements AfterViewInit {
  constructor(
    private route: ActivatedRoute,
  ) { }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(untilDestroyed(this)).subscribe((fragment: string) => {
      const htmlElement = document.getElementById('email-card');
      if (fragment === 'email' && htmlElement) {
        htmlElement?.scrollIntoView({ block: 'center' });
        htmlElement.classList.add('highlighted');
        timer(999).pipe(untilDestroyed(this)).subscribe(() => htmlElement.classList.remove('highlighted'));
      }
      const guiSettingsButton = document.getElementById('gui-settings');
      if (fragment === 'gui' && guiSettingsButton) {
        guiSettingsButton.click();
      }
    });
  }
}
