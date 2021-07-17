export interface MenuItem {
  type: string; // Possible values: link/slideOut/icon/separator/extLink
  name?: string; // Used as display text for item and title for separator type
  state?: string; // Router state
  icon?: string; // Item icon name
  tooltip?: string; // Tooltip text
  disabled?: boolean; // If true, item will not be appeared in sidenav.
  sub?: SubMenuItem[]; // Dropdown items
}

export interface SubMenuItem {
  name: string; // Display text
  state: string; // Router state
  disabled?: boolean; // If true, item will not be appeared in sidenav.
}
