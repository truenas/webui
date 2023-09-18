import {
  Component, AfterViewInit, Input, ViewChild, ElementRef, OnInit, ChangeDetectorRef, ChangeDetectionStrategy,
} from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  tween,
  styler,
} from 'popmotion';
import { filter, map, throttleTime } from 'rxjs/operators';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { DashboardNicState } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard/utils/deep-clone-state.helper';

interface NetTraffic {
  sent: number;
  received: number;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetNicComponent extends WidgetComponent implements AfterViewInit, OnInit {
  @Input() nic: string;
  protected nicState: DashboardNicState;
  @ViewChild('carousel', { static: true }) carousel: ElementRef<HTMLElement>;
  @ViewChild('carouselparent', { static: false }) carouselParent: ElementRef<HTMLElement>;
  traffic: NetTraffic;
  currentSlide = '0';

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
    private resourcesUsageStore$: ResourcesUsageStore,
    private cdr: ChangeDetectorRef,
  ) {
    super(translate);
  }

  ngOnInit(): void {
    this.resourcesUsageStore$.nics$.pipe(
      map((nics) => nics.find((nic) => nic.name === this.nic)),
      filter(Boolean),
      deepCloneState(),
      untilDestroyed(this),
    ).subscribe((nicState) => {
      this.nicState = nicState.state;
      this.title = this.currentSlide === '0' ? this.defaultTitle : this.nicState.name;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.resourcesUsageStore$.interfacesUsage$.pipe(
      map((nicUsageUpdate) => nicUsageUpdate[this.nic]),
      filter(Boolean),
      throttleTime(500),
      deepCloneState(),
      untilDestroyed(this),
    ).subscribe((nicUpdate) => {
      this.traffic = {
        sent: nicUpdate.sent_bytes_rate * KiB,
        received: nicUpdate.received_bytes_rate * KiB,
        linkState: nicUpdate.link_state,
      };
      this.cdr.markForCheck();
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
    const slideW = styler(slide).get('width') as number;

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
