export function belongs(item: any, array: any[], key: string) {
  return !!array.find(i => i[key] === item[key]);
}
export function difference(arrayOne: any[], arrayTwo: any[], key: string) {
  return arrayOne.filter(i => {
    return !belongs(i, arrayTwo, key);
  });
}



export interface ListSelection {
  selectedItems: any[];

  totalItems: any[];

  mouseDown(item: any): void;

  mouseUp(item: any): void;

  selectAll(): void;

  unselect(item: any): void;

  isSelected(item: any): boolean;
}

export class ListSelectionImpl implements ListSelection {
  private _selectedItems: any[] = [];

  constructor(public readonly totalItems: any[]) {}



  mouseDown(item: any, event?): void {
    if (!event.ctrlKey) {
      if (!this.isSelected(item)) {
        this._selectedItems.length = 0;
        this._selectedItems.push(item);
      }
    } else {
        if (!this.isSelected(item)) {
          this._selectedItems.push(item);
        } else {
        this.unselect(item);
        }
    }
  }

  mouseUp(item: any, event?) {
    if (!event.ctrlKey) {
      if (this._selectedItems.length > 1 && this.isSelected(item)) {
        this._selectedItems.length = 0;
        this._selectedItems.push(item);      
      }
    }
  }

  selectAll(): void {
    this._selectedItems = this.totalItems;
  }

  unselect(item: any): void {
    if (!this.isSelected(item)) {
      throw new Error(`Cannot unselect an item that is not selected`);
    }

    this._selectedItems = this._selectedItems.filter(e => e !== item);
  }

  isSelected(item: any): boolean {
    return !!this._selectedItems.find(e => e === item);
  }

  get selectedItems(): any[] {
    return this._selectedItems;
  }
}
