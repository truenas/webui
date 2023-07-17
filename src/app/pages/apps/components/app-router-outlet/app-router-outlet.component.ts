import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRouterOutletComponent {

}
