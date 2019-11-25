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
  @Input() title1: string;
  @Input() title2: string;

  @ContentChild('templateItem', { static: true}) templateItem: TemplateRef<any>;
  @ContentChild('templateArrowLeft', { static: true}) templateArrowLeft: TemplateRef<any>;
  @ContentChild('templateArrowRight', { static: true}) templateArrowRight: TemplateRef<any>;

  availableItems: ListSelection;
  selectedItems: ListSelection;

  ngOnInit() {
    this.availableItems = new ListSelectionImpl(
      difference(this.items, this._selectedItems, this.key)
    );
    this.selectedItems = new ListSelectionImpl(this._selectedItems);
  }

  select() {
    const { from, to } = transfer(this.availableItems, this.selectedItems);
    this.availableItems = from;
    this.selectedItems = to;
    this.selectedItemsChange.emit(this.selectedItems.totalItems);
  }

  return() {
    const { from, to } = transfer(this.selectedItems, this.availableItems);
    this.selectedItems = from;
    this.availableItems = to;
    this.selectedItemsChange.emit(this.selectedItems.totalItems);
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
