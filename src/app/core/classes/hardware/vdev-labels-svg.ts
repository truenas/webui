import { Container, Texture, Sprite } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { LabelFactory } from './label-factory';
import { Chassis } from './chassis';
import { DriveTray } from './drivetray';
import * as d3 from 'd3';
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
  } from 'popmotion';

interface Position {
  x: number;
  y: number;
}

export class VDevLabelsSVG {

 /*
  * We create an SVG layer on top of the PIXI canvas 
  * to achieve crisper lines. Apparently drawing 
  * thin lines in WebGL is problematic without
  * resorting to caching them as bitmaps which 
  * essentially renders them static.
  * 
  */

  public events: Subject<CoreEvent>;

  protected svg:any; // Our d3 generated svg layer
  protected mainStage: any; // WebGL Canvas
  protected app: any;
  protected chassis: Chassis; // The chassis we are labelling
  //public container: Container;
  //protected domLabels: any;
  public color: string;
  public ClickByProxy;
  
  private textAreas: any;
  private trays: any = {};

  constructor(chassis, app, color){
    //super(chassis, stage)

    this.color = color;
    this.onInit(chassis, app);
  }

  onInit(chassis, app){
    this.chassis = chassis;
    this.app = app;
    this.mainStage = this.app.stage;
    this.d3Init();

    //this.defineTextAreas();

    this.events = new Subject<CoreEvent>();
    this.events.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "LabelDrives":
          //console.log(evt);
          this.createVdevLabels(evt.data);
          break
        case "OverlayReady":
          if(evt.data.vdev.disks){
            this.traceElements(evt.data.vdev, evt.data.overlay);
          }
          break
      }
    });

  }

  onDestroy(){
    console.log("Clean up after yourself");
  }

  // Animate into view
  enter(){
    console.log("Animate into view...");
  }

  // Animate out of view
  exit(){

    let op = this.getParent();
    d3.select('#' + op.id + ' svg').remove();
    d3.select('#' + op.id + ' canvas.clickpad').remove();
    this.app.renderer.plugins.interaction.setTargetElement(this.app.renderer.view);
    
  }

  d3Init(){
    let op = this.getParent();

    this.svg = d3.select('#' + op.id).append("svg")
      .attr("width", op.offsetWidth)
      .attr("height", op.offsetHeight)
      .attr("style", "position:absolute; top:0; left:0;");

    let clickpad = d3.select('#' + op.id).append("canvas") // This element will capture for PIXI
      .attr('class', 'clickpad')
      .attr("width", op.offsetWidth)
      .attr("height", op.offsetHeight)
      .attr("style", "position:absolute; top:0; left:0;");

    this.app.renderer.plugins.interaction.setTargetElement(op.querySelector('canvas.clickpad'));

  }

  getParent(){
    return this.app.renderer.view.offsetParent
  }

  createVdevLabelTile(x,y,w,h, className){
    
    this.svg.append("rect")
      .attr('class', className)
      .attr("y", y)
      .attr("x", x)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", this.color)
      .attr("stroke",this.color)
      .attr("style", "fill-opacity:0.25; stroke-width:1");
  }


  createVdevLabels(vdev){
    // If there is no pool then there
    // won't be vdev info either
    if(!vdev.disks){return;}

    let disks = Object.keys(vdev.disks);// NOTE: vdev.slots only has values for current enclosure
    let xOffset = this.chassis.container.x + this.chassis.container.width + 16;
    let freeSpace = this.app._options.width - xOffset;
    let gap = 3;

    disks.forEach((disk, index) => {
      let present = false; // Is the disk in this enclosure?
      if(typeof vdev.slots[disk] !== 'undefined'){

        present = true;
        // Create tile if the disk is in the current enclosure
        let src = this.chassis.driveTrayObjects[vdev.slots[disk] - 1].container;
        let tray = src.getGlobalPosition();

        let tileClass = "tile tile_" + disk;
        this.createVdevLabelTile(tray.x, tray.y, src.width * this.chassis.container.scale.x, src.height * this.chassis.container.scale.y, tileClass);
        this.trays[ disk ] = {x: tray.x, y: tray.y, width: src.width * this.chassis.container.scale.x, height: src.height * this.chassis.container.scale.y};
      }
    });

  }

  calculateParentOffsets(el){
    // Template uses CSS to center and align text so 
    // wee need to compensate with absolute positions
    // of wrapper elements
    
    // 1 up
    let legend = el.nativeElement.childNodes[0].childNodes[1];
    
    // 2 up
    let content = el.nativeElement.childNodes[0];

    const xOffset = el.nativeElement.offsetLeft + legend.offsetLeft + content.offsetLeft;
    const yOffset = el.nativeElement.offsetTop + legend.offsetTop + content.offsetTop;

    return {x: xOffset, y: yOffset}
  }

  traceElements(vdev, overlay){
    let disks = Object.keys(vdev.disks);// NOTE: vdev.slots only has values for current enclosure
    let op = this.getParent();// Parent div
    disks.forEach((disk, index) => {
      
      let present = false; // Is the disk in this enclosure?
      if(typeof vdev.slots[disk] !== 'undefined'){
        present = true;
        // Create tile if the disk is in the current enclosure

        let tray = this.trays[disk];
        
        let el = overlay.nativeElement.querySelector('div.vdev-disk.' + disk);
        let parentOffsets = this.calculateParentOffsets(overlay);
        let startX = tray.x + tray.width;
        let startY = tray.y + tray.height / 2;
        let endX = el.offsetLeft + parentOffsets.x//el.offsetParent.offsetLeft;
        let endY = el.offsetTop + parentOffsets.y + (el.offsetHeight / 2);
        this.createTrace(startX, startY, endX, endY);
      }
    });
  }

  createTrace(startX,startY, endX, endY){
  
    let svgPath = "M" + startX + " " + startY + " L" + endX + " " + endY + " Z"

    this.svg.append("path")
      .attr('d', svgPath)
      .attr('stroke', this.color)

  }


  protected parseColor(color:string){
    return parseInt("0x" + color.substring(1), 16)
  }

}
