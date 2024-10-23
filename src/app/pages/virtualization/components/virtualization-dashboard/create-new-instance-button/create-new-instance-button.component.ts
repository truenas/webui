import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ix-create-new-instance-button',
  templateUrl: './create-new-instance-button.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAnchor,
    RouterLink,
    TranslateModule,
  ],
})
export class CreateNewInstanceButtonComponent {

}
