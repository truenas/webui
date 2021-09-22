import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  AfterContentInit,
  ElementRef,
  Renderer2,
  Inject,
  forwardRef,
  ContentChildren,
  QueryList,
  ContentChild,
  HostBinding,
  HostListener,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

const Z_INDEX_ITEM = 23;

@Component({
  selector: 'smd-fab-trigger',
  template: '<ng-content select="[mat-fab], [mat-fab]"></ng-content>',
})
export class SmdFabSpeedDialTriggerComponent {
  /**
     * Whether this trigger should spin (360dg) while opening the speed dial
     */
  @HostBinding('class.smd-spin')
  @Input() spin = false;

  constructor(@Inject(forwardRef(() => SmdFabSpeedDialComponent)) private _parent: SmdFabSpeedDialComponent) {
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this._parent.fixed) {
      this._parent.toggle();
      event.stopPropagation();
    }
  }
}

@UntilDestroy()
@Component({
  selector: 'smd-fab-actions',
  template: `
        <ng-content select="[md-mini-fab], [mat-mini-fab]"></ng-content>
    `,
})
export class SmdFabSpeedDialActionsComponent implements AfterContentInit {
  @ContentChildren(MatButton) _buttons: QueryList<MatButton>;

  constructor(
    @Inject(forwardRef(() => SmdFabSpeedDialComponent)) private _parent: SmdFabSpeedDialComponent,
    private renderer: Renderer2,
  ) {}

  ngAfterContentInit(): void {
    this._buttons.changes.pipe(untilDestroyed(this)).subscribe(() => {
      this.initButtonStates();
      this._parent.setActionsVisibility();
    });

    this.initButtonStates();
  }

  private initButtonStates(): void {
    this._buttons.toArray().forEach((button, i) => {
      this.renderer.addClass(button._getHostElement(), 'smd-fab-action-item');
      this.changeElementStyle(button._getHostElement(), 'z-index', '' + (Z_INDEX_ITEM - i));
    });
  }

  show(): void {
    if (this._buttons) {
      this._buttons.toArray().forEach((button, i) => {
        let transitionDelay = 0;
        let transform;
        if (this._parent.animationMode == 'scale') {
          // Incremental transition delay of 65ms for each action button
          transitionDelay = 3 + (65 * i);
          transform = 'scale(1)';
        } else {
          transform = this.getTranslateFunction('0');
        }
        this.changeElementStyle(button._getHostElement(), 'transition-delay', transitionDelay + 'ms');
        this.changeElementStyle(button._getHostElement(), 'opacity', '1');
        this.changeElementStyle(button._getHostElement(), 'transform', transform);
      });
    }
  }

  hide(): void {
    if (this._buttons) {
      this._buttons.toArray().forEach((button, i) => {
        let opacity = '1';
        let transitionDelay = 0;
        let transform;
        if (this._parent.animationMode == 'scale') {
          transitionDelay = 3 - (65 * i);
          transform = 'scale(0)';
          opacity = '0';
        } else {
          transform = this.getTranslateFunction((55 * (i + 1) - (i * 5)) + 'px');
        }
        this.changeElementStyle(button._getHostElement(), 'transition-delay', transitionDelay + 'ms');
        this.changeElementStyle(button._getHostElement(), 'opacity', opacity);
        this.changeElementStyle(button._getHostElement(), 'transform', transform);
      });
    }
  }

  private getTranslateFunction(value: string): string {
    const dir = this._parent.direction;
    const translateFn = (dir == 'up' || dir == 'down') ? 'translateY' : 'translateX';
    const sign = (dir == 'down' || dir == 'right') ? '-' : '';
    return translateFn + '(' + sign + value + ')';
  }

  private changeElementStyle(elem: unknown, style: string, value: string): void {
    // FIXME - Find a way to create a "wrapper" around the action button(s) provided by the user,
    // FIXME - so we don't change it's style tag
    this.renderer.setStyle(elem, style, value);
  }
}

@Component({
  selector: 'smd-fab-speed-dial',
  templateUrl: './fab-speed-dial.html',
  styleUrls: ['fab-speed-dial.scss'],
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
