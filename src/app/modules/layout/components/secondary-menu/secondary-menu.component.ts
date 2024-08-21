import {
  ChangeDetectionStrategy, Component, Input, output,
} from '@angular/core';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: './secondary-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryMenuComponent {
  @Input() menuName: string;
  @Input() subMenuItems: SubMenuItem[];

  readonly toggleMenu = output();
}
