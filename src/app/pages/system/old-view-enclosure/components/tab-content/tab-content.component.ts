import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { DashboardEnclosureSlot, EnclosureElement } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContentComponent {
  @Input() element: Record<number, EnclosureElement> | Record<number, DashboardEnclosureSlot>;
  get data(): EnclosureElement[] {
    return Object.entries(this.element).map((keyValue: [string, EnclosureElement]) => {
      return keyValue[1];
    });
  }
  displayedColumns: string[] = [
    'descriptor',
    'status',
    'value',
  ];
}
