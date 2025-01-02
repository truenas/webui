import { Component, ChangeDetectionStrategy } from '@angular/core';

// TODO: Add harness for this component

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'ix-master-detail-view',
  exportAs: 'masterDetailViewContext',
  template: '<ng-content></ng-content>',
})
export class MockMasterDetailViewComponent {
  isMobileView = jest.fn(() => false);
  showMobileDetails = jest.fn(() => false);
  toggleShowMobileDetails = jest.fn();
}
