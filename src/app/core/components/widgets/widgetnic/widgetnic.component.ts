import {
  Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, Renderer2, ElementRef, OnChanges, SimpleChanges,
} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { NavigationExtras, Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
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
  sent: string;
  sentUnits: string;
  received: string;
  receivedUnits: string;
}

interface Converted {
  value: string;
  units: string;
}

interface Slide {
  name: string;
  index?: string;
}

@Component({
  selector: 'widget-nic',
  templateUrl: './widgetnic.component.html',
  styleUrls: ['./widgetnic.component.css'],
})
export class WidgetNicComponent extends WidgetComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() stats: any;
  @Input() nicState: any;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;
  traffic: NetTraffic;
  currentSlide = '0';

  get currentSlideName(): string {
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(): number {
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  title = 'Interface';

  path: Slide[] = [
    { name: T('overview') },
    { name: T('empty') },
    { name: T('empty') },
  ];

  get ipAddresses() {
    if (!this.nicState && !this.nicState.aliases) { return []; }

    const result = this.nicState.aliases.filter((item: any) => item.type == 'INET' || item.type == 'INET6');

    return result;
  }

  get vlanAddresses() {
    if (!this.nicState) { return []; }
    if (this.path[2].name == 'empty' || this.nicState.vlans.length == 0 || !this.nicState.vlans[parseInt(this.path[2].index)]) { return []; }

    const vlan = this.nicState.vlans[parseInt(this.path[2].index)];
    const result = vlan.aliases.filter((item: any) => item.type == 'INET' || item.type == 'INET6');

    return result;
  }

  get linkState() {
    if (!this.nicState && !this.nicState.aliases) { return []; }
    return this.nicState.link_state.replace(/_/g, ' ');
  }

  constructor(public router: Router, public translate: TranslateService) {
    super(translate);
    this.configurable = false;
  }

  ngOnDestroy(): void {
    this.core.emit({ name: 'StatsRemoveListener', data: { name: 'NIC', obj: this } });
    this.core.unregister({ observerClass: this });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nicState) {
      this.title = this.currentSlide == '0' ? 'Interface' : this.nicState.name;
    }
  }

  ngAfterViewInit(): void {
    this.stats.subscribe((evt: CoreEvent) => {
      if (evt.name == 'NetTraffic_' + this.nicState.name) {
        const sent: Converted = this.convert(evt.data.sent_bytes_rate);
        const received: Converted = this.convert(evt.data.received_bytes_rate);

        const t = {
          sent: sent.value,
          sentUnits: sent.units,
          received: received.value,
          receivedUnits: received.units,
        };

        this.traffic = t; // evt.data;
      }
    });
  }

  updateSlide(name: string, verified: boolean, slideIndex: number, dataIndex?: number): void {
    if (name !== 'overview' && !verified) { return; }
    const slide: Slide = {
      name,
      index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null,
    };

    this.path[slideIndex] = slide;
    this.updateSlidePosition(slideIndex);
  }

  updateSlidePosition(value: number): void {
    if (value.toString() == this.currentSlide) { return; }
    const carousel = this.carouselParent.nativeElement.querySelector('.carousel');
    const slide = this.carouselParent.nativeElement.querySelector('.slide');

    const el = styler(carousel);
    const slideW = styler(slide).get('width');

    tween({
      from: { x: (parseInt(this.currentSlide) * 100) * -1 },
      to: { x: (value * slideW) * -1 },
      duration: 250,
    }).start(el.set);

    this.currentSlide = value.toString();
    this.title = this.currentSlide == '0' ? 'Interface' : this.nicState.name;
  }

  vlanAliases(vlanIndex: string|number) {
    if (typeof vlanIndex == 'string') { vlanIndex = parseInt(vlanIndex); }
    const vlan = this.nicState.vlans[vlanIndex];
    const result = vlan.aliases.filter((item: any) => item.type == 'INET' || item.type == 'INET6');
    return result;
  }

  getMbps(arr: number[]): number | string {
    // NOTE: Stat is in bytes so we convert
    // no average
    const result = arr[0] / 1024 / 1024;
    if (result > 999) {
      return result.toFixed(1);
    } if (result < 1000 && result > 99) {
      return result.toFixed(2);
    } if (result > 9 && result < 100) {
      return result.toFixed(3);
    } if (result < 10) {
      return result.toFixed(4);
    }
    return -1;
  }

  convert(value: number): Converted {
    let result;
    let units;

    // uppercase so we handle bits and bytes...
    switch (this.optimizeUnits(value)) {
      case 'B':
      case 'KB':
        units = T('KiB');
        result = value / 1024;
        break;
      case 'MB':
        units = T('MiB');
        result = value / 1024 / 1024;
        break;
      case 'GB':
        units = T('GiB');
        result = value / 1024 / 1024 / 1024;
        break;
      case 'TB':
        units = T('TiB');
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      case 'PB':
        units = T('PiB');
        result = value / 1024 / 1024 / 1024 / 1024 / 1024;
        break;
      default:
        units = T('KiB');
        result = 0.00;
    }

    return result ? { value: result.toFixed(2), units } : { value: '0.00', units };
  }

  optimizeUnits(value: number): string {
    let units = 'B';
    if (value > 1024 && value < (1024 * 1024)) {
      units = 'KB';
    } else if (value >= (1024 * 1024) && value < (1024 * 1024 * 1024)) {
      units = 'MB';
    } else if (value >= (1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024)) {
      units = 'GB';
    } else if (value >= (1024 * 1024 * 1024 * 1024) && value < (1024 * 1024 * 1024 * 1024 * 1024)) {
      units = 'TB';
    }

    return units;
  }

  manageInterface(_interface: any): void {
    const navigationExtras: NavigationExtras = { state: { editInterface: _interface.name } };
    this.router.navigate(['network'], navigationExtras);
  }
}
