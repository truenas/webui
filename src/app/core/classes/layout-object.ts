import { DisplayObject } from './display-object';
import { CoreService, CoreEvent } from '../services/core.service';
import { timer } from 'rxjs/observable/timer';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { 
  tween, 
  styler, 
  listen, 
  pointer, 
  value,
  decay,
  spring,
  physics,
  //velocity, 
  multicast,
  action,
  transform,
  //transformMap,
  //clamp
  } from '../popmotion';

  const transformMap = transform.transformMap;
  const { clamp } = transform


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
     right:number;
     bottom:number;
     left:number;
   }

   export class LayoutObject {

     //public collection: DisplayObject[]; // rename to displayList?
     public collection: any; // Try an object literal to see if it performs any better
     private orderedCollection: string[]; // collection of displayObject IDs
     private screenPositions: BoundingBox[];
     private messageBus: CoreService;
     private reorderedCollection: string[]; // was DisplayObjects
     private container: HTMLElement;
     private margin:number = 0;
     private columns:number = 1;
     private grid:boolean = false;
     private _id: string;
     get id(){
       return this._id;
     }

     set id(value:string){
       if(this._id){
         console.warn("id has already been set");
       } else {
         this._id = value;
       }
     }

     public arrangement:string = ' ';
     private _containerSelector: string;
     get containerSelector(){
       return this._containerSelector;
     }
     set containerSelector(value:string){
       this.container = (<any>document).querySelector(value);
       this._containerSelector = value;
     }

     public intro: string;
     public outro: string;
     public updateMessage: string;
     public updateMessageData: any;
     public itemSize: ElementDimensions;
     public contentSize: ElementDimensions;


     constructor(selector:string, messageBus:CoreService){
       //this.collection = []; //start with empty collection; ViewController creates the Layout but IMS creates the displayObjects
       this.collection = {};
       this.containerSelector = selector;
       this.margin = 15;
       this.columns = 1; // Vertical list is default
       this.messageBus = messageBus;
       this.screenPositions = [];
     }

     public initialize(layoutStyle?:string){


       /*
       //Test animation service
       let animationTarget:DisplayObject;
       //Radiate
       setTimeout(() => {
         animationTarget = this.collection[10];
         this.test("Radiate", "Start", animationTarget);
         
       },2000);

       setTimeout(() => {
         this.test("Radiate", "Stop", animationTarget);
         
       },10000);

       //Bounce
       setTimeout(() => {
         animationTarget = this.collection[10];
         this.test("Bounce", "Start", animationTarget);
       },10000);

       setTimeout(() => {
         this.test("Bounce", "Stop", animationTarget);
         console.log("")
       },19000);

       //ElasticScale
       setTimeout(() => {
         animationTarget = this.collection[10];
         this.test("ElasticScale", "Out", animationTarget);
       },20000);

       setTimeout(() => {
         this.test("ElasticScale", "In", animationTarget);
         console.log("")
       },22000);

       //Fade
       setTimeout(() => {
         animationTarget = this.collection[10];
         this.test("Fade", "Out", animationTarget);
       },24000);

       setTimeout(() => {
         this.test("Fade", "In", animationTarget);
         console.log("")
       },27000);
        */

       this.orderedCollection = Object.keys(this.collection);
       //const collection = Object.entries(this.collection);
       //collection.map((value:DisplayObject) => {
       this.orderedCollection.map((item) => {
         this.configureCollectionItem(this.collection[item]);
       });
       this.createLayoutFromArrangement("Grid");
       this.updateCollectionPositions(0, this.orderedCollection.length - 1);

     }

     private test(animation:string, state:string, animationTarget:DisplayObject){

       this.messageBus.emit({
         name:"Animate", 
         data:{
           animationTarget:animationTarget,
           animation:animation,
           finishState: state
         }, 
         sender:this
       }) 
     }

     public insert(item:DisplayObject, at?:number){// Add new item to collection and regenerate screenPositions
       console.log("Inserting DisplayObject into layout");
       console.warn(this.reorderedCollection);
       // update collection
       /*if(this.reorderedCollection && this.reorderedCollection.length > 0){ 
        this.reorderedCollection.push(item);
       } else {
         this.collection.push(item);
       }*/

       this.configureCollectionItem(item);
       //this.collection.push(item);
       this.collection[item.id] = item;

       // create screen positions based on new collection
       this.createLayoutFromArrangement(this.arrangement);
       // Move all items to new screenpositions
       this.updateCollectionPositions(0, Object.keys(this.collection).length - 1);
       /*console.log(this.screenPositions);
        console.log(item.x + " " + item.y)
        console.log(item.id)*/

     }

     private remove(item:DisplayObject){// Remove item from collection and regenerate screenPositions
       // update collection
       delete this.collection[item.id];

       // create screen positions based on new collection
       this.createLayoutFromArrangement(this.arrangement);
       // Move all items to new screenpositions
       this.updateCollectionPositions(0, this.collection.length - 1);
     }

     private createLayoutFromArrangement(arrangement?: string, constrain?:boolean){
       if(!constrain){
         constrain = false;
       }
       this.arrangement = arrangement;
       switch(arrangement){
       case "VerticalList":
         this.createListVertical(constrain);
         break;
       case "HorizontalList":
         this.createListHorizontal(constrain);
         break;
       case "Grid":
         this.createGrid();
         break;
       default:
         // Defaults to vertical list
         this.createListVertical(constrain);
         break;
       }
     }

     public moveToScreenPosition(dragTarget:DisplayObject, index:number, debug?:boolean){ // Move an existing DisplayObject to a new position.
       let startX = dragTarget.x;
       let startY = dragTarget.y;
       let distance = 0; 
       let newX = this.screenPositions[index].left;
       let newY = this.screenPositions[index].top;
       //console.log(dragTarget.id);
       
       if(startX == newX && startY == newY){
        //console.log(index)
        return;
       }
       if(debug) console.log("pretween")
       tween({
         from: {x:startX, y:startY},
         to: { x: newX, y: newY }, 
         duration: 250,
         flip: 0
       }).start({
         update: (v) => {
           if(debug)console.log(v);
           dragTarget.target.set(v);
         },
         complete: () => {
         dragTarget.x = newX; 
         dragTarget.y = newY
         if(debug)console.log("done");
         }
       })

       if(debug) console.log("posttween")
       // Make sure dragTarget's internal anchorXY gets updated
       /*setTimeout(() => {
         dragTarget.x = newX; 
         dragTarget.y = newY
          console.log("x")
       }, 20) */
     }

    /*updateStaticPositions(){
      this.screenPositions.forEach((item, index){
        this.collection[index].x = item.left;
        this.collection[index].y = item.top;
      })
    }*/
    

     public beginInteractiveMovement(displayObject:DisplayObject){ // Do collision detection and reorder collection list
       let dragTarget = displayObject;
       //let originalDragTargetIndex = this.collection.indexOf(dragTarget);
       let originalDragTargetIndex = this.orderedCollection.indexOf(dragTarget.id);
       let latestPosition: number = -1;
       let maxIndex = Object.keys(this.collection).length - 1;

       dragTarget.inputStream
         .debounceTime(15)
         .subscribe((evt) => {
         //console.log(evt);
         const pad = this.margin / 2;
         /*const dragBox = {
          top: evt.y - pad,
          bottom: evt.y + pad,
          left:evt.x - pad,
          right: evt.x + pad
         }*/
         const dragBox = {
           top: dragTarget.y + (dragTarget.height / 2) - pad,
           bottom: dragTarget.y + (dragTarget.height / 2) + pad,
           left:dragTarget.x + (dragTarget.width / 2) - pad,
           right: dragTarget.x + (dragTarget.width / 2) + pad
         }

         let cache: number = -1;
         //let newCollection = Object.assign(this.collection , []);
         let newCollection = Object.assign(this.orderedCollection , []);

         // Run collision detection against the collection
         this.screenPositions.forEach((item, index) => {  
           let test = this.detectBoxCollision(dragBox, item);
           if(test){
             if(latestPosition !== index){
               let direction:string = ' ';
               if(latestPosition > index){
                 direction = 'up';
               } else if(index > latestPosition) {
                 direction = 'down';
               }

               latestPosition = index;
               cache = index;
               //console.log("Position changed to " + index);

               //let dragTargetIndex:number = Number(newCollection.indexOf(dragTarget));
               let dragTargetIndex:number = Number(newCollection.indexOf(dragTarget.id));
               newCollection.splice(dragTargetIndex, 1);
               newCollection.splice(index, 0, dragTarget.id );

               if(direction == 'up'){
                 this.updateCollectionPositions(index,maxIndex, dragTarget)
               } else if(direction == 'down'){
                 this.updateCollectionPositions(dragTargetIndex , index, dragTarget);
               }

               this.updateInteractiveMovement(dragTarget,newCollection, index);
             }
             return ;
           }
         })
       });
     }

     private updateInteractiveMovement(dragTarget, newCollection, index){ // React to new order while in dragging
       this.reorderedCollection = newCollection;
     }

     public endInteractiveMovement(dragTarget:DisplayObject){ // Complete and cleanup after item has been dropped to new location
       console.log("Ending Interactive Movement in layout")
       let index = this.reorderedCollection.indexOf(dragTarget.id);
       this.moveToScreenPosition(dragTarget, index);
       this.orderedCollection = this.reorderedCollection;
       this.reorderedCollection = [];
       //this.updateStaticPositions();
       }

     private cancelInteractiveMovement(){ // Reset to original layout 
       this.reorderedCollection = null;
       this.orderedCollection.forEach((item, index) => {
         let dragTarget = this.collection[index];
         this.moveToScreenPosition(dragTarget, index);
       })
     }

     private createGrid(){
       this.grid = true; // Should be deprecated in favor of this.arrangement
       this.createScreenPositions(this.orderedCollection.length, this.orderedCollection.length, this.margin, true);
       //this.updateCollectionPositions(0, this.collection.length - 1);
       }

     private createListHorizontal(constrain?: boolean){
       if(constrain){
         this.collection.forEach((item) => {
           item.constrainY = true;
         })
       }
       this.createScreenPositions(this.orderedCollection.length, this.orderedCollection.length, this.margin)
       //this.updateCollectionPositions(0, this.collection.length - 1);
       }

     private createListVertical(constrain?: boolean){
       if(constrain){
         this.collection.forEach((item) => {
           item.constrainX = true;
         });
       }
       this.createScreenPositions(1, this.orderedCollection.length ,this.margin );
       //this.updateCollectionPositions(0, this.collection.length - 1);
       }

     private updateCollectionPositions( startIndex:number, endIndex:number, dragTarget?:DisplayObject){ 

       /*console.log("Collection = " + this.collection.length);
       if(this.reorderedCollection && this.reorderedCollection.length > 0){
        console.log("Reordered coll. = " + this.reorderedCollection.length)
       }*/

       for(let i = startIndex; i <= endIndex; i++){
         let el = this.collection[this.orderedCollection[i]];
         
         if(el.hasFocus){ continue; }
         //if(dragTarget && el == dragTarget){ continue; }
         this.moveToScreenPosition(el, i);
       }
     }

     private createScreenPositions(columns:number, total:number, margin:number, dynamic?: boolean){
       //console.log("Creating Rows...")
       if(this.screenPositions.length > 0){
         this.screenPositions = [];
       }
       this.columns = columns;
       this.margin = margin;
       if(dynamic && this.itemSize){
         columns = Math.round(this.calcRows(this.itemSize.width, margin)); // Dynamically how many can fit screen
       }
       // Create an arrangement of elements
       for (let i = 0; i < total; i++) {
         let el = this.collection[this.orderedCollection[i]];
         if(this.itemSize){ 
           el.width = this.itemSize.width;
           el.height = this.itemSize.height;
         }
         //console.log(el.width + margin);


         //el.x = (i % columns) * (el.width + margin * 2);
         //el.y = Math.floor(i / columns) * (el.height + margin * 2);
         const positionX = (i % columns) * (el.width + margin * 2);
         const positionY = Math.floor(i / columns) * (el.height + margin * 2);


         // Create static source of truth for positions
         /*let box: BoundingBox = {
          top: el.y,
          bottom: el.y + el.height,
          left: el.x,
          right: el.x + el.width
         }*/
         let box: BoundingBox = {
           top: positionY,
           bottom: positionY + el.height,
           left: positionX,
           right: positionX + el.width
         }
         this.screenPositions.push(box);
       }
     }

       private configureCollectionItem(item:DisplayObject){
         // misc. element options
         //item.constrainX = true;
         item.resizeable = false;
         item.moveable = true;
         item.elevateOnSelect = true;
       }

       private calcRows(elWidth, marg){
         let containerDimensions;
         if(this.container){
           containerDimensions = this.container.getBoundingClientRect();
         } /*else {
           let body = document.querySelector('body');
           containerDimensions = body.parentNode.getBoundingClientRect();
         }*/
         return containerDimensions.width / (elWidth + marg * 2);
       }

       private detectCollisionByXY(a, b){
         // a = dragTarget , b = target
         let test: boolean = false;
         const range = 16; // margin of error
           if(a.x < b.x + range && a.x > b.x - range && a.y < b.y + range && a.y > b.y - range){
             test = true;
           }
           return test;
       }

       private detectCollision(a, b) {
         return !(
           ((a.y + a.height) < (b.y)) ||
           (a.y > (b.y + b.height)) ||
           ((a.x + a.width) < b.x) ||
           (a.x > (b.x + b.width))
         );
       }

       private detectBoxCollision(a, b) {
         return !(
           ((a.bottom) < (b.top)) ||
           (a.top > (b.bottom)) ||
           ((a.right) < b.left) ||
           (a.left > (b.right))
         );
       }
     }

