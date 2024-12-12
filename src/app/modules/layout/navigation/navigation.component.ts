import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, input, output,
} from '@angular/core';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem, MenuItemType, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
@Component({
  selector: 'ix-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatNavList,
    MatListItem,
    RouterLinkActive,
    RouterLink,
    MatTooltip,
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class NavigationComponent {
  readonly isSidenavCollapsed = input(false);

  readonly menuToggled = output<[string, SubMenuItem[]]>();
  readonly menuClosed = output();

  menuItems = this.navService.menuItems;
  isHighlighted: string;

  readonly MenuItemType = MenuItemType;

  constructor(
    private navService: NavigationService,
  ) {}

  toggleMenu(state: string, sub: SubMenuItem[]): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  updateHighlightedClass(state: string): void {
    this.isHighlighted = state;
  }

  getItemName(item: MenuItem): string {
    return `${item.name.replace(' ', '_')}-menu`;
  }

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }
}
