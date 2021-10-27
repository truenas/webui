import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  AfterContentInit,
  ElementRef,
  Renderer2,
  ContentChild,
  HostBinding,
  HostListener,
} from '@angular/core';
import { SmdFabSpeedDialActionsComponent } from 'app/pages/common/entity/fab-speed-dial/smd-fab-speed-dial-actions/smd-fab-speed-dial-actions.component';

@Component({
  selector: 'smd-fab-speed-dial',
  templateUrl: './smd-fab-speed-dial.component.html',
  styleUrls: ['smd-fab-speed-dial.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class SmdFabSpeedDialComponent implements AfterContentInit {
  private isInitialized = false;
  private _direction = 'up';
  private _open = false;
  private _animationMode = 'fling';

  /**
     * Whether this speed dial is fixed on screen (user cannot change it by clicking)
     */
  @Input() fixed = false;

  /**
     * Whether this speed dial is opened
     */
  @HostBinding('class.smd-opened')
  @Input() get open(): boolean {
    return this._open;
  }

  set open(open: boolean) {
    const previousOpen = this._open;
    this._open = open;
    if (previousOpen != this._open) {
      this.openChange.emit(this._open);
      if (this.isInitialized) {
        this.setActionsVisibility();
      }
    }
  }

  /**
     * The direction of the speed dial. Can be 'up', 'down', 'left' or 'right'
     */
  @Input() get direction(): string {
    return this._direction;
  }

  set direction(direction: string) {
    const previousDir = this._direction;
    this._direction = direction;
    if (previousDir != this.direction) {
      this.setElementClass(previousDir);
      this.setElementClass(this.direction);

      if (this.isInitialized) {
        this.setActionsVisibility();
      }
    }
  }

  /**
     * The animation mode to open the speed dial. Can be 'fling' or 'scale'
     */
  @Input() get animationMode(): string {
    return this._animationMode;
  }

  set animationMode(animationMode: string) {
    const previousAnimationMode = this._animationMode;
    this._animationMode = animationMode;
    if (previousAnimationMode != this._animationMode) {
      this.setElementClass(previousAnimationMode);
      this.setElementClass(this.animationMode);

      if (this.isInitialized) {
        // To start another detect lifecycle and force the "close" on the action buttons
        Promise.resolve(null).then(() => this.open = false);
      }
    }
  }

  @Output() openChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ContentChild(SmdFabSpeedDialActionsComponent, { static: true }) _childActions: SmdFabSpeedDialActionsComponent;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
  }

  ngAfterContentInit(): void {
    this.isInitialized = true;
    this.setActionsVisibility();
    this.setElementClass(this.direction);
    this.setElementClass(this.animationMode);
  }

  /**
     * Toggle the open state of this speed dial
     */
  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('click')
  onClick(): void {
    if (!this.fixed && this.open) {
      this.open = false;
    }
  }

  setActionsVisibility(): void {
    if (this.open) {
      this._childActions.show();
    } else {
      this._childActions.hide();
    }
  }

  private setElementClass(elemClass: string): void {
    this.renderer.addClass(this.elementRef.nativeElement, `smd-${elemClass}`);
  }
}
