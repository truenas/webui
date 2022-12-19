import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, filter, map, switchMap, tap,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

export interface DockerImagesState {
  isLoading: boolean;
  error: string;
  entities: ContainerImage[];
}

const initialState: DockerImagesState = {
  isLoading: false,
  entities: [],
  error: null,
};

@Injectable({ providedIn: 'root' })
export class DockerImagesComponentStore extends ComponentStore<DockerImagesState> {
  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
  ) {
    super(initialState);
  }

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isError$ = this.select((state) => state.error);
  readonly entities$ = this.select((state) => state.entities);
  readonly entitiesTotal$ = this.select((state) => state.entities.length);

  readonly loadEntities = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.setState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return this.ws.call('container.image.query').pipe(
          tap((entities) => this.patchState({ entities })),
          catchError((error) => {
            new EntityUtils().errorReport(error, this.dialog);

            this.patchState({
              isLoading: false,
              error: 'Docker Images could not be loaded',
            });

            return EMPTY;
          }),
        );
      }),
    );
  });

  readonly subscribeToUpdates = this.effect(() => {
    return this.ws.newSub('core.get_jobs').pipe(
      filter((event) => (
        this.isImagePullSuccessfull(event)
          && !this.isEventRemoved(event)
      )),
      switchMap(() => this.ws.call('container.image.query')),
      map((entities) => this.patchState({ entities })),
    );
  });

  isImagePullSuccessfull(event: ApiEvent<Job<unknown, unknown[]>>): boolean {
    return event.fields.method === 'container.image.pull'
    && event.fields.state === JobState.Success;
  }

  readonly subscribeToRemoval = this.effect(() => {
    return this.ws.newSub('container.image.query').pipe(
      filter((event) => this.isEventRemoved(event)),
      map((event) => this.entityDeleted(event.id.toString())),
    );
  });

  isEventRemoved(event: ApiEvent<unknown>): boolean {
    return event.msg === IncomingApiMessageType.Removed;
  }

  entityDeleted = this.updater((state, entityId: string) => {
    const index = state.entities.findIndex((entity) => entity.id === entityId);

    return {
      ...state,
      entities: [
        ...state.entities.slice(0, index),
        ...state.entities.slice(index + 1),
      ],
    };
  });
}
