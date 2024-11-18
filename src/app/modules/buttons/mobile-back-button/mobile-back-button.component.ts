import {
  Component, output, ChangeDetectionStrategy,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TranslateModule,
    TestDirective,
  ],
  selector: 'ix-mobile-back-button',
  templateUrl: './mobile-back-button.component.html',
  styleUrls: ['./mobile-back-button.component.scss'],
})
export class MobileBackButtonComponent {
  readonly onClose = output();
}
