import {
  Component, ViewChild, Input, OnInit,
} from '@angular/core';
import { Display } from 'app/core/components/display/display.component';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { MaterialModule } from '../../../appMaterial.module';

/*
export interface CardData {
  header?: any;
  content?: any;
  footer?: any;
}
 */

// This makes the metadata available globally
export const CardComponentMetadata = {
  selector: '[card]',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
};

@Component({
  selector: '[card]',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
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

  // @ViewChild('display', { static: true}) display; // Already created in base class by default
  primaryAction?: any; /* ViewFabButton */
  header = false;
  headerTitle?: string;
  // public headerOptions?: any; /*ViewControl*/
  @ViewChild('headerOptions', { static: true }) headerOptions: any;

  footer = true;
  @ViewChild('footerControls', { static: true }) footerControls: any;

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
