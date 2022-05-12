import {
  ChangeDetectionStrategy, Component, Input, Output, EventEmitter,
} from '@angular/core';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: 'secondary-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryMenuComponent {
  @Input() menuName: string;
  @Input() subMenuItems: SubMenuItem[];

  @Output() toggleMenu = new EventEmitter<void>();
}
