import {
  AfterViewInit, ChangeDetectionStrategy, Component, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent implements AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private layoutService: LayoutService,
  ) { }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }
}
