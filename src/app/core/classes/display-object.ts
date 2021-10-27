import {
  tween,
  styler,
  listen,
  pointer,
  value,
  transform,
} from 'popmotion';
import { PointerProps } from 'popmotion/lib/input/pointer/types';
import { ValueReaction } from 'popmotion/lib/reactions/value';
import { ColdSubscription } from 'popmotion/src/action/types';
import { ValueMap } from 'popmotion/src/reactions/value';
import { Subject } from 'rxjs';
import { Styler } from 'stylefire/lib/styler/types';
import { CoreService } from '../services/core-service/core.service';

const transformMap = transform.transformMap;

/*
 * Display Object is a wrapper around DOM elements
 * to make them interactive (moveable and resizable)
 * This should mainly be used on top level elements
 * like cards or in Drag and Drop scenarios. They are
 * conceptually similar to the Window metaphor in X11
 * and other native graphical environments.
 * */

// For testing
export const ResizeHandles = {
  template: `
      <div class="resize-handle-top"></div>
      <div class="resize-handle-right"></div>
      <div class="resize-handle-bottom"></div>
      <div class="resize-handle-left"></div>
   `,
  style: `
   `,
};

export class DisplayObject {
  private messageBus: CoreService;
  private _hasFocus = false;
  private isDragging = false;
  element: Styler;
  rawElement: Element;
  private _interactive: boolean;
  private _moveable: boolean;
  private _resizeable: boolean;
  target: Styler;
  rawTarget: HTMLElement;
  private pointerTracker: ColdSubscription;
  private focus: ColdSubscription;
  private moveHandle: Element;
  private resizeHandleTop: Element;
  private resizeHandleRight: Element;
  private resizeHandleBottom: Element;
  private resizeHandleLeft: Element;

  private _id: string;
  private _x: number; // ?
  private _y: number; // ?
  private _width: number; // ?
  private _height: number; // ?

  private anchorXY: ValueReaction;
  private anchorW: ValueReaction;
  private anchorH: ValueReaction;
  private boundary: number;
  private reservedTop = 38;// 36 + 2 to avoid panel shadow
  private broadcastInputPosition = false;

  anchored: boolean;

  anchor: number;
  constrainX: boolean;
  constrainY: boolean;
  updateStream$: Subject<any>;
  inputStream$: Subject<any>;
  elevateOnSelect: boolean;

  constructor(el: Element, messageBus: CoreService, moveHandle?: Element) {
    if (moveHandle) {
      this.moveHandle = moveHandle;
    }

    // this.id = UUID.UUID();
    this.updateStream$ = new Subject();
    this.inputStream$ = new Subject();
    this.messageBus = messageBus;
    this.rawElement = el; // result of document.querySelector(...)
    this.element = styler(el, {});
    this.interactive = true;
    this.anchorXY = value({ x: 0, y: 0 }, this.target.set);
    this.anchorW = value({ width: (this.target as any).offsetWidth }, this.target.set);
    this.anchorH = value({ height: (this.target as any).offsetHeight }, this.target.set);
    this.anchored = false;
    this.reservedTop = 0; // 38;// 36 + 2 to avoid panel shadow
    this.moveable = false;
    this.resizeable = false;
    this.elevateOnSelect = false;
  }

  get id(): string {
    return this._id;
  }

  set id(value: string) {
    if (this._id) {
      console.warn('DisplayObject id has already been set');
    } else {
      this._id = value;
    }
  }

  get x(): number {
    return this.target.get('x');
  }

  set x(v: number) {
    const updatedXY = value({ x: v, y: this.y }, this.target.set);
    this.anchorXY = updatedXY;
    this._x = v;
    // this.target.set({'x': value});
  }

  get y(): number {
    return this.target.get('y');
  }

  set y(v: number) {
    const updatedXY = value({ x: this.x, y: v }, this.target.set);
    this.anchorXY = updatedXY;
    this._y = v;
    // this.target.set({'y': value});
  }

  get width(): number {
    return this.target.get('width');
  }

  set width(value: number) {
    // let element = styler(this.rawElement, {});
    // element.set({'width': value})
    this.target.set({ width: value });
    this._width = value;
  }

  get height(): number {
    return this.target.get('height');
  }

  set height(value: number) {
    // let element = styler(this.rawElement, {});
    // element.set({'height': value})
    this.target.set({ height: value });
    this._height = value;
  }

  get hasFocus(): boolean {
    return this._hasFocus;
  }

  set hasFocus(value) {
    this._hasFocus = value;
    if (value) {
      this.elevate(value);
    } else if (!value) {
      tween({
        from: this.target.get('z-index'),
        to: { 'z-index': 1 },
        duration: 100,
        flip: 0,
      }).start(this.target.set);
    }
  }

  get interactive(): boolean {
    return this._interactive;
  }

  set interactive(value: boolean) {
    // listen(document, 'mouseup touchend').while((v) => this._interactive).start(this.stop.bind(this));
    if (value) {
      this.createTarget();
    } else if (!value) {
      this.destroyTarget();
    }
  }

  private createTarget(): void {
    const parent = this.rawElement.parentNode;
    const wrapper = document.createElement('div');
    // let handles = document.createElement(ResizeHandles.template);
    wrapper.innerHTML = ResizeHandles.template;
    wrapper.classList.add('shadow');
    parent.insertBefore(wrapper, this.rawElement);
    wrapper.appendChild(this.rawElement);
    this.rawTarget = wrapper;
    this.target = styler(wrapper, {});
    // this.container = wrapper;
    // Create Resize Handles
    // fragment.appendChild(handles);
    // parent.(fragment);
    this.id = this.rawElement.id;
  }

  private destroyTarget(): void {
    const originalParent = this.rawElement.parentNode.parentNode;
    const wrapper = this.rawElement.parentNode;
    originalParent.appendChild(this.rawElement);
    originalParent.removeChild(wrapper);
  }

  get moveable(): boolean {
    return this._moveable;
  }

  set moveable(value: boolean) {
    if (value) {
      // if(!this._interactive){this._interactive = true;}
      if (!this.moveHandle) {
        this.moveHandle = this.rawElement.parentNode as Element;
      }
      listen(this.moveHandle, 'mousedown touchstart').while(() => this._moveable).start(this.start.bind(this));
    }

    this._moveable = value;
  }

  get resizeable(): boolean {
    return this._resizeable;
  }

  set resizeable(value: boolean) {
    if (value) {
      this.rawTarget.classList.add('resizeable');
      // if(!this._interactive){this._interactive = true;}
      this.resizeHandleTop = this.rawElement.parentNode.querySelector('.resize-handle-top');
      this.resizeHandleBottom = this.rawElement.parentNode.querySelector('.resize-handle-bottom');
      this.resizeHandleLeft = this.rawElement.parentNode.querySelector('.resize-handle-left');
      this.resizeHandleRight = this.rawElement.parentNode.querySelector('.resize-handle-right');

      listen(this.resizeHandleTop, 'mousedown touchstart').while(() => this._resizeable).start(this.startResizeTop.bind(this));
      listen(this.resizeHandleBottom, 'mousedown touchstart').while(() => this._resizeable).start(this.startResizeBottom.bind(this));
      listen(this.resizeHandleLeft, 'mousedown touchstart').while(() => this._resizeable).start(this.startResizeLeft.bind(this));
      listen(this.resizeHandleRight, 'mousedown touchstart').while(() => this._resizeable).start(this.startResizeRight.bind(this));

      listen(document, 'mouseup touchend').while(() => this._moveable).start(this.stopResize.bind(this));
    } else if (!value) {
      this.rawTarget.classList.remove('resizeable');
    }

    this._resizeable = value;
  }

  // Move/Drag methods
  start(): void {
    this.messageBus.emit({ name: 'DisplayObjectSelected', sender: this });
    this.isDragging = true;
    this.elevate(true);
    this.broadcastInputPosition = true;
    this.rawTarget.classList.add('drag');

    // Start Positions
    const startX = (this.anchorXY.get() as any).x;
    const startY = (this.anchorXY.get() as any).y;

    // RESERVED SPACE
    if (!this.boundary && this.reservedTop != 0) {
      const viewportOffset = this.rawElement.getBoundingClientRect();
      // these are relative to the viewport, i.e. the window
      const topBounds = viewportOffset.top;
      this.boundary = (topBounds - this.reservedTop) * -1;
    }

    // this.pointerTracker = pointer(this.anchorXY.get()).start(this.anchorXY);
    const stream = (v: PointerProps): PointerProps => {
      this.inputStream$.next(v);
      return v;
    };
    this.pointerTracker = pointer(this.anchorXY.get() as PointerProps).pipe(stream, transformMap({
      y: (v: number) => this.limit(this.constrainY ? startY : v, '<', this.boundary),
      x: (v: number) => {
        // this.messageBus.emit({name:"Drag", sender:this}) // <-- this was too slow for high frequency stream

        this.updateStream$.next({ x: this.target.get('x'), y: this.target.get('y') });
        return this.constrainX ? startX : v;
      },
      preventDefault: () => true,
    })).start(this.anchorXY);
    if (this.anchored) { this.focus = pointer(this.anchorXY.get() as PointerProps).start(this.unfocus); }

    // Only listen for events that trigger stop() once movement has started
    if (this.constrainX || this.constrainY) {
      listen(document, 'mouseup touchend').while(() => this._moveable).start(this.stopDrag.bind(this));
    } else {
      listen(this.rawElement, 'mouseup touchend').while(() => this._moveable).start(this.stopDrag.bind(this));
      listen(document, 'mouseleave').while(() => this._moveable).start(this.mouseExit.bind(this));
    }
  }

  stop(eventType: string): void {
    if (this.hasFocus && this.isDragging) {
      if (eventType == 'drag' || eventType == 'exit') {
        this.rawTarget.classList.remove(eventType);
        // eventType = "drag";
        // if(this.hasFocus){
        this.messageBus.emit({ name: 'DisplayObjectReleased', sender: this });
        this.elevate(false);
        // }
        this.broadcastInputPosition = false;
        // this._hasFocus = false;

        this.isDragging = false;
      }
    }

    // kill resize
    if (this.anchorXY) {
      this.anchorXY.stop();
    }

    /* if(this.anchored){
      spring({
        from: this.anchorXY.get(),
        velocity: this.anchorXY.getVelocity(),
        stiffness: 300,
        damping: 10
      }).start(this.anchorXY);
    } else {
      if(this.anchorXY){
        this.anchorXY.stop();
      }
    }

    if(this.focus && this.anchored){
      this.focus.stop();
      this.unfocus({x:0, y:0})
    } */
  }

  mouseExit(): void {
    this.stop('exit');
  }

  stopDrag(): void {
    this.stop('drag');
  }

  unfocus(value: { x: number; y: number }): void {
    let blurValue = value.y / 5 * -1;
    if (blurValue < 10) {
      blurValue = 0;
    } else {
      blurValue -= 15;
    }

    document.querySelector<HTMLElement>('.desktop').style.filter = 'blur(' + blurValue + 'px)';
  }

  refocus(): void {
  }

  elevate(set: boolean): void {
    // let zIndex: number = this.hasFocus ? 50 : 1;
    const elevatedProps: ValueMap = {
      'z-index': 50,
    };

    if (this.elevateOnSelect) {
      elevatedProps.scaleX = 1.05;
      elevatedProps.scaleY = 1.05;
    }

    const resetProps: ValueMap = {
      'z-index': this.hasFocus ? 50 : 1,
    };

    if (this.elevateOnSelect) {
      resetProps.scaleX = 1;
      resetProps.scaleY = 1;
    }

    tween({
      from: set ? resetProps : elevatedProps,
      to: set ? elevatedProps : resetProps,
      duration: 100,
      flip: 0,
    }).start(this.target.set);
  }

  limit(value: number, operator: '>' | '<', threshold: number): number {
    switch (operator) {
      case '<':
        if (value < threshold) { return threshold; }
        break;
      case '>':
        if (value > threshold) { return threshold; }
        break;
    }
    return value;
  }

  // Resize Methods
  startResizeTop(): void {
    this.messageBus.emit({ name: 'ResizeStarted' + this.id });
    const element = styler(this.rawElement, {});
    const startH = this.target.get('height');
    const startY = this.target.get('y');
    const startX = this.target.get('x');

    this.pointerTracker = pointer(this.anchorXY.get() as PointerProps).pipe(transformMap({
      y: (v: number) => {
        element.set({ height: startH + (startY - v) });
        this.target.set({ y: v });
        return v;
      },
      x: () => startX,
    })).start(this.anchorXY);
  }

  startResizeBottom(): void {
    this.messageBus.emit({ name: 'ResizeStarted' + this.id });
    const element = styler(this.rawElement, {});
    const startH = this.target.get('height');
    const startY = this.target.get('y');
    const startX = this.target.get('x');

    this.pointerTracker = pointer(this.anchorXY.get() as PointerProps).pipe(transformMap({
      y: (v: number) => {
        const diff = v - startY;
        element.set({ height: startH + diff });
        // this.target.set({y: startY});
        return startY;
      },
      x: () => startX,
    })).start(this.anchorXY);
  }

  startResizeLeft(): void {
    this.messageBus.emit({ name: 'ResizeStarted' + this.id });
    const element = styler(this.rawElement, {});

    const startW = this.target.get('width');
    const startX = this.target.get('x');
    const startY = this.target.get('y');

    this.pointerTracker = pointer(this.anchorXY.get() as PointerProps).pipe(transformMap({
      x: (v: number) => {
        // setting transform-origin left has no effect
        // width changes anchoring element to center
        // element.set({ width: resizedW * 1.1});
        element.set({ width: startW + startX - v });
        // this.target.set({x: v });
        return v; // - (diff / 2);
      },
      y: () => startY,
    })).start(this.anchorXY);
  }

  startResizeRight(): void {
    this.messageBus.emit({ name: 'ResizeStarted' + this.id });
    const element = styler(this.rawElement, {});

    const startW = this.target.get('width');
    const startX = this.target.get('x');
    const startY = this.target.get('y');

    this.pointerTracker = pointer(this.anchorXY.get() as PointerProps).pipe(transformMap({
      x: (v: number) => {
        const diff = v - startX;
        // setting transform-origin left has no effect
        // width changes anchoring element to center
        // element.set({ width: startW + (diff * 2)}); // Like center anchor point in AS3
        // this.target.set({x: v - (startX + diff)});
        element.set({ width: startW + diff /* , originX: '100% 0' */ });
        return startX; // + (diff / 2);
      },
      y: () => startY,
    })).start(this.anchorXY);
  }

  stopResize(): void {
    // this.anchorXY.stop();
    this.stop('resize');
    this.messageBus.emit({ name: 'ResizeStopped' + this.id });
  }
}
