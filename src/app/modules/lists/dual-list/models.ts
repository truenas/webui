export class ListSelection<T> {
  private _selectedItems: T[] = [];

  constructor(readonly totalItems: T[]) {}

  mouseDown(item: T, event?: MouseEvent): void {
    if (!event.ctrlKey) {
      if (!this.isSelected(item)) {
        this._selectedItems.length = 0;
        this._selectedItems.push(item);
      }
    } else if (!this.isSelected(item)) {
      this._selectedItems.push(item);
    } else {
      this.unselect(item);
    }
  }

  mouseUp(item: T, event?: MouseEvent): void {
    if (!event.ctrlKey && this._selectedItems.length > 1 && this.isSelected(item)) {
      this._selectedItems.length = 0;
      this._selectedItems.push(item);
    }
  }

  unselect(itemToUnselect: T): void {
    if (!this.isSelected(itemToUnselect)) {
      throw new Error('Cannot unselect an item that is not selected');
    }

    this._selectedItems = this._selectedItems.filter((item) => item !== itemToUnselect);
  }

  isSelected(itemToCheck: T): boolean {
    return !!this._selectedItems.find((item) => item === itemToCheck);
  }

  get selectedItems(): T[] {
    return this._selectedItems;
  }
}
