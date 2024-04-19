import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-app-router-outlet',
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRouterOutletComponent {

}
