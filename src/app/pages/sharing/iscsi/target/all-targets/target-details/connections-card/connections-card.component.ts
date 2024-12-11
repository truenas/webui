import {
  ChangeDetectionStrategy, Component,
  effect,
  input,
  signal,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { finalize, take } from 'rxjs';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-connections-card',
  styleUrls: ['./connections-card.component.scss'],
  templateUrl: './connections-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    NgxSkeletonLoaderModule,
    TranslateModule,
    MatCardContent,
  ],
})
export class ConnectionsCardComponent {
  readonly target = input.required<IscsiTarget>();

  isLoading = signal<boolean>(false);
  sessions = signal<IscsiGlobalSession[]>(null);

  constructor(
    private api: ApiService,
  ) {
    effect(() => {
      this.sessions.set(null);
      this.isLoading.set(true);
      this.getConnectionsByInitiatorId();
    }, { allowSignalWrites: true });
  }

  private getConnectionsByInitiatorId(): void {
    this.api.call('iscsi.global.sessions', [[['target_alias', '=', this.target().name]]])
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((sessions) => {
        this.sessions.set(sessions);
      });
  }
}
