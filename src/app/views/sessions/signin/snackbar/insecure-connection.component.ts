import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
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
  ) {
    const replacedUrl = this.window.location.href.replace('http://', 'https://');
    this.connectionText = `You are using an insecure connection. <a href="${replacedUrl}">Switch to HTTPS</a> for secure access.`;
  }
}
