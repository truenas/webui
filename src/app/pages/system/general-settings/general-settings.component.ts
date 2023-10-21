import {
  AfterViewInit, ChangeDetectionStrategy, Component,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
      const emailSettingsButton = document.getElementById('email-settings');
      if (fragment === 'email' && emailSettingsButton) {
        emailSettingsButton.click();
      }
      const guiSettingsButton = document.getElementById('gui-settings');
      if (fragment === 'gui' && guiSettingsButton) {
        guiSettingsButton.click();
      }
    });
  }
}
