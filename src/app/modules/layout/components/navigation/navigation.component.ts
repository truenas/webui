import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MenuItem, MenuItemType, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
@Component({
  selector: 'ix-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  @Input() isSidenavCollapsed = false;

  @Output() menuToggled = new EventEmitter<[string, SubMenuItem[]]>();
  @Output() menuClosed = new EventEmitter<void>();

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
