import {
  Component, output, ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TranslateModule,
    TestDirective,
  ],
  selector: 'ix-mobile-back-button',
  templateUrl: './mobile-back-button.component.html',
  styleUrls: ['./mobile-back-button.component.scss'],
})
export class MobileBackButtonComponent {
  readonly closed = output();
}
