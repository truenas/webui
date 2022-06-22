import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { styler, tween } from 'popmotion';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { Pool, PoolTopologyCategory } from 'app/interfaces/pool.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { VolumeData } from 'app/interfaces/volume-data.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';

interface Slide {
  name: string;
  index?: string;
  dataSource?: any;
  template: TemplateRef<void>;
  topology?: PoolTopologyCategory;
}

interface PoolDiagnosis {
  isHealthy: boolean;
  level: PoolHealthLevel;
}

enum PoolHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-pool',
  templateUrl: './widget-pool.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-pool.component.scss',
  ],
})
export class WidgetPoolComponent extends WidgetComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly VDevStatus = VDevStatus;
  @Input() poolState: Pool;
  @Input() volumeData: VolumeData;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;

  @ViewChild('overview', { static: false }) overview: TemplateRef<void>;
  @ViewChild('data', { static: false }) data: TemplateRef<void>;
  @ViewChild('disks', { static: false }) disks: TemplateRef<void>;
  @ViewChild('diskDetails', { static: false }) diskDetails: TemplateRef<void>;
  @ViewChild('empty', { static: false }) empty: TemplateRef<void>;
  templates: { [template: string]: TemplateRef<void> };
  tpl: TemplateRef<void>;

  readonly PoolStatus = PoolStatus;

  // NAVIGATION
  currentSlide = '0';

  get currentSlideTopology(): PoolTopologyCategory {
    return this.path[parseInt(this.currentSlide)].topology;
  }

  get currentSlideIndex(): number {
    return this.path.length > 0 ? parseInt(this.currentSlide) : Number(this.title);
  }

  get currentSlideName(): string {
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(): number {
    return this.currentSlide === '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  path: Slide[] = [];

  get totalDisks(): string {
    if (this.poolState && this.poolState.topology) {
      let total = 0;
      this.poolState.topology.data.forEach((item) => {
        if (item.type === VDevType.Disk) {
          total++;
        } else {
          total += item.children.length;
        }
      });
      return total.toString();
    }
    return '';
  }

  get unhealthyDisks(): { totalErrors: number | string; disks: string[] } {
    if (this.poolState && this.poolState.topology) {
      const unhealthy: string[] = []; // Disks with errors
      // TODO: Check if this `item.read_errors` and related should read from `stats`
      this.poolState.topology.data.forEach((item: any) => {
        if (item.type === VDevType.Disk) {
          const diskErrors = item.read_errors + item.write_errors + item.checksum_errors;

          if (diskErrors > 0) {
            unhealthy.push(item.disk);
          }
        } else {
          item.children.forEach((device: any) => {
            const diskErrors = device.read_errors + device.write_errors + device.checksum_errors;

            if (diskErrors > 0) {
              unhealthy.push(device.disk);
            }
          });
        }
      });
      return { totalErrors: unhealthy.length/* errors.toString() */, disks: unhealthy };
    }
    return { totalErrors: 'Unknown', disks: [] };
  }

  get allDiskNames(): string[] {
    if (!this.poolState || !this.poolState.topology) {
      return [];
    }

    const allDiskNames: string[] = [];
    (['cache', 'data', 'dedup', 'log', 'spare', 'special'] as PoolTopologyCategory[]).forEach((categoryName) => {
      const category = this.poolState.topology[categoryName];

      if (!category || !category.length) {
        return;
      }

      category.forEach((item) => {
        if (item.type === 'DISK' && item.disk) {
          allDiskNames.push(item.disk);
        } else {
          item.children.forEach((device) => {
            if (!device.disk) {
              return;
            }

            allDiskNames.push(device.disk);
          });
        }
      });
    });

    return allDiskNames;
  }

  title: string;
  voldataavail = false;
  displayValue: string;
  diskSize: string;
  diskSizeLabel: string;
  poolHealth: PoolDiagnosis = {
    isHealthy: true,
    level: PoolHealthLevel.Safe,
  };

  currentDiskDetails: Disk;
  get currentDiskDetailsKeys(): (keyof Disk)[] {
    return this.currentDiskDetails ? Object.keys(this.currentDiskDetails) as (keyof Disk)[] : [];
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private ws: WebSocketService,
  ) {
    super(translate);
    this.configurable = false;
  }

  ngOnInit(): void {
    this.title = this.path.length > 0 && this.poolState && this.currentSlide !== '0' ? this.poolState.name : 'Pool';
    this.tpl = this.overview;
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.volumeData) {
      this.getAvailableSpace();
    }
  }

  ngAfterViewInit(): void {
    this.templates = {
      overview: this.overview,
      data: this.data,
      disks: this.disks,
      empty: this.empty,
      'disk details': this.diskDetails,
    };

    this.path = [
      { name: this.translate.instant('overview'), template: this.overview },
      { name: 'empty', template: this.empty },
      { name: 'empty', template: this.empty },
      { name: 'empty', template: this.empty },
    ];

    this.cdr.detectChanges();

    this.checkVolumeHealth(this.poolState);
  }

  // TODO: Helps with template type checking. To be removed when 'strict' checks are enabled.
  diskKey(key: keyof Disk): keyof Disk {
    return key;
  }

  getAvailableSpace(): number {
    if (!this.volumeData || typeof this.volumeData.avail === undefined) {
      this.displayValue = 'Unknown';
      return;
    }

    let usedValue;
    if (Number.isNaN(this.volumeData.used)) {
      usedValue = this.volumeData.used;
    } else {
      usedValue = filesize(this.volumeData.used, { exponent: 3 });
    }

    if (usedValue === 'Locked') {
      // When Locked, Bail before we try to get details.
      // (errors start after this...)
      return 0;
    }

    if (!Number.isNaN(this.volumeData.avail)) {
      this.voldataavail = true;
    }

    this.displayValue = filesize(this.volumeData.avail, { standard: 'iec' });
    if (this.displayValue.slice(-2) === ' B') {
      this.diskSizeLabel = this.displayValue.slice(-1);
      this.diskSize = new Intl.NumberFormat().format(parseFloat(this.displayValue.slice(0, -2)));
    } else {
      this.diskSizeLabel = this.displayValue.slice(-3);
      this.diskSize = new Intl.NumberFormat().format(parseFloat(this.displayValue.slice(0, -4)));
    }
    // Adds a zero to numbers with one (and only one) digit after the decimal
    if (this.diskSize.charAt(this.diskSize.length - 2) === '.' || this.diskSize.charAt(this.diskSize.length - 2) === ',') {
      this.diskSize = this.diskSize.concat('0');
    }
    this.checkVolumeHealth(this.poolState);
  }

  getDiskDetails(key: string, value: string): void {
    this.ws.call('disk.query', [[[key, '=', value]]]).pipe(untilDestroyed(this)).subscribe((disks) => {
      const currentPath = this.path[this.currentSlideIndex];
      const currentName = currentPath?.dataSource?.disk || 'unknown';

      if ((!currentName || currentName === 'unknown') && disks.length === 0) {
        this.currentDiskDetails = null;
      } else if (currentName && disks.length > 0 && currentName === disks[0].name) {
        delete disks[0].enclosure;
        delete disks[0].name;
        delete disks[0].devname;
        delete disks[0].multipath_name;
        delete disks[0].multipath_member;
        delete disks[0].zfs_guid;
        this.currentDiskDetails = disks[0];
      }
    });
  }

  /**
   * @deprecated Multipath is not supported
   */
  trimMultipath(disk: string): { name: string; fullName?: string } {
    if (!disk) {
      return { name: disk };
    }

    const fullName = disk;

    const spl = fullName.split('-');
    const suffix = spl.length > 1 ? '...  ' : '';
    const name = spl[0] + suffix;

    return {
      name,
      fullName,
    };
  }

  updateSlide(
    name: string,
    verified: boolean,
    slideIndex: number,
    dataIndex?: number,
    topology?: PoolTopologyCategory,
    vdev?: VDev,
  ): void {
    if (name !== 'overview' && !verified) { return; }
    const dataSource = vdev || { children: this.poolState.topology[topology] };
    const direction = parseInt(this.currentSlide) < slideIndex ? 'forward' : 'back';
    if (direction === 'forward') {
      // Setup next path segment
      const slide: Slide = {
        name,
        index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null,
        dataSource: typeof dataSource !== 'undefined' ? dataSource : null,
        template: this.templates[name],
        topology,
      };

      this.path[slideIndex] = slide;
    } else if (direction === 'back') {
      // empty the path segment
      this.path[parseInt(this.currentSlide)] = { name: 'empty', template: this.empty };
    }

    this.updateSlidePosition(slideIndex);
  }

  updateSlidePosition(value: number): void {
    if (value.toString() === this.currentSlide) { return; }

    const carousel = this.carouselParent.nativeElement.querySelector('.carousel');
    const slide = this.carouselParent.nativeElement.querySelector('.slide');

    const el = styler(carousel);
    const slideW = styler(slide).get('width'); // 600;

    const startX = (parseInt(this.currentSlide) * slideW) * -1;
    const endX = (value * slideW) * -1;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start(el.set);

    this.currentSlide = value.toString();
    this.title = this.currentSlide === '0' ? 'Pool' : this.poolState.name;
  }

  private isStatusError(poolState: Pool): boolean {
    return [
      PoolStatus.Faulted,
      PoolStatus.Unavailable,
      PoolStatus.Removed,
    ].includes(poolState.status);
  }

  private isStatusWarning(poolState: Pool): boolean {
    return [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(poolState.status);
  }

  private checkVolumeHealth(poolState: Pool): void {
    const isError = this.isStatusError(poolState);
    const isWarning = this.isStatusWarning(poolState);

    if (isError || isWarning || !poolState.healthy) {
      if (this.poolHealth.isHealthy) {
        this.poolHealth.isHealthy = false;
        this.poolHealth.level = PoolHealthLevel.Warn;
      }
    }

    if (isError) {
      this.poolHealth.level = PoolHealthLevel.Error;
    }

    if (isWarning) {
      this.poolHealth.level = PoolHealthLevel.Warn;
    }
  }

  percentAsNumber(value: string): number {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }
}
