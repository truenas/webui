import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: './secondary-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryMenuComponent {
  readonly menuName = input<string>();
  readonly subMenuItems = input<SubMenuItem[]>();

  readonly toggleMenu = output();
}
