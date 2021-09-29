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
import { DisksDataEvent } from 'app/interfaces/events/disks-data-event.interface';
import { MultipathDataEvent } from 'app/interfaces/events/multipath-event.interface';
import { Multipath } from 'app/interfaces/multipath.interface';
import { Pool, PoolTopologyCategory } from 'app/interfaces/pool.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { VolumeData } from 'app/interfaces/volume-data.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { T } from 'app/translate-marker';

interface Slide {
  name: string;
  index?: string;
  dataSource?: any;
  template: TemplateRef<any>;
  topology?: PoolTopologyCategory;
}

interface PoolDiagnosis {
  isHealthy: boolean;
  warnings: string[];
  errors: string[];
  selector: string;
  level: string;
}

@UntilDestroy()
@Component({
  selector: 'widget-pool',
  templateUrl: './widget-pool.component.html',
  styleUrls: ['./widget-pool.component.scss'],
})
export class WidgetPoolComponent extends WidgetComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() poolState: Pool;
  @Input() volumeData: VolumeData;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;

  @ViewChild('overview', { static: false }) overview: TemplateRef<void>;
  @ViewChild('data', { static: false }) data: TemplateRef<void>;
  @ViewChild('disks', { static: false }) disks: TemplateRef<void>;
  @ViewChild('disk_details', { static: false }) disk_details: TemplateRef<void>;
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
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  path: Slide[] = [];

  get totalDisks(): string {
    if (this.poolState && this.poolState.topology) {
      let total = 0;
      this.poolState.topology.data.forEach((item) => {
        if (item.type == VDevType.Disk) {
          total++;
        } else {
          total += item.children.length;
        }
      });
      return total.toString();
    }
    return '';
  }

  get unhealthyDisks(): { totalErrors: number | string; disks: any[] } {
    if (this.poolState && this.poolState.topology) {
      const unhealthy: any[] = []; // Disks with errors
      this.poolState.topology.data.forEach((item: any) => {
        if (item.type == VDevType.Disk) {
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
    return { totalErrors: 'Unknown', disks: [] as any[] };
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
        if (item.type == 'DISK' && item.disk) {
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
    warnings: [],
    errors: [],
    selector: 'fn-theme-green',
    level: 'safe',
  };

  currentMultipathDetails: Multipath;
  currentDiskDetails: Disk;
  get currentDiskDetailsKeys(): (keyof Disk)[] {
    return this.currentDiskDetails ? Object.keys(this.currentDiskDetails) as (keyof Disk)[] : [];
  }

  constructor(public router: Router, public translate: TranslateService, private cdr: ChangeDetectorRef) {
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
      'disk details': this.disk_details,
    };

    this.path = [
      { name: T('overview'), template: this.overview },
      { name: 'empty', template: this.empty },
      { name: 'empty', template: this.empty },
      { name: 'empty', template: this.empty },
    ];

    this.cdr.detectChanges();

    this.core.register({ observerClass: this, eventName: 'MultipathData' }).pipe(untilDestroyed(this)).subscribe((evt: MultipathDataEvent) => {
      this.currentMultipathDetails = evt.data[0];

      const activeDisk = evt.data[0].children.filter((prop) => prop.status == 'ACTIVE');
      this.core.emit({ name: 'DisksRequest', data: [[['name', '=', activeDisk[0].name]]] });
    });

    this.core.register({ observerClass: this, eventName: 'DisksData' }).pipe(untilDestroyed(this)).subscribe((evt: DisksDataEvent) => {
      const currentPath = this.path[this.currentSlideIndex];
      const currentName = currentPath && currentPath.dataSource
        ? this.currentMultipathDetails
          ? this.checkMultipathLabel(currentPath.dataSource.disk)
          : currentPath.dataSource.disk
            ? currentPath.dataSource.disk
            : 'unknown'
        : 'unknown';

      if ((!currentName || currentName === 'unknown') && evt.data.length == 0) {
        this.currentDiskDetails = null;
      } else if (currentName && evt.data.length > 0 && currentName === evt.data[0].name) {
        delete evt.data[0].enclosure;
        delete evt.data[0].name;
        delete evt.data[0].devname;
        delete evt.data[0].multipath_name;
        delete evt.data[0].multipath_member;
        delete evt.data[0].zfs_guid;
        this.currentDiskDetails = evt.data[0];
      }
    });

    this.checkVolumeHealth();
  }

  // TODO: Helps with template type checking. To be removed when 'strict' checks are enabled.
  diskKey(key: keyof Disk): keyof Disk {
    return key;
  }

  getAvailableSpace(): number {
    if (!this.volumeData || typeof this.volumeData.avail == undefined) {
      this.displayValue = 'Unknown';
      return;
    }

    let usedValue;
    if (Number.isNaN(this.volumeData.used)) {
      usedValue = this.volumeData.used;
    } else {
      usedValue = filesize(this.volumeData.used, { exponent: 3 });
    }

    if (usedValue == 'Locked') {
      // When Locked, Bail before we try to get details.
      // (errors start after this...)
      return 0;
    }

    if (!Number.isNaN(this.volumeData.avail)) {
      this.voldataavail = true;
    }

    this.core.emit({ name: 'PoolDisksRequest', data: [this.poolState.id] });

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
    this.checkVolumeHealth();
  }

  getDiskDetails(key: string, value: string, isMultipath?: boolean): void {
    if (isMultipath && key == 'name') {
      const v = 'multipath/' + this.checkMultipathLabel(value);
      this.core.emit({ name: 'MultipathRequest', data: [[[key, '=', v]]] });
    } else if (!isMultipath) {
      delete this.currentMultipathDetails;
      this.core.emit({ name: 'DisksRequest', data: [[[key, '=', value]]] });
    } else {
      console.warn('If this is a multipath disk, you must query by name!');
    }
  }

  checkMultipathLabel(name: string): string {
    if (name == null) {
      name = 'N/A';
    }
    const truth = this.checkMultipath(name);
    let diskName = name;
    if (truth) {
      const str = name.replace('multipath/', '');
      const spl = str.split('p');
      diskName = spl[0];
    }
    return diskName;
  }

  checkMultipath(name: string): boolean {
    if (name) {
      const truth = name.startsWith('multipath/');
      return truth;
    }
    return false;
  }

  trimMultipath(disk: string): { isMultipath?: boolean; name: string; fullName?: string } {
    if (!disk || disk == null) {
      return { name: disk };
    }

    const isMultipath = disk.includes('multipath/');
    const fullName = isMultipath ? disk.replace('multipath/', '') : disk;

    const spl = fullName.split('-');
    const suffix = spl.length > 1 ? '...  ' : '';
    const name = spl[0] + suffix;

    return {
      isMultipath,
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
    if (direction == 'forward') {
      // Setup next path segment
      const slide: Slide = {
        name,
        index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null,
        dataSource: typeof dataSource !== 'undefined' ? dataSource : null,
        template: this.templates[name],
        topology,
      };

      this.path[slideIndex] = slide;
    } else if (direction == 'back') {
      // empty the path segment
      this.path[parseInt(this.currentSlide)] = { name: 'empty', template: this.empty };
    }

    this.updateSlidePosition(slideIndex);
  }

  updateSlidePosition(value: number): void {
    if (value.toString() == this.currentSlide) { return; }

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
    this.title = this.currentSlide == '0' ? 'Pool' : this.poolState.name;
  }

  checkVolumeHealth(): void {
    switch (this.poolState.status) {
      case PoolStatus.Healthy:
        break;
      case PoolStatus.Locked:
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'locked');
        break;
      case PoolStatus.Unknown:
      case PoolStatus.Offline:
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'unknown');
        break;
      case PoolStatus.Degraded:
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'degraded');
        break;
      case PoolStatus.Faulted:
      case PoolStatus.Unavailable:
      case PoolStatus.Removed:
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, true, 'faulted');
        break;
    }
  }

  updateVolumeHealth(symptom: string, isCritical?: boolean, condition?: string): void {
    if (isCritical) {
      this.poolHealth.errors.push(symptom);
    } else {
      this.poolHealth.warnings.push(symptom);
    }
    if (this.poolHealth.isHealthy) {
      this.poolHealth.isHealthy = false;
    }

    if (this.poolHealth.errors.length > 0) {
      this.poolHealth.level = T('error');
    } else if (this.poolHealth.warnings.length > 0) {
      this.poolHealth.level = T('warn');
    } else {
      this.poolHealth.level = T('safe');
    }

    if (condition === 'locked') {
      this.poolHealth.selector = 'fn-theme-yellow';
    } else if (condition === 'unknown') {
      this.poolHealth.selector = 'fn-theme-blue';
    } else if (condition === 'degraded') {
      this.poolHealth.selector = 'fn-theme-orange';
    } else if (condition === 'faulted') {
      this.poolHealth.selector = 'fn-theme-red';
    } else {
      this.poolHealth.selector = 'fn-theme-green';
    }
  }

  percentAsNumber(value: string): number {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }

  isErrorStatus(status: string): boolean {
    switch (status) {
      case PoolStatus.Online:
      case PoolStatus.Healthy:
      case PoolStatus.Locked:
        return false;
      default:
        return true;
    }
  }
}
