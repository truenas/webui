import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-create-new-instance-button',
  templateUrl: './create-new-instance-button.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAnchor,
    RouterLink,
    TranslateModule,
    TestDirective,
  ],
})
export class CreateNewInstanceButtonComponent {

}
