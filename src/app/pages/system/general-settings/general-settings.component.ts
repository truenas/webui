import {
  AfterViewInit, ChangeDetectionStrategy, Component, TemplateRef, ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent implements AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private layoutService: LayoutService,
    private route: ActivatedRoute,
  ) { }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);

    this.route.fragment.pipe(untilDestroyed(this)).subscribe((fragment: string) => {
      const htmlElement = document.getElementById('email-card');
      if (fragment === 'email' && htmlElement) {
        htmlElement?.scrollIntoView({ block: 'center' });
        htmlElement.classList.add('highlighted');
        timer(999).pipe(untilDestroyed(this)).subscribe(() => htmlElement.classList.remove('highlighted'));
      }
    });
  }
}
