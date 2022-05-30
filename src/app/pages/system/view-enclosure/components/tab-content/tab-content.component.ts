import {
  Component, Input,
} from '@angular/core';
import { EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.scss'],
})
export class TabContentComponent {
  @Input() data: EnclosureElementsGroup;
}
