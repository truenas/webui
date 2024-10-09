import {
  CdkDragDrop, CdkDragStart, CdkDropList, CdkDrag,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ContentChild, Input, OnChanges, OnInit, output, TemplateRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import { differenceBy, isEqual } from 'lodash-es';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ListSelection } from 'app/modules/lists/dual-list/models';
import { TestDirective } from 'app/modules/test-id/test.directive';

const transfer = <T>(from: ListSelection<T>, to: ListSelection<T>): {
  from: ListSelection<T>; to: ListSelection<T>;
} => ({
    from: new ListSelection(
      from.totalItems.filter((item) => !from.isSelected(item)),
    ),
    to: new ListSelection([...from.selectedItems, ...to.totalItems]),
  });

@Component({
  selector: 'ix-dual-listbox',
  styleUrls: ['./dual-list.component.scss'],
  templateUrl: 'dual-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkDropList,
    MatList,
    MatListItem,
    CdkDrag,
    NgTemplateOutlet,
    MatButton,
    TestDirective,
    IxIconComponent,
  ],
})
export class DualListboxComponent<T extends { id: string | number }> implements OnInit, OnChanges {
  @Input() key: keyof T = 'id';
  @Input() items: T[];
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('selectedItems') _selectedItems: T[];
  @Input() minHeight = '200px';
  @Input() maxHeight = '300px';
  @Input() title1: string;
  @Input() title2: string;

  readonly selectedItemsChange = output<T[]>();

  @ContentChild('templateItem', { static: true }) templateItem: TemplateRef<{ $implicit: T }>;
  @ContentChild('templateArrowLeft', { static: true }) templateArrowLeft: TemplateRef<void>;
  @ContentChild('templateArrowRight', { static: true }) templateArrowRight: TemplateRef<void>;

  availableItems: ListSelection<T>;
  selectedItems: ListSelection<T>;
  dragging = false;

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('items' in changes && !isEqual(changes.items.currentValue, changes.items.previousValue)) {
      this.initItems();
    }
  }

  ngOnInit(): void {
    this.initItems();
  }

  initItems(): void {
    this.availableItems = new ListSelection(
      differenceBy(this.items, this._selectedItems, this.key as string),
    );
    this.selectedItems = new ListSelection(this._selectedItems);
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
      b.insertAdjacentHTML(
        'afterbegin',
        `<div id="counter" style="background: red; color: white; border-radius: 50%;
        width:20px; height: 20px; text-align: center; font-weight: 700;
        position: relative; top: 5px; left: 5px;">
        ${chosenItems.length.toString()}</div>`,
      );
    }
    chosenItems.forEach((item) => {
      item.classList.add('cdk-drag-placeholder');
    });
  }

  // TODO: Come up with a way to track ids
  protected trackIdentity(item: T): T {
    return item;
  }
}
