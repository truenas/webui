import { ComponentType } from '@angular/cdk/portal';
import { Type } from '@angular/core';
import { Subject } from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

export interface IncomingSlideInComponent {
  component: ComponentType<unknown>;
  wide: boolean;
  data: unknown;
  swapComponentId?: string;
}

export interface SlideInState {
  components: Map<string, SlideInComponent>;
}

export interface SlideInComponent {
  component: Type<unknown>;
  close$: Subject<SlideInResponse>;
  wide: boolean;
  data: unknown;
  isComponentAlive?: boolean;
}

export interface SlideInResponse<T = unknown> {
  response: T;
  error: unknown;
}

export interface ComponentSerialized {
  id: string;
  component: Type<unknown>;
  close$: Subject<SlideInResponse>;
  data?: unknown;
  wide?: boolean;
  isComponentAlive?: boolean;
}

export type ComponentInSlideIn<D, R> = Type<{
  slideInRef: SlideInRef<D, R>;
}>;
