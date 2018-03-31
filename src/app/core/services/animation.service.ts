import { Injectable, ElementRef  } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { tween, styler, keyframes, physics } from 'popmotion';
import  scroll  from 'stylefire/scroll';
import  css  from 'stylefire/css';
import { TweenProps } from 'popmotion/src/animations/tween/types';
import { Value } from 'popmotion/src/reactions/value';
import { Subject } from 'rxjs/Subject';

interface Coordinates {
  x?: string;
  y?: string;
}

@Injectable()
export class AnimationService {

  private doc:any; //Document Object
  private colorLoopActive:any;
  private activeAnimations: any[] = [];

  constructor(private core:CoreService){
    this.core.register({observerClass:this,eventName:"ScrollTo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("Message Received");
      //DEBUG: console.log(evt.data);
      this.scrollTo(evt.data);
    });

    this.core.register({observerClass:this,eventName:"AnimateColorLoopStart"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("Message Received");
      //DEBUG: console.log(evt.data);
      this.colorLoopAnimation(evt.data.element,evt.data.colors);
    });
  }

  private scrollTo(destination:string, obj?:any){
    if(!obj){obj = ".rightside-content-hold"};
    // Grab reference to the element that has the scroll bar
    const target = (<any>document).querySelector(obj);

    // Grab reference to the target element 
    // you want to scroll to
    const dest = (<any>document).querySelector(destination);
    //DEBUG: console.log(dest)
    const elementScroll = scroll(target,{});

    //elementScroll.set('top', 400);

    physics({
      from: elementScroll.get('top'),
      to: dest.offsetTop,//500
      springStrength: 600,
      friction: 1
    }).start((v) => elementScroll.set('top', v));
  }

  colorLoopAnimation(obj,colors){
    const target = (<any>document).querySelector(obj);
    const elStyler:any = styler(target);
    //DEBUG: console.warn(elStyler);
    const s = keyframes({
      values: colors,
      duration: 60000,
      //ease: easing.linear,
      loop: Infinity,
    });

    const startColorLoop = () => { 
      //DEBUG: console.warn(elStyler);
      const a = s.start(elStyler.set('background-color'));
       return a;
    }

    if(!this.colorLoopActive && colors.length > 0){
     this.colorLoopActive  = startColorLoop();
    }

    const reset = () => {
      this.colorLoopActive.stop();
      elStyler.set({'background-color':'rgba(0,0,0,0.15)'})
    }
    reset();

    if(colors){
      //DEBUG: console.log("Starting the Color Loop");
      this.colorLoopActive.resume();
    } else if(!colors){
      //DEBUG: console.log("Stopping the Color Loop");
      reset();
    }
    //return s;
    }

  /*parent: any;
   //@Input() target:ElementRef; //May have to implement this later
   @Input() animation: string;
   @Input() reverse:boolean;
   @Input() slideProps:Coordinates;

   // Use these for looped animations
   @Input() shake:boolean;
   @Input() shaking: any;
   @Input() colorLoop: string[];
   @Input() colorLoopActive:any;


   private elStyler: any;
   private motion: any; // Stores Tweens
   private inMotion: any; // Stores Tweens running in a loop

   constructor(private elRef: ElementRef, private renderer: Renderer2){ 
   }

   ngOnChanges(changes){
     this.parent = this.elRef.nativeElement;
     this.elStyler = styler(this.parent); // fixme: passing empty props for now to fix the build

       if(changes.animation){
         this.animate();
       }
       if(changes.slideProps){
         this.animate();
       }

       if(changes.shake){
         this.shakeAnimation();
       }

       if(changes.colorLoop){
         //this.parent = this.elRef.nativeElement;
         //this.elStyler = styler(this.parent);
         this.colorLoopAnimation();
       }
   }

   // HELLO WORLD!
   animate(){
     //DEBUG: console.log(this.animation);
     switch(this.animation){
     case 'stop':
       //DEBUG: console.log("Stopping animations");
       if(this.inMotion){
         //DEBUG: console.log(this.inMotion);
         this.inMotion.pause()
       }
       break;
      case 'slide':
        this.motion = this.slide();
        this.motion.start(this.elStyler.set);
        break;
      case 'flipV':
        this.motion = this.flipV();
        this.motion.start(this.elStyler.set);
        break;
      case 'unflipV':
        this.motion = this.flipV(true);
        this.motion.start(this.elStyler.set);
        break;
      case 'flipH':
        this.motion = this.flipH();
        this.motion.start(this.elStyler.set);
        break;
      case 'unflipH':
        this.motion = this.flipH(true);
        this.motion.start(this.elStyler.set);
        break;
      default:
        break;
     }
   }

   shakeAnimation(){
     const s = tween({
       from: { rotate: -1.25, scale:1},
       to: { rotate: 1.25, scale: 1 },
       //ease: easing.easeInOut,
       flip: Infinity,
       duration: 100
     });

     const startShaking = () => { 
       const a = s.start({
         update:this.elStyler.set
       });
       return a;
     }

     if(!this.shaking){
       this.shaking  = startShaking();
     }

     const reset = () => {
       this.shaking.stop();
       this.elStyler.set({rotate:0,scale:1})
     }
     reset();

     if(this.shake){
       //DEBUG: console.log("Starting the shaking");
       this.shaking.resume();
     } else if(!this.shake){
       //DEBUG: console.log("Stopping the shaking");
       reset();
     }
     //return s;
     }

   flipV(reverse?:boolean){
     //DEBUG: console.log("**** FLIP ANIMATION ****");

     let start: number;
     let finish: number;

     if(!reverse){
       start = 0;
       finish = -180;
     } else {
       start = -180;
       finish = 0;
     }
     let s = tween({
       from: { rotateX: start, scale:1},
       to: { rotateX: finish, scale: 1 },
       //ease: easing.easeInOut,
       //flip: 0,
       duration: 500
     })
     return s;
   }

   flipH(reverse?:boolean){
     //DEBUG: console.log("**** FLIP ANIMATION ****");

     let start: number;
     let finish: number;

     if(!reverse){
       start = 0;
       finish = -180;
     } else {
       start = -180;
       finish = 0;
     }
     let s = tween({
       from: { rotateY: start, scale:1},
       to: { rotateY: finish, scale: 1 },
       //ease: easing.easeInOut,
       //flip: 0,
       duration: 500
     })
     return s;
   }

   slide(){
     //DEBUG: console.log("**** SLIDE ANIMATION ****");

     let startX:  number;
     let finishX:  number;
     let startY:  number;
     let finishY:  number;


     let fromProps:any = {};
     let toProps:any = {};

     if(this.slideProps.x){
       // Detect and convert if percentage value
       if(this.slideProps.x.search("%") != -1){
         finishX = this.percentToPx(this.slideProps.x,'width');
       } else {
         finishX = Number(this.slideProps.x);
       }
       startX = this.elStyler.get('translateX');
       fromProps.x = startX;
       toProps.x = finishX;
       //DEBUG: console.warn(startX)
     }
     if(this.slideProps.y){
       // Detect and convert if percentage value
       if(this.slideProps.y.search("%") != -1){
         finishY = this.percentToPx(this.slideProps.y,'height');
       } else {
         finishY = Number(this.slideProps.y);
       }
       startY = this.elStyler.get('translateY');
       fromProps.y = startY;
       toProps.y = finishY;
     }

     let s = tween({
       from: fromProps,
       to: toProps,
       //ease: easing.easeInOut,
       //flip: 0,
       duration: 500
     });
     return s;
   }*/

   /*percentToPx(value:string,dim:string):number{
    let d = this.elStyler.get(dim);
    let spl = value.split('%');
    let num = Number(spl[0])/100;
    let result = d*num;
    //DEBUG: console.warn(result);
    return result;
   }*/

}

