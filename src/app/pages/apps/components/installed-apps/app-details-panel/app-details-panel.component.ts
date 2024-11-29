import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { App } from 'app/interfaces/app.interface';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AppNotesCardComponent } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';
import { AppWorkloadsCardComponent } from 'app/pages/apps/components/installed-apps/app-workloads-card/app-workloads-card.component';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    AppInfoCardComponent,
    AppWorkloadsCardComponent,
    AppNotesCardComponent,
    AppMetadataCardComponent,
  ],
})
export class AppDetailsPanelComponent {
  readonly app = input<App>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly closeMobileDetails = output();
}
