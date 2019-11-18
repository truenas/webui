import { Injectable, ElementRef  } from '@angular/core';
import { CoreService, CoreEvent } from './core.service';
import { Subject } from 'rxjs/Subject';
import { DisplayObject } from '../classes/display-object';
import {
  tween,
  styler,
  listen,
  pointer,
  value,
  decay,
  spring,
  physics,
  easing,
  everyFrame,
  keyframes,
  timeline,
  //velocity,
  multicast,
  action,
  transform,
  //transformMap,
  //clamp
  } from '../popmotion';

  const transformMap = transform.transformMap;
  const { clamp } = transform

  export interface AnimationConfig {
    animationTarget: DisplayObject; // Support DisplayObject
    animation: string; // eg. fadeIn, slideOut etc
    finishState: string; // In || Out || Start || Stop
    finishPosition?:any; // XY?  Haven't decided how this one will work yet
  }

  export interface GroupAnimationConfig {
    animationTargets: DisplayObject[]; // Supports DisplayObjects only
    animation: string; // eg. fadeIn, slideOut etc
    finishState: string; // In || Out || Start || Stop
    finishPosition?:any; // XY?  Haven't decided how this one will work yet
    staggered?: boolean;
  }

  @Injectable()
  export class AnimationService {

    private doc:any; //Document Object
    private colorLoopActive:any;
    private activeAnimations: any = {};

    constructor(private core:CoreService){
      this.core.register({observerClass:this,eventName:"ScrollTo"}).subscribe((evt:CoreEvent) => {
        this.scrollTo(evt.data);
      });

      core.register({observerClass:this, eventName:"Animate"}).subscribe((evt:CoreEvent) => { 
        let config: AnimationConfig = evt.data;
        let missingFinishState: string = "This animation requires you to specify a finishState property which was not given."
          switch(config.animation){
          case "Flip":
            this.flip(config.animationTarget, config.finishState);
            break;
          case "Fade":
            this.fade(config.animationTarget, config.finishState);
            break;
          case "Scale":
            this.scale(config.animationTarget, config.finishState);
            break;
          case "ElasticScale":
            this.elasticScale(config.animationTarget, config.finishState);
            break;
          case "Bounce":
            this.bounce(config.animationTarget, config.finishState);
            break;
          case "Radiate":
            this.radiate(config.animationTarget, config.finishState);
            break;
          }
      });

      this.core.register({observerClass:this,eventName:"AnimateGroup"}).subscribe((evt:CoreEvent) => {
        let config: GroupAnimationConfig = evt.data;
        let animationTargets = config.animationTargets;
        let animation = config.animation;
      });

    }



    private flip(animationTarget:DisplayObject, finishState:string){
      let target = animationTarget//.target;
      if(target.width > target.height){
        this.flipVertical(animationTarget, finishState);
      } else if(target.width < target.height){
        this.flipHorizontal(animationTarget, finishState);
      } else {
        console.warn("Could not determine orientation of element.");
        console.log(target);
      }
    }

    private flipVertical(animationTarget:DisplayObject, finishState:string){
      console.log("Flip Vertical Method");
      // Setup parent element so perspectives are properly set...
      animationTarget.rawTarget.parentNode.style["perspective"] = (animationTarget.target.get('width') * 10) + "px"
      //animationTarget.rawTarget.parentNode.style["perspective"] = '1520px'; // Hard coded value from FreeNAS
      animationTarget.rawTarget.parentNode.style["perspective-origin"] = "50% 50%";
      animationTarget.rawTarget.parentNode.style["transform-style"] = "preserve-3d";

      let start:number;
      let finish:number;
      if(finishState == "In"){
        start = -180;
        finish = 0;
      } else if(finishState == "Out"){
        start = 0;
        finish = -180;
      }

      // Using timeline because using start/finish variables in tween() throws type error. Problem with popmotion types?
      timeline([
        {track:'rotateX', from: start, to:finish, duration:300}
      ]).start(animationTarget.target.set)
    }

    private flipHorizontal(animationTarget:DisplayObject, finishState:string){
      console.log("Flip Horizontal Method");
      // Setup parent element so perspectives are properly set...
      animationTarget.rawTarget.parentNode.style["perspective"] = (animationTarget.target.get('height') * 80) + "px";
      animationTarget.rawTarget.parentNode.style["perspective-origin"] = "center";
      animationTarget.rawTarget.parentNode.style["transform-style"] = "preserve-3d";

      console.log("Initial Rotation = " + animationTarget.target.get('rotateY'))

      let start:number;
      let finish:number;
      if(finishState == "In"){
        start = -180;
        finish = 0;
      } else if(finishState == "Out"){
        start = 0;
        finish = -180;
      }

      // Using timeline because using start/finish variables in tween() throws type error. Problem with popmotion types?
      timeline([
        {track:'rotateY', from: start, to:finish, duration:300}
      ]).start(animationTarget.target.set)
    }

    private fade(animationTarget:DisplayObject, finishState: string){ 
      console.log("Fade" + finishState);
      let startOpacity; //animationTarget.target.get('opacity');
      let finishOpacity;
      if(finishState == "In"){
        startOpacity = 0;
        finishOpacity = 1;
      } else if(finishState = "Out"){
        startOpacity = 1;
        finishOpacity = 0;
      }

      tween({
        from: {opacity: startOpacity},
        to: {opacity:finishOpacity},
        duration:500
      }).start(animationTarget.target.set);
    }

    private scale(animationTarget: DisplayObject, finishState: string){
      console.log("Scale" + finishState);
      let startScale;
      let finishScale;
      if(finishState == "In"){
        startScale = 0;
        finishScale = 1;
      } else if(finishState = "Out"){
        startScale = 1;
        finishScale = 0;
      }

      tween({
        from: {scale: startScale},
        to: {scale:finishScale},
        duration:250,
        ease: easing.easeInOut,
      }).start(animationTarget.target.set);
    }

    private elasticScale(animationTarget: DisplayObject, finishState: string){
      if(finishState == "Out"){
        this.scale(animationTarget, finishState);
        return ;
      }

      let startScale;
      let finishScale;
      if(finishState == "In"){
        startScale = 0;
        finishScale = 1;
      } else if(finishState = "Out"){
        startScale = 1;
        finishScale = 0;
      }

      spring({
        from: {scale: startScale},
        to: {scale:finishScale}, 
        stiffness: {scale:150},
        damping:{scale:15},
        velocity:20
      }).start(animationTarget.target.set);
    }

    private bounce(animationTarget: DisplayObject, finishState: string){
      if(finishState == "Stop"){
        let savedState = this.activeAnimations[animationTarget.id];
        let animation = savedState.animation;
        let finishPosition = savedState.originalState;
        clearInterval(animation);
        delete this.activeAnimations[animationTarget.id];
        return ;
      }

      const startY = animationTarget.target.get('y');
      const targetY = value(startY, animationTarget.target.set('y'));

      const gravity = (start) => {
        const g = physics({
          acceleration: 2500,
          to: (startY - 200),
          //restSpeed: false
        }).while(v => v <= start).start({
          update: v => { animationTarget.target.set('y',v)},
          complete(){
          tween({
              from: { y: animationTarget.target.get('y') },
              to: { y: startY },
              duration: 100
            }).start(animationTarget.target.set);
          }
        });
        g.set(Math.min(animationTarget.target.get('y')))
          .setSpringTarget(startY)
          .setVelocity(-1200)
        return g;
      }

      const bounce = setInterval(() => {
        gravity(startY);
      },2000);

      this.activeAnimations[animationTarget.id] = { animation: bounce, originalState: startY };
    }

    private radiate(animationTarget:DisplayObject, finishState: string){
      console.log("Radiate method")
      let startShadow = animationTarget.element.get('box-shadow'); // Styler

      if(finishState == "Stop"){
        let reference = this.activeAnimations[animationTarget.id];

        animationTarget.element.set('box-shadow', reference.originalState);

        clearInterval(reference.animation);
        delete this.activeAnimations[animationTarget.id];
        return ;
      }

      const elementBorder = value({borderColor: '', borderWidth: 0 }, ({ borderColor, borderWidth }) => animationTarget.element.set({
        boxShadow: `0 0 0 ${borderWidth}px ${borderColor}` 
        //border: `solid ${borderWidth} ${borderColor}px`
      }));

      const radiation = (start, elementBorder) => {
        const r = keyframes({
          values: [
            { borderWidth: 0, borderColor: 'rgb(204, 0, 0, 1)' },
            { borderWidth: 30, borderColor: 'rgb(204, 0, 0, 0)' } 
          ],
          duration:750
        }).start(elementBorder);
      }

      const radiate = setInterval(() => {
        radiation(startShadow, elementBorder);
      },1500);

      this.activeAnimations[animationTarget.id] = { animation: radiate, originalState: startShadow};
      
    }

    private scrollTo(destination:string, obj?:any){ 
      let container;
      let rawContainer;
      if(!obj){
        rawContainer = (<any>document).querySelector('body');
        container = styler(rawContainer, {});
      } else {
        // Grab reference to the element that has the scroll bar
        rawContainer = (<any>document).querySelector(obj);
        container = styler(rawContainer, {});
      }
      const rawScrollTarget = (<any>document).querySelector(destination);
      const scrollTarget = styler(rawScrollTarget, {});

      //container.set('scrollTop', rawScrollTarget.offsetTop);// Taken from popmotion docs examples but does not work
      rawScrollTarget.scrollIntoView(); // native method works but without a smooth transition
    }

  }

