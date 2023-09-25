import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';

@Component({
  selector: 'ix-insecure-connection',
  templateUrl: './insecure-connection.component.html',
  styleUrls: ['./insecure-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
