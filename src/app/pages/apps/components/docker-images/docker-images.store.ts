import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, filter, map, switchMap, tap,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ContainerImage } from 'app/interfaces/container-image.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
  ) {
    super(initialState);
  }

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isError$ = this.select((state) => state.error);
  readonly entities$ = this.select((state) => state.entities);

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
          catchError((error: WebsocketError) => {
            this.dialog.error(this.errorHandler.parseWsError(error));

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
    return this.ws.subscribe('core.get_jobs').pipe(
      filter((event) => {
        const isImagePullMethod = event.fields.method === 'container.image.pull';
        const isSuccessState = event.fields.state === JobState.Success;
        const isRemovedMsg = event.msg === IncomingApiMessageType.Removed;
        return isImagePullMethod && isSuccessState && !isRemovedMsg;
      }),
      switchMap(() => this.ws.call('container.image.query')),
      map((entities) => this.patchState({ entities })),
    );
  });

  readonly subscribeToRemoval = this.effect(() => {
    return this.ws.subscribe('container.image.query').pipe(
      filter((event) => event.msg === IncomingApiMessageType.Removed),
      map((event) => this.entityDeleted(event.id.toString())),
    );
  });

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
