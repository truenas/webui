import { Selection } from 'd3';
import * as d3 from 'd3';
import { Application, Container } from 'pixi.js';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { Theme } from 'app/interfaces/theme.interface';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { EnclosureDisk, VDevMetadata } from 'app/pages/system/view-enclosure/classes/system-profiler';

export class VDevLabelsSvg {
  /*
  * We create an SVG layer on top of the PIXI canvas
  * to achieve crisper lines. Apparently drawing
  * thin lines in WebGL is problematic without
  * resorting to caching them as bitmaps which
  * essentially renders them static.
  *
  */

  events$: Subject<CoreEvent>;

  protected svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>; // Our d3 generated svg layer
  protected mainStage: Container; // WebGL Canvas
  color: string;
  selectedDiskColor: string;
  highlightColor: string;
  highlightedDiskName: string;

  private trays: Record<string, { x: number; y: number; width: number; height: number }> = {};

  constructor(
    private chassis: ChassisView,
    private app: Application,
    private selectedDisk: EnclosureDisk,
    theme: Theme,
  ) {
    this.color = 'var(--cyan)';
    this.selectedDiskColor = 'var(--yellow)';
    this.highlightColor = theme.yellow;

    this.onInit();
  }

  onInit(): void {
    this.mainStage = this.app.stage;
    this.d3Init();

    let tiles;
    this.events$ = new Subject<CoreEvent>();
    this.events$.subscribe((evt: CoreEvent): void => {
      switch (evt.name) {
        case 'ThemeChanged':
          const theme = evt.data;
          this.color = theme.blue;
          this.selectedDiskColor = theme.cyan;
          this.highlightColor = theme.yellow;
          break;
        case 'LabelDrives':
          this.createVdevLabels(evt.data);
          break;
        case 'OverlayReady':
          break;
        case 'ShowPath':
          break;
        case 'HidePath':
          break;
        case 'EnableHighlightMode':
          break;
        case 'DisableHighlightMode':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.showAllTiles(tiles as NodeListOf<HTMLElement>);
          break;
        case 'HighlightDisk':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.hideAllTiles(tiles as NodeListOf<HTMLElement>);

          this.highlightedDiskName = evt.data.devname;
          this.showTile(evt.data.devname);
          break;
        case 'UnhighlightDisk':
          break;
      }
    });
  }

  // Animate into view
  enter(): void {
  }

  // Animate out of view
  exit(): void {
    const op = this.getParent();
    d3.select('#' + op.id + ' svg').remove();
    d3.select('#' + op.id + ' canvas.clickpad').remove();
    this.app.renderer.plugins.interaction.setTargetElement(this.app.renderer.view);
  }

  d3Init(): void {
    const op = this.getParent();

    this.svg = d3.select('#' + op.id).append('svg')
      .attr('width', op.offsetWidth)
      .attr('height', op.offsetHeight)
      .attr('style', 'position:absolute; top:0; left:0;');

    /* const clickpad = */
    d3.select('#' + op.id).append('canvas') // This element will capture pointer for PIXI
      .attr('class', 'clickpad')
      .attr('width', op.offsetWidth)
      .attr('height', op.offsetHeight)
      .attr('style', 'position:absolute; top:0; left:0;');

    this.app.renderer.plugins.interaction.setTargetElement(op.querySelector('canvas.clickpad'));
  }

  getParent(): HTMLElement {
    return this.app.renderer.view.offsetParent as HTMLElement;
  }

  createVdevLabelTile(
    x: number,
    y: number,
    width: number,
    height: number,
    className: string,
    diskName: string,
  ): void {
    const color = diskName === this.selectedDisk.devname ? this.selectedDiskColor : this.color;

    const style = 'fill-opacity:0.25; stroke-width:1';

    this.svg.append('rect')
      .attr('class', className)
      .attr('y', y)
      .attr('x', x)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('stroke-opacity', 1)
      .attr('style', style);
  }

  createVdevLabels(vdev: VDevMetadata): void {
    const disks = vdev.disks
      ? Object.keys(vdev.disks)
      : [this.selectedDisk.devname]; // NOTE: vdev.slots only has values for current enclosure

    disks.forEach((disk) => {
      const slot = typeof vdev.slots !== 'undefined' ? vdev.slots[disk] : this.selectedDisk.enclosure.slot;

      if (slot && slot >= this.chassis.slotRange.start && slot <= this.chassis.slotRange.end) {
        // Create tile if the disk is in the current enclosure
        const dt = this.chassis.driveTrayObjects.find((dto) => parseInt(dto.id) === slot);
        const src = dt.container;
        const tray = src.getGlobalPosition();

        const tileClass = 'tile tile_' + disk;

        const tileWidth = src.width * this.chassis.driveTrays.scale.x * this.chassis.container.scale.x;
        const tileHeight = src.height * this.chassis.driveTrays.scale.y * this.chassis.container.scale.y;

        this.createVdevLabelTile(tray.x, tray.y, tileWidth, tileHeight, tileClass, disk);
        this.trays[disk] = {
          x: tray.x, y: tray.y, width: tileWidth, height: tileHeight,
        };
      }
    });
  }

  showTile(devname: string): void {
    const targetEl: HTMLElement = this.getParent().querySelector('rect.tile_' + devname);
    if (targetEl) {
      targetEl.style.opacity = '1';
    }
  }

  hideTile(devname: string): void {
    const targetEl: HTMLElement = this.getParent().querySelector('rect.tile_' + devname);
    if (targetEl) {
      targetEl.style.opacity = '0';
    }
  }

  hideAllTiles(tiles: NodeListOf<HTMLElement>): void {
    tiles.forEach((item) => {
      item.style.opacity = '0';
    });
  }

  showAllTiles(tiles: NodeListOf<HTMLElement>): void {
    tiles.forEach((item) => {
      item.style.opacity = '1';
    });
  }
}
