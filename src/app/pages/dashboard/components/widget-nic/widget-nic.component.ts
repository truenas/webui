import {
  Component, AfterViewInit, OnDestroy, Input, ViewChild, ElementRef, OnChanges, SimpleChanges,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  tween,
  styler,
} from 'popmotion';
import { Subject } from 'rxjs';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { DashboardNicState } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';
import { CoreService } from 'app/services/core-service/core.service';

interface NetTraffic {
  sent: string;
  sentUnits: string;
  received: string;
  receivedUnits: string;
}

interface Slide {
  name: string;
  index?: string;
}

@UntilDestroy()
@Component({
  selector: 'widget-nic',
  templateUrl: './widget-nic.component.html',
  styleUrls: ['./widget-nic.component.scss'],
})
export class WidgetNicComponent extends WidgetComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() stats: Subject<CoreEvent>;
  @Input() nicState: DashboardNicState;
  @ViewChild('carousel', { static: true }) carousel: ElementRef;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef;
  traffic: NetTraffic;
  currentSlide = '0';
  private utils: WidgetUtils;

  readonly LinkState = LinkState;
  readonly NetworkInterfaceAliasType = NetworkInterfaceAliasType;

  get currentSlideName(): string {
    return this.path[parseInt(this.currentSlide)].name;
  }

  get previousSlide(): number {
    return this.currentSlide == '0' ? 0 : parseInt(this.currentSlide) - 1;
  }

  title = 'Interface';

  path: Slide[] = [
    { name: this.translate.instant('overview') },
    { name: this.translate.instant('empty') },
    { name: this.translate.instant('empty') },
  ];

  get ipAddresses(): NetworkInterfaceAlias[] {
    if (!this.nicState && !this.nicState.aliases) { return []; }

    return this.nicState.aliases.filter((item) => {
      return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(item.type);
    });
  }

  get linkState(): string {
    if (!this.nicState && !this.nicState.aliases) { return ''; }
    return this.nicState.link_state.replace(/_/g, ' ');
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
    private core: CoreService,
  ) {
    super(translate);
    this.configurable = false;
    this.utils = new WidgetUtils();
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
    this.stats.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.name == 'NetTraffic_' + this.nicState.name) {
        const sent = this.utils.convert(evt.data.sent_bytes_rate);
        const received = this.utils.convert(evt.data.received_bytes_rate);

        this.traffic = {
          sent: sent.value,
          sentUnits: sent.units,
          received: received.value,
          receivedUnits: received.units,
        };
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

  vlanAliases(vlanIndex: string | number): NetworkInterfaceAlias[] {
    if (typeof vlanIndex == 'string') { vlanIndex = parseInt(vlanIndex); }
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
