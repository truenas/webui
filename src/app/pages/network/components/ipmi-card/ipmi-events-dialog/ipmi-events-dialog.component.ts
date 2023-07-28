import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { parse } from 'date-fns';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { trackById } from 'app/helpers/track-by.utils';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './ipmi-events-dialog.component.html',
  styleUrls: ['./ipmi-events-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiEventsDialogComponent implements OnInit {
  protected isLoading = false;
  protected events: IpmiEvent[] = [];

  protected emptyConfig: EmptyConfig = {
    title: this.translate.instant('No events to display.'),
    type: EmptyType.NoPageData,
  };

  protected readonly trackById = trackById;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  get canClear(): boolean {
    return this.events.length > 0 && !this.isLoading;
  }

  onClear(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.ws.job('ipmi.sel.clear').pipe(untilDestroyed(this)).subscribe({
      next: (job) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.events = [];
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseJobError(error));
      },
    });
  }

  getEventDate(event: IpmiEvent): Date {
    return parse(`${event.date} ${event.time}`, 'MMM-dd-yyyy HH:mm:ss', new Date());
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.ws.job('ipmi.sel.elist').pipe(untilDestroyed(this)).subscribe({
      next: (job) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.events = this.sortEvents(job.result);
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseJobError(error));
      },
    });
  }

  private sortEvents(events: IpmiEvent[]): IpmiEvent[] {
    return [...events].sort((a, b) => {
      const aDate = this.getEventDate(a);
      const bDate = this.getEventDate(b);

      return bDate.getTime() - aDate.getTime();
    });
  }
}
