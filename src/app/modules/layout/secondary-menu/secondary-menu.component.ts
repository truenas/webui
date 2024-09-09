import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-secondary-menu',
  templateUrl: './secondary-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatList,
    CommonDirectivesModule,
    MatListItem,
    RouterLinkActive,
    TestIdModule,
    RouterLink,
    AsyncPipe,
    TranslateModule,
  ],
})
export class SecondaryMenuComponent {
  readonly menuName = input<string>();
  readonly subMenuItems = input<SubMenuItem[]>();

  readonly toggleMenu = output();
}
