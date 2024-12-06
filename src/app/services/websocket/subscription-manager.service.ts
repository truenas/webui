import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import {
  filter, map, Observable, share, tap,
} from 'rxjs';
import { isCollectionUpdateMessage, isSuccessfulResponse } from 'app/helpers/api.helper';
import { ApiEventMethod, ApiEventTyped, CollectionUpdateMessage } from 'app/interfaces/api-message.interface';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

type Method = ApiEventMethod | `${ApiEventMethod}:${string}`;

/**
 * Subscription id that backend responds on core.subscribe.
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases
type BackendSubscriptionId = string;

/**
 * Our id of the core.subscribe message.
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases
type SubscribeMessageId = string;

@Injectable({
  providedIn: 'root',
})
export class SubscriptionManagerService {
  private openSubscriptions = new Map<string, Observable<unknown>>();

  /**
   * When subscription is established, middleware returns a subscription ID.
   */
  private establishedSubscriptions = new Map<Method, BackendSubscriptionId>();
  private pendingSubscriptions = new Map<SubscribeMessageId, Method>();
  private subscriptionsToClose = new Set<Method>();

  constructor(
    private wsHandler: WebSocketHandlerService,
  ) {
    this.listenForSubscriptionsToBeEstablished();
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: Method): Observable<ApiEventTyped<K>> {
    if (this.openSubscriptions.has(method)) {
      return this.openSubscriptions.get(method) as Observable<ApiEventTyped<K>>;
    }

    const subscription$ = new Observable<ApiEventTyped<K>>((subscriber) => {
      this.initiateNewSubscription(method);

      this.wsHandler.responses$.pipe(
        filter((message) => {
          return isCollectionUpdateMessage(message) && message.params.collection === method;
        }),
        map((message: CollectionUpdateMessage) => message.params),
      ).subscribe(subscriber);

      return () => {
        // Unsubscribe
        this.markSubscriptionToBeCancelled(method);
      };
    }).pipe(share());

    this.openSubscriptions.set(method, subscription$);

    return subscription$;
  }

  private initiateNewSubscription(method: Method): void {
    if (this.subscriptionsToClose.has(method)) {
      // We changed our mind about closing a subscription.
      this.subscriptionsToClose.delete(method);
    }

    const id = UUID.UUID();
    this.wsHandler.scheduleCall({
      id,
      method: 'core.subscribe',
      params: [method],
    });
    this.pendingSubscriptions.set(id, method);
  }

  private listenForSubscriptionsToBeEstablished(): void {
    this.wsHandler.responses$.pipe(
      tap((message) => {
        const isSubscriptionConfirmation = isSuccessfulResponse(message) && this.pendingSubscriptions.has(message.id);
        if (!isSubscriptionConfirmation) {
          return;
        }

        const pendingSubscription = this.pendingSubscriptions.get(message.id);
        const backendSubscriptionId = message.result as BackendSubscriptionId;
        this.onSubscriptionEstablished(pendingSubscription, backendSubscriptionId);
        this.pendingSubscriptions.delete(message.id);
      }),
    ).subscribe();
  }

  private markSubscriptionToBeCancelled(method: Method): void {
    const wasSubscriptionEstablished = this.establishedSubscriptions.has(method);
    if (wasSubscriptionEstablished) {
      this.cancelSubscription(method);
      return;
    }

    // This can happen if consumer is attempting to unsubscribe before the subscription is established.
    // In this case, we will remember to close the subscription when it is established.
    this.subscriptionsToClose.add(method);
  }

  private onSubscriptionEstablished(method: Method, id: BackendSubscriptionId): void {
    this.establishedSubscriptions.set(method, id);

    if (this.subscriptionsToClose.has(method)) {
      this.cancelSubscription(method);
    }
  }

  private cancelSubscription(method: Method): void {
    const backendSubscriptionId = this.establishedSubscriptions.get(method);
    this.wsHandler.scheduleCall({
      id: UUID.UUID(),
      method: 'core.unsubscribe',
      params: [backendSubscriptionId],
    });

    this.establishedSubscriptions.delete(method);
    this.openSubscriptions.delete(method);
  }
}
