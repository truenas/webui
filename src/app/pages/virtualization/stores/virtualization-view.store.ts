import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

export interface VirtualizationViewState {
  isLoading: boolean;
  showMobileDetails: boolean;
  isMobileView: boolean;
}

const initialState: VirtualizationViewState = {
  isLoading: false,
  showMobileDetails: false,
  isMobileView: false,
};

@UntilDestroy()
@Injectable()
export class VirtualizationViewStore extends ComponentStore<VirtualizationViewState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly showMobileDetails = computed(() => this.stateAsSignal().showMobileDetails);
  readonly isMobileView = computed(() => this.stateAsSignal().isMobileView);

  constructor(
    private breakpointObserver: BreakpointObserver,
  ) {
    super(initialState);
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        return this.breakpointObserver
          .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
          .pipe(
            tap((state: BreakpointState) => {
              if (state.matches) {
                this.patchState({
                  isMobileView: true,
                });
              } else {
                this.patchState({
                  isMobileView: false,
                  showMobileDetails: false,
                });
              }
            }),
            untilDestroyed(this),
          );
      }),
    );
  });

  setMobileDetails(showMobileDetails: boolean): void {
    this.patchState({ showMobileDetails });
  }

  closeMobileDetails(): void {
    this.patchState({ showMobileDetails: false });
  }
}
