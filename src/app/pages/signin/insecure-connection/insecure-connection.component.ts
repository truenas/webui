import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-insecure-connection',
  templateUrl: './insecure-connection.component.html',
  styleUrls: ['./insecure-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent, TranslateModule],
})
export class InsecureConnectionComponent {
}
