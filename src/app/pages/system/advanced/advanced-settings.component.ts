import {
  AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, TemplateRef, ViewChild,
} from '@angular/core';
import { LayoutService } from 'app/services/layout.service';

@Component({
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private layoutService: LayoutService,
  ) {}

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.layoutService.pageHeaderUpdater$.next(null);
  }
}
