import { tween } from 'popmotion';
import { debounceTime } from 'rxjs/operators';
import { CoreService } from '../services/core-service/core.service';
import { DisplayObject } from './display-object';

/*
   * Layout Object: A base class for
   * managing collections of Display Objects
   * */

export interface ElementDimensions {
  width: number;
  height: number;
}

interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class LayoutObject {
  collection: any = {}; // Try an object literal to see if it performs any better
  private orderedCollection: string[]; // collection of displayObject IDs
  private screenPositions: BoundingBox[];
  private messageBus: CoreService;
  private reorderedCollection: string[]; // was DisplayObjects
  private container: HTMLElement;
  private margin = 0;
  private columns = 1;
  private grid = false;
  private _id: string;
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    if (this._id) {
      console.warn('id has already been set');
    } else {
      this._id = value;
    }
  }

  arrangement = ' ';
  private _containerSelector: string;
  get containerSelector(): string {
    return this._containerSelector;
  }
  set containerSelector(value: string) {
    this.container = document.querySelector(value);
    this._containerSelector = value;
  }

  intro: string;
  updateMessage: string;
  itemSize: ElementDimensions;
  contentSize: ElementDimensions;

  constructor(selector: string, messageBus: CoreService) {
    this.collection = {};
    this.containerSelector = selector;
    this.margin = 15;
    this.columns = 1; // Vertical list is default
    this.messageBus = messageBus;
    this.screenPositions = [];
  }

  initialize(): void {
    this.orderedCollection = Object.keys(this.collection);
    this.orderedCollection.forEach((item) => {
      this.configureCollectionItem(this.collection[item]);
    });
    this.createLayoutFromArrangement('Grid');
    this.updateCollectionPositions(0, this.orderedCollection.length - 1);
  }

  insert(item: DisplayObject): void { // Add new item to collection and regenerate screenPositions
    console.warn(this.reorderedCollection);
    // update collection

    this.configureCollectionItem(item);
    // this.collection.push(item);
    this.collection[item.id] = item;

    // create screen positions based on new collection
    this.createLayoutFromArrangement(this.arrangement);
    // Move all items to new screenpositions
    this.updateCollectionPositions(0, Object.keys(this.collection).length - 1);
  }

  private remove(item: DisplayObject): void { // Remove item from collection and regenerate screenPositions
    // update collection
    delete this.collection[item.id];

    // create screen positions based on new collection
    this.createLayoutFromArrangement(this.arrangement);
    // Move all items to new screenpositions
    this.updateCollectionPositions(0, this.collection.length - 1);
  }

  private createLayoutFromArrangement(arrangement?: string, constrain?: boolean): void {
    if (!constrain) {
      constrain = false;
    }
    this.arrangement = arrangement;
    switch (arrangement) {
      case 'VerticalList':
        this.createListVertical(constrain);
        break;
      case 'HorizontalList':
        this.createListHorizontal(constrain);
        break;
      case 'Grid':
        this.createGrid();
        break;
      default:
        // Defaults to vertical list
        this.createListVertical(constrain);
        break;
    }
  }

  /**
   * Move an existing DisplayObject to a new position.
   */
  moveToScreenPosition(dragTarget: DisplayObject, index: number): void {
    const startX = dragTarget.x;
    const startY = dragTarget.y;
    const newX = this.screenPositions[index].left;
    const newY = this.screenPositions[index].top;

    if (startX == newX && startY == newY) {
      return;
    }
    tween({
      from: { x: startX, y: startY },
      to: { x: newX, y: newY },
      duration: 250,
      flip: 0,
    }).start({
      update: (v: { x: number; y: number }) => {
        dragTarget.target.set(v);
      },
      complete: () => {
        dragTarget.x = newX;
        dragTarget.y = newY;
      },
    });

    // Make sure dragTarget's internal anchorXY gets updated
    /* setTimeout(() => {
         dragTarget.x = newX;
         dragTarget.y = newY
          console.log("x")
       }, 20) */
  }

  /* updateStaticPositions(){
      this.screenPositions.forEach((item, index){
        this.collection[index].x = item.left;
        this.collection[index].y = item.top;
      })
    } */

  beginInteractiveMovement(displayObject: DisplayObject): void { // Do collision detection and reorder collection list
    const dragTarget = displayObject;
    let latestPosition = -1;
    const maxIndex = Object.keys(this.collection).length - 1;

    dragTarget.inputStream$.pipe(debounceTime(15)).subscribe(() => {
      const pad = this.margin / 2;
      /* const dragBox = {
          top: evt.y - pad,
          bottom: evt.y + pad,
          left:evt.x - pad,
          right: evt.x + pad
         } */
      const dragBox = {
        top: dragTarget.y + (dragTarget.height / 2) - pad,
        bottom: dragTarget.y + (dragTarget.height / 2) + pad,
        left: dragTarget.x + (dragTarget.width / 2) - pad,
        right: dragTarget.x + (dragTarget.width / 2) + pad,
      };

      const newCollection = Object.assign(this.orderedCollection, []);

      // Run collision detection against the collection
      this.screenPositions.forEach((item, index) => {
        const test = this.detectBoxCollision(dragBox, item);
        if (test) {
          if (latestPosition !== index) {
            let direction = ' ';
            if (latestPosition > index) {
              direction = 'up';
            } else if (index > latestPosition) {
              direction = 'down';
            }

            latestPosition = index;

            const dragTargetIndex = Number(newCollection.indexOf(dragTarget.id));
            newCollection.splice(dragTargetIndex, 1);
            newCollection.splice(index, 0, dragTarget.id);

            if (direction === 'up') {
              this.updateCollectionPositions(index, maxIndex);
            } else if (direction === 'down') {
              this.updateCollectionPositions(dragTargetIndex, index);
            }

            this.updateInteractiveMovement(newCollection);
          }
        }
      });
    });
  }

  private updateInteractiveMovement(newCollection: string[]): void { // React to new order while in dragging
    this.reorderedCollection = newCollection;
  }

  /**
   * Complete and cleanup after item has been dropped to new location.
   */
  endInteractiveMovement(dragTarget: DisplayObject): void {
    const index = this.reorderedCollection.indexOf(dragTarget.id);
    this.moveToScreenPosition(dragTarget, index);
    this.orderedCollection = this.reorderedCollection;
    this.reorderedCollection = [];
  }

  private cancelInteractiveMovement(): void { // Reset to original layout
    this.reorderedCollection = null;
    this.orderedCollection.forEach((item, index) => {
      const dragTarget = this.collection[index];
      this.moveToScreenPosition(dragTarget, index);
    });
  }

  private createGrid(): void {
    this.grid = true; // Should be deprecated in favor of this.arrangement
    this.createScreenPositions(this.orderedCollection.length, this.orderedCollection.length, this.margin, true);
  }

  private createListHorizontal(constrain?: boolean): void {
    if (constrain) {
      this.collection.forEach((item: any) => {
        item.constrainY = true;
      });
    }
    this.createScreenPositions(this.orderedCollection.length, this.orderedCollection.length, this.margin);
  }

  private createListVertical(constrain?: boolean): void {
    if (constrain) {
      this.collection.forEach((item: any) => {
        item.constrainX = true;
      });
    }
    this.createScreenPositions(1, this.orderedCollection.length, this.margin);
  }

  private updateCollectionPositions(startIndex: number, endIndex: number): void {
    for (let i = startIndex; i <= endIndex; i++) {
      const el = this.collection[this.orderedCollection[i]];

      if (el.hasFocus) { continue; }
      this.moveToScreenPosition(el, i);
    }
  }

  private createScreenPositions(columns: number, total: number, margin: number, dynamic?: boolean): void {
    if (this.screenPositions.length > 0) {
      this.screenPositions = [];
    }
    this.columns = columns;
    this.margin = margin;
    if (dynamic && this.itemSize) {
      columns = Math.round(this.calcRows(this.itemSize.width, margin)); // Dynamically how many can fit screen
    }
    // Create an arrangement of elements
    for (let i = 0; i < total; i++) {
      const el = this.collection[this.orderedCollection[i]];
      if (this.itemSize) {
        el.width = this.itemSize.width;
        el.height = this.itemSize.height;
      }

      const positionX = (i % columns) * (el.width + margin * 2);
      const positionY = Math.floor(i / columns) * (el.height + margin * 2);

      // Create static source of truth for positions
      /* let box: BoundingBox = {
          top: el.y,
          bottom: el.y + el.height,
          left: el.x,
          right: el.x + el.width
         } */
      const box: BoundingBox = {
        top: positionY,
        bottom: positionY + el.height,
        left: positionX,
        right: positionX + el.width,
      };
      this.screenPositions.push(box);
    }
  }

  private configureCollectionItem(item: DisplayObject): void {
    // misc. element options
    item.resizeable = false;
    item.moveable = true;
    item.elevateOnSelect = true;
  }

  private calcRows(elWidth: number, marg: number): number {
    let containerDimensions;
    if (this.container) {
      containerDimensions = this.container.getBoundingClientRect();
    } /* else {
           let body = document.querySelector('body');
           containerDimensions = body.parentNode.getBoundingClientRect();
         } */
    return containerDimensions.width / (elWidth + marg * 2);
  }

  private detectBoxCollision(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      ((a.bottom) < (b.top))
           || (a.top > (b.bottom))
           || ((a.right) < b.left)
           || (a.left > (b.right))
    );
  }
}
