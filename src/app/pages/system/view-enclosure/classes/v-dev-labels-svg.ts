import { Selection } from 'd3';
import * as d3 from 'd3';
import { Application, Container, DefaultRendererPlugins } from 'pixi.js';
import { Subject } from 'rxjs';
import { EnclosureSlot, SelectedEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { CoreEvent } from 'app/interfaces/events';
import { HighlightDiskEvent } from 'app/interfaces/events/enclosure-events.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { ThemeChangedEvent } from 'app/interfaces/events/theme-changed-event.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';

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
    private selectedDisk: Disk,
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
        case 'ThemeChanged': {
          const theme = (evt as ThemeChangedEvent).data;
          this.color = theme.blue;
          this.selectedDiskColor = theme.cyan;
          this.highlightColor = theme.yellow;
          break;
        }
        case 'LabelDrives':
          this.createVdevLabels((evt as LabelDrivesEvent).data);
          break;
        case 'DisableHighlightMode':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.showAllTiles(tiles as NodeListOf<HTMLElement>);
          break;
        case 'HighlightDisk':
          tiles = this.getParent().querySelectorAll('rect.tile');
          this.hideAllTiles(tiles as NodeListOf<HTMLElement>);

          this.highlightedDiskName = (evt as HighlightDiskEvent).data.devname;
          this.showTile(this.highlightedDiskName);
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
    (this.app.renderer.plugins as DefaultRendererPlugins).interaction.setTargetElement(this.app.renderer.view);
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

    (this.app.renderer.plugins as DefaultRendererPlugins).interaction.setTargetElement(op.querySelector('canvas.clickpad'));
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
    const color = diskName === this.selectedDisk?.devname ? this.selectedDiskColor : this.color;

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

  createVdevLabels(data: SelectedEnclosureSlot): void {
    const vdevSlots = data.vdevSlots.length ? data.vdevSlots : [data.selected];
    vdevSlots.forEach((enclosureSlot: EnclosureSlot) => {
      // Ignore slots on non-selected enclosure
      if (enclosureSlot.enclosure !== data.selected.enclosure) return;

      // The Actual creating of labels
      // Requirements: diskNames, isOnController
      const isInRange = (
        enclosureSlot?.slot
        && enclosureSlot.slot >= this.chassis.slotRange.start
        && enclosureSlot.slot <= this.chassis.slotRange.end
      );
      if (isInRange) {
        // Create tile if the disk is in the current enclosure
        const dt = this.chassis.driveTrayObjects.find((dto) => parseInt(dto.id) === enclosureSlot.slot);
        const src = dt.container;
        const tray = src.getGlobalPosition();

        const tileClass = enclosureSlot.disk
          ? 'tile tile_' + enclosureSlot.disk.name
          : 'tile tile_empty';

        const tileName = enclosureSlot.disk ? enclosureSlot.disk.name : 'empty';

        const tileWidth = src.width * this.chassis.driveTrays.scale.x * this.chassis.container.scale.x;
        const tileHeight = src.height * this.chassis.driveTrays.scale.y * this.chassis.container.scale.y;

        this.createVdevLabelTile(tray.x, tray.y, tileWidth, tileHeight, tileClass, tileName);
        this.trays[tileName] = {
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
