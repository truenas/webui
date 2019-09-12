import { Container, Texture, Sprite } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { Subject, Observable } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { LabelFactory } from './label-factory';
import { Chassis } from './chassis';
import { DriveTray } from './drivetray';
import * as d3 from 'd3';
/*import {
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
  multicast,
  action,
  transform,
  } from 'popmotion';*/

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
  public color: string;
  public selectedDiskColor: string;
  public highlightColor: string;
  public highlightedDiskName: string;
  public selectedDisk: any;
  public ClickByProxy;
  
  private textAreas: any;
  private trays: any = {};

  constructor(chassis, app, theme, disk){
    this.selectedDisk = disk;
    this.color = 'var(--blue)';//theme.blue;
    this.selectedDiskColor = 'var(--cyan)';//theme.cyan;
    this.highlightColor = theme.yellow;

    this.onInit(chassis, app);
  }

  onInit(chassis, app){
    this.chassis = chassis;
    this.app = app;
    this.mainStage = this.app.stage;
    this.d3Init();
    let paths = this.getParent().querySelectorAll('svg path');

    let tiles;
    this.events = new Subject<CoreEvent>();
    this.events.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "ThemeChanged":
          let theme = evt.data;
          this.color = theme.blue;
          this.selectedDiskColor = theme.cyan;
          this.highlightColor = theme.yellow;
        break;
        case "LabelDrives":
          this.createVdevLabels(evt.data);
        break
        case "OverlayReady":
        break;
        case "ShowPath":
        break;
        case "HidePath":
        break;
        case 'EnableHighlightMode':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.hideAllTiles(tiles, ['tile tile_' + this.selectedDisk.devname])
        break;
        case 'DisableHighlightMode':
          tiles = this.getParent().querySelectorAll('rect.tile')
          this.showAllTiles(tiles);
        break;
        case 'HighlightDisk':
          this.highlightedDiskName = evt.data.devname;
          this.showTile(evt.data.devname);
        break;
        case 'UnhighlightDisk':
          this.hideTile(evt.data.devname);
        break;
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

  createVdevLabelTile(x,y,w,h, className, diskName){
    let color = diskName == this.selectedDisk.devname ? this.selectedDiskColor : this.color;
    let opacity = diskName == this.selectedDisk.devname ? 1 : 0.5;
    opacity = 1;
    this.svg.append("rect")
      .attr('class', className)
      .attr("y", y)
      .attr("x", x)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", color)
      .attr("stroke",color)
      .attr("stroke-opacity", opacity)
      .attr("style", "fill-opacity:0.25; stroke-width:1");
  }


  createVdevLabels(vdev){
    let disks = vdev.disks ? Object.keys(vdev.disks) : [this.selectedDisk.devname]; // NOTE: vdev.slots only has values for current enclosure
    let xOffset = this.chassis.container.x + this.chassis.container.width + 16;
    let freeSpace = this.app._options.width - xOffset;
    let gap = 3;

    disks.forEach((disk, index) => {
      let present = false; // Is the disk in this enclosure?
      let slot = typeof vdev.slots !== 'undefined' ? vdev.slots[disk] : this.selectedDisk.enclosure.slot;

        present = true;
        // Create tile if the disk is in the current enclosure
        let src = this.chassis.driveTrayObjects[slot - 1].container;
        let tray = src.getGlobalPosition();

        let tileClass = "tile tile_" + disk;
        this.createVdevLabelTile(tray.x, tray.y, src.width * this.chassis.container.scale.x, src.height * this.chassis.container.scale.y, tileClass, disk);
        this.trays[ disk ] = {x: tray.x, y: tray.y, width: src.width * this.chassis.container.scale.x, height: src.height * this.chassis.container.scale.y};
      
    });

  }

  calculateParentOffsets(el){
    // Template uses CSS to center and align text so 
    // we need to compensate with absolute positions
    // of wrapper elements
    
    // 1 up
    let legend = el.nativeElement.childNodes[0].childNodes[1];
    
    // 2 up
    let content = el.nativeElement.childNodes[0];

    const xOffset = el.nativeElement.offsetLeft + legend.offsetLeft + content.offsetLeft;
    const yOffset = el.nativeElement.offsetTop + legend.offsetTop + content.offsetTop;

    return {x: xOffset, y: yOffset - 6}
  }

  traceElements(vdev, overlay, retrace?){
    if(retrace){
      this.svg.selectAll("path").remove();
    }

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
        this.createTrace(startX, startY, endX, endY, disk);
      }
    });
  }

  createTrace(startX,startY, endX, endY, diskName){
    let color = diskName == this.selectedDisk.devname ? this.selectedDiskColor : this.color;
    let opacity = diskName == this.selectedDisk.devname ? 1 : 0.25;
  
    let svgPath = "M" + startX + " " + startY + " L" + endX + " " + endY + " Z"

    this.svg.append("path")
      .attr('d', svgPath)
      .attr('stroke', color)//.attr('style', 'stroke-opacity:' + opacity.toString() + ';')
      .attr('stroke-opacity', opacity)
      .attr('class', diskName)

  }

  highlightTrace(devname/*, overlay, color?: string*/){
    if(devname == this.selectedDisk.devname){ return; }

    let targetEl = this.getParent().querySelector('svg path.' + devname);
    targetEl.setAttribute('stroke-opacity', 1);
  }

  unhighlightTrace(devname){
    if(devname == this.selectedDisk.devname){ return; }

    let targetEl = this.getParent().querySelector('svg path.' + devname);
    targetEl.setAttribute('stroke-opacity', 0.25);
  }

  unhighlightAllTraces(traces, exceptions: string[]){
    if(!exceptions){ exceptions = [];}

    traces.forEach((item, index) => {
      if(exceptions.includes(item.className.baseVal)){ return; }
      item.setAttribute('stroke-opacity', 0.25);
    });
    let tiles = this.getParent().querySelectorAll('rect.tile');
    this.showAllTiles(tiles);
  }

  showTrace(devname, overlay){
    let labels = overlay.nativeElement.querySelectorAll('.vdev-disk');
    let paths = this.getParent().querySelectorAll('svg path');
    this.hideAllTraces(paths, [this.selectedDisk.devname, devname]);
    let op = this.getParent();
    let targetEl = op.querySelector('svg path.' + devname);
    targetEl.style['stroke-opacity'] = 1;
  }

  hideAllTraces(traces, exceptions: string[]){
    if(!exceptions){ exceptions = []; }

    traces.forEach((item, index)=>{
      if(exceptions.includes(item.className.baseVal)){ return; }
      item.style['stroke-opacity'] = 0;
    });
  }

  showTile(devname){
    //if(devname == this.selectedDisk.devname){ return; }
    let targetEl = this.getParent().querySelector('rect.tile_' + devname);
    targetEl.style.opacity = 1;
  }

  hideTile(devname){
    //if(devname == this.selectedDisk.devname){ return; }
    let targetEl = this.getParent().querySelector('rect.tile_' + devname);
    targetEl.style.opacity = 0;
  }

  hideAllTiles(tiles, exceptions?:string[]){
    //if(!exceptions){ exceptions = []; }

    tiles.forEach((item, index) => {
      //if(exceptions.includes(item.className.baseVal)){ return; }
      item.style.opacity = 0;
    });
  }

  showAllTiles(tiles, exceptions?: string[]){
    //if(!exceptions){ exceptions = []}
    //console.log('SHOWING ALL TILES');
    tiles.forEach((item, index) => {
      //if(exceptions.includes(item.className.baseVal)){ return; }
      //console.log('PING');
      item.style.opacity = 1;
    })
  }


  protected parseColor(color:string){
    return parseInt("0x" + color.substring(1), 16)
  }

}
