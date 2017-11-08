import {Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef} from '@angular/core';
import {difference, ListSelection, ListSelectionImpl} from './models';

@Component({
  selector: 'app-dual-listbox',
  styleUrls: ['./dual-list.component.css'],
  templateUrl: 'dual-list.component.html'
})
export class DualListboxComponent implements OnInit {

  @Input() key = 'id';
  @Input() items: any[];
  @Input('selectedItems') _selectedItems: any[];
  @Output() selectedItemsChange = new EventEmitter<Object>();


  @Input() minHeight = '200px';
  @Input() maxHeight = '300px';

  @ContentChild('templateItem') templateItem: TemplateRef<any>;
  @ContentChild('templateArrowLeft') templateArrowLeft: TemplateRef<any>;
  @ContentChild('templateArrowRight') templateArrowRight: TemplateRef<any>;

  availableItems: ListSelection;
  selectedItems: ListSelection;

  ngOnInit() {
    this.availableItems = new ListSelectionImpl(
      difference(this.items, this._selectedItems, this.key)
    );
    this.selectedItems = new ListSelectionImpl(this._selectedItems);
  }

  select() {
    console.log('selected items called');
    const { from, to } = transfer(this.availableItems, this.selectedItems);
    this.availableItems = from;
    this.selectedItems = to;
    this.selectedItemsChange.emit({action: 'add', items: this.selectedItems.totalItems});
  }

  return() {
    console.log('return items called');
    const { from, to } = transfer(this.selectedItems, this.availableItems);
    this.selectedItems = from;
    this.availableItems = to;
    this.selectedItemsChange.emit({action: 'remove', items: this.selectedItems.totalItems});
  }
}


const transfer = (from: ListSelection, to: ListSelection) => {
  return {
    from: new ListSelectionImpl(
      from.totalItems.filter(x => !from.isSelected(x))
    ),
    to: new ListSelectionImpl([...from.selectedItems, ...to.totalItems])
  };
};
