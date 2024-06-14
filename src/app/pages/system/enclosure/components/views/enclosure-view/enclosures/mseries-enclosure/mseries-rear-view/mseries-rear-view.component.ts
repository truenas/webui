import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { EnclosureViewDirective } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/enclosure-view/enclosure-view.directive';

@Component({
  selector: 'ix-mseries-rear-view',
  templateUrl: './mseries-rear-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MSeriesRearViewComponent extends EnclosureViewDirective {
  constructor() {
    super();
    this.svgPath = 'assets/images/new-hardware/mseries/mseries-rear.svg';
  }
}
