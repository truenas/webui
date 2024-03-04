import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { EnclosureUiElement, EnclosureUiSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContentComponent {
  @Input() element: Record<number, EnclosureUiElement> | Record<number, EnclosureUiSlot>;
  get data(): EnclosureUiElement[] {
    return Object.entries(this.element).map((keyValue: [string, EnclosureUiElement]) => {
      return keyValue[1];
    });
  }
  displayedColumns: string[] = [
    'descriptor',
    'status',
    'value',
  ];
}
