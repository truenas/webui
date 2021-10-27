import {
  AfterContentInit, Component, ContentChildren, forwardRef, Inject, QueryList, Renderer2,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SmdFabSpeedDialComponent } from 'app/pages/common/entity/fab-speed-dial/smd-fab-speed-dial.component';

const Z_INDEX_ITEM = 23;

@UntilDestroy()
@Component({
  selector: 'smd-fab-actions',
  template: '<ng-content select="[md-mini-fab], [mat-mini-fab]"></ng-content>',
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
