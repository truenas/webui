import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: './secondary-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatList,
    MatListItem,
    RouterLinkActive,
    RouterLink,
    AsyncPipe,
    TranslateModule,
    HasAccessDirective,
    TestDirective,
  ],
})
export class SecondaryMenuComponent {
  readonly menuName = input<string>();
  readonly subMenuItems = input<SubMenuItem[]>();

  readonly toggleMenu = output();
}
