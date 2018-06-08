import { Injectable } from '@angular/core';

/**
 * This class is used for getting a resize event like window's resize.. but 
 * from Div elements.  I had this copied and pasted 4x.. Got old.. So put 
 * it in a service.
 * 
 */
@Injectable()
export class ErdService {

  constructor() {}

  /**
   * This method would typically be called in a component's 
   * ngAfterViewInit() implementation.
   * 
   * @param elementId - Name of element on view to attach to.
   */
  public attachResizeEventToElement(elementId: string) {
    setTimeout(()=>{

      let erd: any = null;

      // This invokes the element-resize-detector js library under node_modules
      // It listens to element level size change events (even when the global window
      // Doesn't Resize.)  This lets you even off of card and element and div level
      // size rechange events... As a result of responive, menu moving, etc...
      if (window.hasOwnProperty('elementResizeDetectorMaker')) {
        erd = window['elementResizeDetectorMaker'].call();
      }

      const elementAny = document.getElementById(elementId);
      if( typeof(erd) !== "undefined" && erd !== null &&
            typeof(elementAny) !== "undefined" && elementAny !== null ) {
        erd.listenTo(elementAny, (element) => {
          (<any>window).dispatchEvent(new Event('resize'));
        });
      }
    });
  }
}
