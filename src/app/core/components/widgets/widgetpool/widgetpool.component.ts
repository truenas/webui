import {
  Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, Renderer2, ElementRef, TemplateRef, ChangeDetectorRef, OnChanges, SimpleChanges,
} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { environment } from 'app/../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

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
  // velocity,
  multicast,
  action,
  transform,
  // transformMap,
  // clamp
} from 'popmotion';

interface NetIfInfo {
  name: string;
  primary: string;
  aliases?: string;
}

interface NetTraffic {
  'KB/s in': string;
  'KB/s out': string;
  name: string;
}

interface Slide {
  name: string;
  index?: string;
  dataSource?: any;
  template: TemplateRef<any>;
  topology?: string;
}

interface PoolDiagnosis {
  isHealthy: boolean;
  warnings: string[];
  errors: string[];
  selector: string;
  level: string;
}

export interface Disk {
  name: string;
  smart_enabled: boolean;
  size: number;
  model: string;
  description?: string;
  enclosure_slot?: any;
  expiretime?: any;
  hddstandby?: string;
  serial?: string;
  smartoptions?: string;
  temp?: number;
  displaysize?: string;
}

export interface VolumeData {
  avail?: number;
  id?: number;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  status?: string;
  used?: number;
  used_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
}

@Component({
  selector: 'widget-pool',
  templateUrl: './widgetpool.component.html',
  styleUrls: ['./widgetpool.component.css'],
})
export class WidgetPoolComponent extends WidgetComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() poolState;
  @Input() volumeData: any;// VolumeData;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;

  @ViewChild('overview', { static: false }) overview: TemplateRef<any>;
  @ViewChild('data', { static: false }) data: TemplateRef<any>;
  @ViewChild('disks', { static: false }) disks: TemplateRef<any>;
  @ViewChild('disk_details', { static: false }) disk_details: TemplateRef<any>;
  @ViewChild('empty', { static: false }) empty: TemplateRef<any>;
  templates: any;
  tpl = this.overview;

  // NAVIGATION
  currentSlide = '0';

  get currentSlideTopology() {
    return this.path[parseInt(this.currentSlide)].topology;
  }

  get currentSlideIndex() {
    return this.path.length > 0 ? parseInt(this.currentSlide) : this.title;
  }

  get currentSlideName() {
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide() {
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  path: Slide[] = [];

  private _totalDisks = '';
  get totalDisks() {
    if (this.poolState && this.poolState.topology) {
      let total = 0;
      this.poolState.topology.data.forEach((item) => {
        if (item.type == 'DISK') {
          total++;
        } else {
          total += item.children.length;
        }
      });
      return total.toString();
    }
    return '';
  }

  private _unhealthyDisks: string[];
  get unhealthyDisks() {
    if (this.poolState && this.poolState.topology) {
      const unhealthy = []; // Disks with errors
      this.poolState.topology.data.forEach((item) => {
        if (item.type == 'DISK') {
          const diskErrors = item.read_errors + item.write_errors + item.checksum_errors;

          if (diskErrors > 0) {
            unhealthy.push(item.disk);
          }
        } else {
          item.children.forEach((device) => {
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
    ['cache', 'data', 'dedup', 'log', 'spare', 'special'].forEach((categoryName) => {
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

  title: string = this.path.length > 0 && this.poolState && this.currentSlide !== '0' ? this.poolState.name : 'Pool';
  displayValue: any;
  diskSize: any;
  diskSizeLabel: string;
  poolHealth: PoolDiagnosis = {
    isHealthy: true,
    warnings: [],
    errors: [],
    selector: 'fn-theme-green',
    level: 'safe',
  };

  currentMultipathDetails: any;
  currentDiskDetails: Disk;
  get currentDiskDetailsKeys() {
    return this.currentDiskDetails ? Object.keys(this.currentDiskDetails) : [];
  }

  constructor(public router: Router, public translate: TranslateService, private cdr: ChangeDetectorRef) {
    super(translate);
    this.configurable = false;
  }

  ngOnDestroy() {
    this.core.unregister({ observerClass: this });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.poolState) {
    }

    if (changes.volumeData) {
      this.getAvailableSpace();
    }
  }

  ngOnInit() {
  }

  ngAfterContentInit() {

  }

  ngAfterViewInit() {
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

    this.core.register({ observerClass: this, eventName: 'MultipathData' }).subscribe((evt: CoreEvent) => {
      this.currentMultipathDetails = evt.data[0];

      const activeDisk = evt.data[0].children.filter((prop) => prop.status == 'ACTIVE');
      this.core.emit({ name: 'DisksRequest', data: [[['name', '=', activeDisk[0].name]]] });
    });

    this.core.register({ observerClass: this, eventName: 'DisksData' }).subscribe((evt: CoreEvent) => {
      const currentName = this.path[this.currentSlideIndex] && this.path[this.currentSlideIndex].dataSource
        ? this.currentMultipathDetails
          ? this.checkMultipathLabel(this.path[this.currentSlideIndex].dataSource.disk)
          : this.path[this.currentSlideIndex].dataSource.disk
            ? this.path[this.currentSlideIndex].dataSource.disk
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

  getAvailableSpace() {
    if (!this.volumeData || typeof this.volumeData.avail == undefined) {
      this.displayValue = 'Unknown';
      return;
    }

    let usedValue;
    if (isNaN(this.volumeData.used)) {
      usedValue = this.volumeData.used;
    } else {
      const usedObj = (<any>window).filesize(this.volumeData.used, { output: 'object', exponent: 3 });
      usedValue = usedObj.value;
    }
    const used: ChartData = {
      legend: 'Used',
      data: [usedValue],
    };

    if (usedValue == 'Locked') {
      // When Locked, Bail before we try to get details.
      // (errors start after this...)
      return 0;
    }

    this.displayValue = (<any>window).filesize(this.volumeData.avail, { standard: 'iec' });
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

  getDiskDetails(key: string, value: string, isMultipath?: boolean) {
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

  checkMultipathLabel(name) {
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

  checkMultipath(name: string) {
    if (name) {
      const truth = name.startsWith('multipath/');
      return truth;
    }
    return false;
  }

  trimMultipath(disk, vdev?) {
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

  updateSlide(name: string, verified: boolean, slideIndex: number, dataIndex?: number, topology?: string, vdev?: any) {
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

  updateSlidePosition(value) {
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

  checkVolumeHealth() {
    switch (this.poolState.status) {
      case 'ONLINE':
      case 'HEALTHY':
        break;
      case 'LOCKED':
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'locked');
        break;
      case 'UNKNOWN':
      case 'OFFLINE':
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'unknown');
        break;
      case 'DEGRADED':
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, false, 'degraded');
        break;
      case 'FAULTED':
      case 'UNAVAIL':
      case 'REMOVED':
        this.updateVolumeHealth('Pool status is ' + this.poolState.status, true, 'faulted');
        break;
    }
  }

  updateVolumeHealth(symptom: string, isCritical?: boolean, condition?: string) {
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

  nextPath(obj: any, index: number | string) {
    if (typeof index == 'string') { index = parseInt(index); }
    return obj[index];
  }

  percentAsNumber(value: string) {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }

  isErrorStatus(status: string): boolean {
    switch (status) {
      case 'ONLINE':
      case 'HEALTHY':
        return false;
      default:
        return true;
    }
  }
}
