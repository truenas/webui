import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { EnclosureViewDirective } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/enclosure-view/enclosure-view.directive';

@Component({
  selector: 'ix-mseries-front-view',
  templateUrl: './mseries-front-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MSeriesFrontViewComponent extends EnclosureViewDirective {
  constructor() {
    super();
    this.svgPath = 'assets/images/new-hardware/mseries/mseries-front.svg';
  }
}
