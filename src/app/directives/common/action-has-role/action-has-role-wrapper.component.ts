import { Component } from '@angular/core';

@Component({
  selector: 'ix-has-role-wrapper',
  template: `
    <div class="wrapper"><ng-content></ng-content></div>
  `,
  styleUrls: [
    './action-has-role-wrapper.component.scss',
  ],
})
export class ActionHasRoleWrapperComponent { }
