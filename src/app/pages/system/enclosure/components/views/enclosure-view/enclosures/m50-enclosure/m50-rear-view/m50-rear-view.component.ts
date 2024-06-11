import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { EnclosureViewDirective } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/enclosure-view/enclosure-view.directive';

@Component({
  selector: 'ix-m50-rear-view',
  templateUrl: './m50-front-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50RearViewComponent extends EnclosureViewDirective {
  constructor() {
    super();
    this.svgPath = 'assets/images/new-hardware/m50/m50-front.svg';
  }
}
