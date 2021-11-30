import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  tween,
  value,
  spring,
  physics,
  easing,
  keyframes,
  timeline,
  ColdSubscription,
} from 'popmotion';
import { ValueReaction } from 'popmotion/lib/reactions/value';
import { AnimateEvent } from 'app/interfaces/events/animate-event.interface';
import { ScrollToEvent } from 'app/interfaces/events/scroll-to-event.interface';
import { Timeout } from 'app/interfaces/timeout.interface';
import { DisplayObject } from '../classes/display-object';
import { CoreService } from './core-service/core.service';

export interface AnimationConfig {
  animationTarget: DisplayObject; // Support DisplayObject
  animation: string; // eg. fadeIn, slideOut etc
  finishState: string; // In || Out || Start || Stop
}

export interface GroupAnimationConfig {
  animationTargets: DisplayObject[]; // Supports DisplayObjects only
  animation: string; // eg. fadeIn, slideOut etc
  finishState: string; // In || Out || Start || Stop
  staggered?: boolean;
}

@UntilDestroy()
@Injectable()
export class AnimationService {
  private activeAnimations: { [targetId: string]: { animation: Timeout; originalState: any } } = {};

  constructor(private core: CoreService) {
    this.core.register({ observerClass: this, eventName: 'ScrollTo' }).pipe(untilDestroyed(this)).subscribe((evt: ScrollToEvent) => {
      this.scrollTo(evt.data);
    });

    core.register({ observerClass: this, eventName: 'Animate' }).pipe(untilDestroyed(this)).subscribe((evt: AnimateEvent) => {
      const config: AnimationConfig = evt.data;
      switch (config.animation) {
        case 'Flip':
          this.flip(config.animationTarget, config.finishState);
          break;
        case 'Fade':
          this.fade(config.animationTarget, config.finishState);
          break;
        case 'Scale':
          this.scale(config.animationTarget, config.finishState);
          break;
        case 'ElasticScale':
          this.elasticScale(config.animationTarget, config.finishState);
          break;
        case 'Bounce':
          this.bounce(config.animationTarget, config.finishState);
          break;
        case 'Radiate':
          this.radiate(config.animationTarget, config.finishState);
          break;
      }
    });
  }

  private flip(animationTarget: DisplayObject, finishState: string): void {
    const target = animationTarget;// .target;
    if (target.width > target.height) {
      this.flipVertical(animationTarget, finishState);
    } else if (target.width < target.height) {
      this.flipHorizontal(animationTarget, finishState);
    } else {
      console.warn('Could not determine orientation of element.');
    }
  }

  private flipVertical(animationTarget: DisplayObject, finishState: string): void {
    const parentNode = animationTarget.rawTarget.parentNode as HTMLElement;
    // Setup parent element so perspectives are properly set...
    parentNode.style['perspective'] = (animationTarget.target.get('width') * 10) + 'px';
    // animationTarget.rawTarget.parentNode.style["perspective"] = '1520px'; // Hard coded value from FreeNAS
    parentNode.style['perspectiveOrigin'] = '50% 50%';
    parentNode.style['transformStyle'] = 'preserve-3d';

    let start: number;
    let finish: number;
    if (finishState == 'In') {
      start = -180;
      finish = 0;
    } else if (finishState == 'Out') {
      start = 0;
      finish = -180;
    }

    // Using timeline because using start/finish variables in tween() throws type error. Problem with popmotion types?
    timeline([
      {
        track: 'rotateX', from: start, to: finish, duration: 300,
      },
    ]).start(animationTarget.target.set);
  }

  private flipHorizontal(animationTarget: DisplayObject, finishState: string): void {
    // Setup parent element so perspectives are properly set...
    const parentNode = animationTarget.rawTarget.parentNode as HTMLElement;
    parentNode.style['perspective'] = (animationTarget.target.get('height') * 80) + 'px';
    parentNode.style['perspectiveOrigin'] = 'center';
    parentNode.style['transformStyle'] = 'preserve-3d';

    let start: number;
    let finish: number;
    if (finishState == 'In') {
      start = -180;
      finish = 0;
    } else if (finishState == 'Out') {
      start = 0;
      finish = -180;
    }

    // Using timeline because using start/finish variables in tween() throws type error. Problem with popmotion types?
    timeline([
      {
        track: 'rotateY', from: start, to: finish, duration: 300,
      },
    ]).start(animationTarget.target.set);
  }

  private fade(animationTarget: DisplayObject, finishState: string): void {
    let startOpacity;
    let finishOpacity;
    if (finishState == 'In') {
      startOpacity = 0;
      finishOpacity = 1;
    } else if (finishState == 'Out') {
      startOpacity = 1;
      finishOpacity = 0;
    }

    tween({
      from: { opacity: startOpacity },
      to: { opacity: finishOpacity },
      duration: 500,
    }).start(animationTarget.target.set);
  }

  private scale(animationTarget: DisplayObject, finishState: string): void {
    let startScale;
    let finishScale;
    if (finishState == 'In') {
      startScale = 0;
      finishScale = 1;
    } else if (finishState == 'Out') {
      startScale = 1;
      finishScale = 0;
    }

    tween({
      from: { scale: startScale },
      to: { scale: finishScale },
      duration: 250,
      ease: easing.easeInOut,
    }).start(animationTarget.target.set);
  }

  private elasticScale(animationTarget: DisplayObject, finishState: string): void {
    if (finishState == 'Out') {
      this.scale(animationTarget, finishState);
      return;
    }

    let startScale;
    let finishScale;
    if (finishState == 'In') {
      startScale = 0;
      finishScale = 1;
    } else if (finishState == 'Out') {
      startScale = 1;
      finishScale = 0;
    }

    spring({
      from: { scale: startScale },
      to: { scale: finishScale },
      stiffness: { scale: 150 },
      damping: { scale: 15 },
      velocity: 20,
    }).start(animationTarget.target.set);
  }

  private bounce(animationTarget: DisplayObject, finishState: string): void {
    if (finishState == 'Stop') {
      const savedState = this.activeAnimations[animationTarget.id];
      const animation = savedState.animation;
      clearInterval(animation);
      delete this.activeAnimations[animationTarget.id];
      return;
    }

    const startY: number = animationTarget.target.get('y');
    value(startY, animationTarget.target.set('y') as any);

    const gravity = (start: number): ColdSubscription => {
      const g = physics({
        acceleration: 2500,
        to: (startY - 200),
        // restSpeed: false
      }).while((v) => v <= start).start({
        update: (v: number) => { animationTarget.target.set('y', v); },
        complete() {
          tween({
            from: { y: animationTarget.target.get('y') },
            to: { y: startY },
            duration: 100,
          }).start(animationTarget.target.set);
        },
      });
      g.set(Math.min(animationTarget.target.get('y')))
        .setSpringTarget(startY)
        .setVelocity(-1200);
      return g;
    };

    const bounce = setInterval(() => {
      gravity(startY);
    }, 2000);

    this.activeAnimations[animationTarget.id] = { animation: bounce, originalState: startY };
  }

  private radiate(animationTarget: DisplayObject, finishState: string): void {
    const startShadow = animationTarget.element.get('box-shadow'); // Styler

    if (finishState == 'Stop') {
      const reference = this.activeAnimations[animationTarget.id];

      animationTarget.element.set('box-shadow', reference.originalState);

      clearInterval(reference.animation);
      delete this.activeAnimations[animationTarget.id];
      return;
    }

    const elementBorder = value(
      { borderColor: '', borderWidth: 0 },
      ({ borderColor, borderWidth }: { borderColor: string; borderWidth: number }) => animationTarget.element.set({
        boxShadow: `0 0 0 ${borderWidth}px ${borderColor}`,
      }),
    );

    const radiation = (_: unknown, elementBorder: ValueReaction): void => {
      keyframes({
        values: [
          { borderWidth: 0, borderColor: 'rgb(204, 0, 0, 1)' },
          { borderWidth: 30, borderColor: 'rgb(204, 0, 0, 0)' },
        ],
        duration: 750,
      }).start(elementBorder);
    };

    const radiate = setInterval(() => {
      radiation(startShadow, elementBorder);
    }, 1500);

    this.activeAnimations[animationTarget.id] = { animation: radiate, originalState: startShadow };
  }

  private scrollTo(destination: string): void {
    const rawScrollTarget = document.querySelector(destination);

    rawScrollTarget.scrollIntoView(); // native method works but without a smooth transition
  }
}
