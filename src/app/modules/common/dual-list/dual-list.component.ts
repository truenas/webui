import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';
import {
  Component, ContentChild, EventEmitter, Input, OnChanges, OnInit, Output, TemplateRef,
} from '@angular/core';
import _ from 'lodash';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { difference, ListSelection, ListSelectionImpl } from './models';

const transfer = <T>(from: ListSelection<T>, to: ListSelection<T>): {
  from: ListSelection<T>; to: ListSelection<T>;
} => ({
    from: new ListSelectionImpl(
      from.totalItems.filter((item) => !from.isSelected(item)),
    ),
    to: new ListSelectionImpl([...from.selectedItems, ...to.totalItems]),
  });

@Component({
  selector: 'ix-dual-listbox',
  styleUrls: ['./dual-list.component.scss'],
  templateUrl: 'dual-list.component.html',
})
export class DualListboxComponent<T extends { id: string | number; name?: string }> implements OnInit, OnChanges {
  @Input() key: keyof T = 'id';
  @Input() items: T[];
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('selectedItems') _selectedItems: T[];
  @Output() selectedItemsChange = new EventEmitter<T[]>();

  @Input() minHeight = '200px';
  @Input() maxHeight = '300px';
  @Input() title1: string;
  @Input() title2: string;

  @ContentChild('templateItem', { static: true }) templateItem: TemplateRef<{ $implicit: T }>;
  @ContentChild('templateArrowLeft', { static: true }) templateArrowLeft: TemplateRef<void>;
  @ContentChild('templateArrowRight', { static: true }) templateArrowRight: TemplateRef<void>;

  availableItems: ListSelection<T>;
  selectedItems: ListSelection<T>;
  dragging = false;

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('items' in changes && !_.isEqual(changes.items.currentValue, changes.items.previousValue)) {
      this.initItems();
    }
  }

  ngOnInit(): void {
    this.initItems();
  }

  initItems(): void {
    this.availableItems = new ListSelectionImpl(
      difference(this.items, this._selectedItems, this.key),
    );
    this.selectedItems = new ListSelectionImpl(this._selectedItems);
  }

  select(): void {
    const { from, to } = transfer(this.availableItems, this.selectedItems);
    this.availableItems = from;
    this.selectedItems = to;
    this.selectedItemsChange.emit(this.selectedItems.totalItems);
  }

  return(): void {
    const { from, to } = transfer(this.selectedItems, this.availableItems);
    this.selectedItems = from;
    this.availableItems = to;
    this.selectedItemsChange.emit(this.selectedItems.totalItems);
  }

  drop(event: CdkDragDrop<T[]>): void {
    if (event.previousContainer === event.container) {
      const chosenItems = document.querySelectorAll('.chosen');
      chosenItems.forEach((item) => {
        if (item.classList) {
          item.classList.remove('cdk-drag-placeholder');
        }
      });
      if (document.querySelector('#counter')) {
        document.querySelector('#counter').remove();
      }
    } else if (event.previousContainer.id === 'user-list') {
      this.select();
    } else {
      this.return();
    }
    this.dragging = false;
  }

  onDragStart(event: CdkDragStart<string[]>): void {
    const div = document.querySelector(`#${event.source.dropContainer.id}`);
    this.dragging = true;
    const b = div.querySelector('.draggable:active');
    const chosenItems = div.querySelectorAll('.chosen');
    if (chosenItems.length > 0 && b) {
      b.insertAdjacentHTML('afterbegin',
        `<div id="counter" style="background: red; color: white; border-radius: 50%;
        width:20px; height: 20px; text-align: center; font-weight: 700;
        position: relative; top: 5px; left: 5px;">
        ${chosenItems.length.toString()}</div>`);
    }
    chosenItems.forEach((item) => {
      item.classList.add('cdk-drag-placeholder');
    });
  }
}
