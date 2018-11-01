import { UUID } from 'angular2-uuid';

export abstract class iXObject {

  readonly id: string;
  private _element: HTMLElement;

  constructor() {
    this.id = "id-" + UUID.UUID();
  }

  get element(){
    return this._element
  }

  set element(el:HTMLElement){
    //This can be set only once.
    if(!this._element){
      this._element = el;
    } else {
      console.warn("element has already been set");
    }
  }
}
