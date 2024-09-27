import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-insecure-connection',
  templateUrl: './insecure-connection.component.html',
  styleUrls: ['./insecure-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxIconComponent, TranslateModule],
})
export class InsecureConnectionComponent {
  connectionText = '';

  constructor(
    @Inject(WINDOW) private window: Window,
    private translate: TranslateService,
  ) {
    const replacedUrl = this.window.location.href.replace('http://', 'https://');
    this.connectionText = this.translate.instant('You are using an insecure connection. <a href="{url}">Switch to HTTPS</a> for secure access.', { url: replacedUrl });
  }
}
