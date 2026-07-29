import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnEmptyComponent } from '@truenas/ui-components';
import { parse } from 'date-fns';
import { JobState } from 'app/enums/job-state.enum';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-ipmi-events-dialog',
  templateUrl: './ipmi-events-dialog.component.html',
  styleUrls: ['./ipmi-events-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    FakeProgressBarComponent,
    TnEmptyComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class IpmiEventsDialog implements OnInit {
  protected dialogRef = inject<DialogRef<unknown, IpmiEventsDialog>>(DialogRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected events: IpmiEvent[] = [];

  protected get canClear(): boolean {
    return this.events.length > 0 && !this.isLoading();
  }

  protected onClear(): void {
    this.isLoading.set(true);
    this.api.job('ipmi.sel.clear').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (job) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.events = [];
      },
      complete: () => {
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected getEventDate(event: IpmiEvent): Date {
    return parse(`${event.date} ${event.time}`, 'MMM-dd-yyyy HH:mm:ss', new Date());
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.isLoading.set(true);
    this.api.call('ipmi.sel.elist').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (events) => {
        this.events = this.sortEvents(events);
      },
      complete: () => {
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
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
