import {
  Component, AfterViewInit, Input, ViewChild, ElementRef, OnChanges, SimpleChanges,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  tween,
  styler,
} from 'popmotion';
import { Subject } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { DashboardNicState } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

interface NetTraffic {
  sent: string;
  sentUnits: string;
  received: string;
  receivedUnits: string;
  linkState: LinkState;
}

interface Slide {
  name: string;
  index?: string;
}

enum Path {
  Overview = 'overview',
  Empty = 'empty',
  Addresses = 'addresses',
  Vlans = 'vlans',
  Interfaces = 'interfaces',
  VlanAddresses = 'vlan addresses',
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-nic',
  templateUrl: './widget-nic.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-nic.component.scss',
  ],
})
export class WidgetNicComponent extends WidgetComponent implements AfterViewInit, OnChanges {
  @Input() stats: Subject<CoreEvent>;
  @Input() nicState: DashboardNicState;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;
  traffic: NetTraffic;
  currentSlide = '0';
  private utils: WidgetUtils;

  readonly LinkState = LinkState;
  readonly NetworkInterfaceAliasType = NetworkInterfaceAliasType;
  readonly PathEnum = Path;

  get currentSlideName(): string {
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(): number {
    return this.currentSlide === '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  defaultTitle = this.translate.instant('Interface');
  title = this.defaultTitle;

  path: Slide[] = [
    { name: this.PathEnum.Overview },
    { name: this.PathEnum.Empty },
    { name: this.PathEnum.Empty },
  ];

  get ipAddresses(): NetworkInterfaceAlias[] {
    if (!this.nicState?.aliases?.length) { return []; }

    return this.nicState.aliases.filter((item) => {
      return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type);
    });
  }

  get linkState(): LinkState {
    if (this.traffic?.linkState) {
      return this.traffic.linkState;
    }
    return this.nicState.link_state;
  }

  get linkStateLabel(): string {
    if (!this.linkState) { return ''; }
    return this.linkState.replace(/_/g, ' ');
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
  ) {
    super(translate);
    this.configurable = false;
    this.utils = new WidgetUtils();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nicState) {
      this.title = this.currentSlide === '0' ? this.defaultTitle : this.nicState.name;
    }
  }

  ngAfterViewInit(): void {
    this.stats.pipe(
      filter((evt) => evt.name === 'NetTraffic_' + this.nicState.name),
      throttleTime(500),
      untilDestroyed(this),
    ).subscribe((evt: CoreEvent) => {
      const sent = this.utils.convert(evt.data.sent_bytes_rate);
      const received = this.utils.convert(evt.data.received_bytes_rate);

      this.traffic = {
        sent: sent.value,
        sentUnits: sent.units,
        received: received.value,
        receivedUnits: received.units,
        linkState: evt.data.link_state as LinkState,
      };
    });
  }

  updateSlide(name: string, verified: boolean, slideIndex: number, dataIndex?: number): void {
    if (name !== this.PathEnum.Overview && !verified) { return; }
    const slide: Slide = {
      name,
      index: typeof dataIndex !== 'undefined' ? dataIndex.toString() : null,
    };

    this.path[slideIndex] = slide;
    this.updateSlidePosition(slideIndex);
  }

  updateSlidePosition(value: number): void {
    if (value.toString() === this.currentSlide) { return; }
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
    this.title = this.currentSlide === '0' ? this.translate.instant('Interface') : this.nicState.name;
  }

  vlanAliases(vlanIndex: string | number): NetworkInterfaceAlias[] {
    if (typeof vlanIndex === 'string') { vlanIndex = parseInt(vlanIndex); }
    const vlan = this.nicState.vlans[vlanIndex];
    return vlan.aliases.filter((item) => {
      return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type);
    });
  }

  manageInterface(nicState: DashboardNicState): void {
    const navigationExtras: NavigationExtras = { state: { editInterface: nicState.name } };
    this.router.navigate(['network'], navigationExtras);
  }
}
