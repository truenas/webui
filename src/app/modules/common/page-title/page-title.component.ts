import {
  AfterViewInit, Component, Input, OnDestroy, OnInit, Type, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { GlobalActionsEvent } from 'app/interfaces/events/global-actions-event.interface';
import { GlobalAction, GlobalActionConfig } from 'app/interfaces/global-action.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { LocaleService } from 'app/services/locale.service';
import { PageTitleService } from 'app/services/page-title.service';

/**
 * @deprecated Use <page-title-header>
 */
@UntilDestroy()
@Component({
  selector: 'pagetitle',
  templateUrl: './page-title.component.html',
})
export class PageTitleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewcontroller', { static: false }) viewcontroller: ViewControllerComponent;
  @Input() breadcrumbs = true;
  title$ = this.pageTitleService.title$;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  hasInitialized = false;
  @Input() set toolbarActionsConfig(actionConfig: GlobalActionConfig) {
    this.globalActionsConfig = actionConfig;
    if (this.hasInitialized) {
      this.renderActions(this.globalActionsConfig);
    }
  }
  private globalActionsConfig: GlobalActionConfig;
  private globalActions: GlobalAction;

  isEnabled = true;
  constructor(
    private core: CoreService,
    private localeService: LocaleService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit(): void {
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
    this.globalActions = this.viewcontroller.create(config.actionType as Type<any>);

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
