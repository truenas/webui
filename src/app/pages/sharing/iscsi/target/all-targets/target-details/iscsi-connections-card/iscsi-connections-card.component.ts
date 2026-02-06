import { ChangeDetectionStrategy, Component, effect, input, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import uniqBy from 'lodash-es/uniqBy';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { finalize, take } from 'rxjs';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-iscsi-connections-card',
  styleUrls: ['./iscsi-connections-card.component.scss'],
  templateUrl: './iscsi-connections-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardExpandCollapseComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    NgxSkeletonLoaderModule,
    TranslateModule,
  ],
})
export class IscsiConnectionsCardComponent {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  readonly target = input.required<IscsiTarget>();

  isLoading = signal<boolean>(false);
  sessions = signal<IscsiGlobalSession[] | null>(null);

  constructor() {
    effect(() => {
      this.sessions.set(null);
      this.isLoading.set(true);
      this.getConnectionsByInitiatorId();
    });
  }

  private getConnectionsByInitiatorId(): void {
    this.api.call('iscsi.global.sessions', [[['target_alias', '=', this.target().name]]])
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((sessions) => {
        // Remove duplicates using lodash's uniqBy
        const uniqueSessions = uniqBy(sessions, (session) => `${session.initiator}_${session.initiator_addr}`);
        this.sessions.set(uniqueSessions);
      });
  }
}
