import {
  AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ProductType } from 'app/enums/product-type.enum';
import { GlobalActionsEvent } from 'app/interfaces/events/global-actions-event.interface';
import { PseudoRouteChangeEvent } from 'app/interfaces/events/pseudo-route-change-event.interface';
import { GlobalAction, GlobalActionConfig } from 'app/interfaces/global-action.interface';
import { LocaleService } from 'app/services/locale.service';
import { PageTitleService } from 'app/services/page-title.service';
import { RoutePart, RoutePartsService } from 'app/services/route-parts/route-parts.service';

@UntilDestroy()
@Component({
  selector: 'pagetitle',
  templateUrl: './page-title.component.html',
})
export class PageTitleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewcontroller', { static: false }) viewcontroller: ViewControllerComponent;
  @Input() breadcrumbs: boolean;
  @Input() product_type: ProductType;
  title$ = this.pageTitleService.title$;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  hasInitialized = false;
  private globalActionsConfig: GlobalActionConfig;
  private globalActions: GlobalAction;

  routeParts: RoutePart[];
  isEnabled = true;
  constructor(
    private router: Router,
    private routePartsService: RoutePartsService,
    private activeRoute: ActivatedRoute,
    private core: CoreService,
    private localeService: LocaleService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit(): void {
  // must be running once to get breadcrumbs
    this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);

    // generate url from parts
    this.routeParts.reverse().map((item, i) => {
      // prepend / to first part
      if (i === 0) {
        item.url = `/${item.url}`;
        if (!item['toplevel']) {
          item.disabled = true;
        }
        return item;
      }
      // prepend previous part to current part
      item.url = `${this.routeParts[i - 1].url}/${item.url}`;
      return item;
    });

    // only execute when routechange
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      untilDestroyed(this),
    ).subscribe(() => {
      this.destroyActions();

      this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);

      // generate url from parts
      this.routeParts.reverse().map((item, i) => {
        // prepend / to first part
        if (i === 0) {
          item.url = `/${item.url}`;
          if (!item['toplevel']) {
            item.disabled = true;
          }
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });

    // Pseudo routing events (for reports page)
    this.core.register({ observerClass: this, eventName: 'PseudoRouteChange' }).pipe(untilDestroyed(this)).subscribe((evt: PseudoRouteChangeEvent) => {
      this.routeParts = evt.data;
      // generate url from parts
      this.routeParts.map((item, i) => {
        // prepend / to first part
        if (i === 0) {
          item.url = `/${item.url}`;
          item.disabled = true;
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });

    this.core.register({ observerClass: this, eventName: 'GlobalActions' }).pipe(untilDestroyed(this)).subscribe((evt: GlobalActionsEvent) => {
      // CONFIG OBJECT EXAMPLE: { actionType: EntityTableAddActionsComponent, actionConfig: this };
      this.globalActionsConfig = evt.data;

      if (this.hasInitialized) {
        this.renderActions(this.globalActionsConfig);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.globalActionsConfig) {
      this.renderActions(this.globalActionsConfig);
    }
    this.hasInitialized = true;
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    delete this.globalActionsConfig;
  }

  renderActions(config: GlobalActionConfig): void {
    if (this.globalActions) {
      this.destroyActions();
    }

    this.viewcontroller.layoutContainer = { layout: 'row', align: 'end center', gap: '2px' };
    this.globalActions = this.viewcontroller.create(config.actionType);

    if (!this.globalActions.applyConfig) {
      throw new Error('Components must implement GlobalAction Interface');
    }

    this.globalActions.applyConfig(config.actionConfig); // Passes entity object
    this.viewcontroller.addChild(this.globalActions);
  }

  destroyActions(): void {
    if (this.globalActions) {
      this.viewcontroller.removeChild(this.globalActions);
      this.globalActionsConfig = null;
    }

    this.globalActions = null;
  }
}
