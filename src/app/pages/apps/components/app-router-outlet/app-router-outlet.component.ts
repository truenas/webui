import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ix-app-router-outlet',
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
  ],
})
export class AppRouterOutletComponent {

}
