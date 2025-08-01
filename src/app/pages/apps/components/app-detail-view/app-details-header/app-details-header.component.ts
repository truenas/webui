import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import createDOMPurify from 'dompurify';
import type { DOMPurify as DOMPurifyType } from 'dompurify';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { WINDOW } from 'app/helpers/window.helper';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { InstallAppButtonComponent } from 'app/pages/apps/components/install-app-button/install-app-button.component';
import { InstalledAppBadgeComponent } from 'app/pages/apps/components/installed-app-badge/installed-app-badge.component';

@Component({
  selector: 'ix-app-details-header',
  templateUrl: './app-details-header.component.html',
  styleUrls: ['./app-details-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AppCardLogoComponent,
    CleanLinkPipe,
    TestDirective,
    NgxSkeletonLoaderModule,
    InstalledAppBadgeComponent,
    OrNotAvailablePipe,
    InstallAppButtonComponent,
  ],
})
export class AppDetailsHeaderComponent {
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);

  readonly app = input<AvailableApp>();
  readonly isLoading = input<boolean>();

  private domPurify: DOMPurifyType;
  constructor() {
    this.domPurify = createDOMPurify(this.window.window);
  }

  description = computed<string>(() => {
    const splitText = this.app()?.app_readme?.split('</h1>');
    const html = splitText?.[1] || splitText?.[0];
    const sanitizedHtml = this.domPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'a'],
      ALLOWED_ATTR: ['href'],
    });
    return sanitizedHtml.trim() || '';
  });
}
