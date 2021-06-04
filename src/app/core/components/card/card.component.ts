import {
  Component, ViewChild, Input,
} from '@angular/core';

import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';

export const CardComponentMetadata = {
  selector: '[card]',
  templateUrl: './card.component.html',
};

@Component({
  selector: '[card]',
  templateUrl: './card.component.html',
})
export class CardComponent extends ViewControllerComponent {
  readonly componentName = CardComponent;
  @Input() data: any;

  /*
   * Properties
   * Wraps all content in an md-card
   * private headerTitle?: string
   * private headerOptions?: ViewControl
   * private primaryAction?: ViewFabButton
   * Methods
   * addHeaderTitle(title: string);
   */

  header = false;
  headerTitle?: string;
  // public headerOptions?: any; /*ViewControl*/
  @ViewChild('headerOptions', { static: true }) headerOptions: any;

  footer = true;

  constructor() {
    super();
    this.layoutChild = { flex: '100%' };
  }

  getHeaderTitle(): string {
    return this.headerTitle;
  }
  setHeaderTitle(title: string): void {
    this.headerTitle = title;
  }
}
