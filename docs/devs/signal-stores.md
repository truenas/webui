# Feature stores

Feature-level state (a page's list, its loading flag, a selection) lives in an `@Injectable()` class built on
`@ngrx/signals`. `@ngrx/component-store` is being retired: stores still on it are converted one feature at a time,
and new stores must not use it.

The store stays a class, so it is provided and injected exactly as before (`providers: [MyStore]`, `inject(MyStore)`)
and specs keep mocking it with `mockProvider(MyStore, { ... })`.

### Shape

```typescript
@Injectable()
export class CertificatesStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly certificates = this.state.certificates;

  readonly loadCertificates = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap(() => this.api.query('certificate.query').pipe(
      tapResponse({
        next: (certificates) => patchState(this.state, { certificates }),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
        finalize: () => patchState(this.state, { isLoading: false }),
      }),
    )),
  ));
}
```

- Keep `state` private. Expose read-only signals: the `signalState` slices directly, or `computed()` for derived
  values. Consumers read them in templates as `store.isLoading()`; no `| async`, no `subscribe` + `markForCheck`.
- Change state only through methods on the store, with `patchState`.

### Converting a ComponentStore

| ComponentStore | `@ngrx/signals` |
|---|---|
| `extends ComponentStore<S>` + `super(initialState)` | `private readonly state = signalState(initialState)` |
| `this.select((s) => s.x)` / `this.state().x` | `this.state.x`, or `computed(() => ...)` |
| `this.setState` / `this.patchState` | `patchState(this.state, { ... })` |
| `this.updater((s, v) => ...)` | a plain method calling `patchState` |
| `this.effect((trigger$) => trigger$.pipe(...))` | `rxMethod<T>(pipe(...))` |
| `this.get()` | read the signal: `this.state.x()` |

- Handle errors with `tapResponse` (from `@ngrx/operators`) **inside** the `switchMap`. A `catchError` outside it
  completes the whole method, so every later call silently does nothing.
- Use `tapResponse`'s `finalize` to clear loading flags, so they also clear when the call fails.
- Call an `rxMethod` with plain values (`store.loadPermissions(mountpoint)`). Passing a signal or an observable from
  outside an injection context logs a deprecation warning, which fails the spec.

### Consumers

- Replace `toSignal(store.x$)` and `state$.subscribe(...)` copies into local signals with the store's signal itself.
- Work that has to happen when a value changes (feeding a data provider, keeping a local copy) is an `effect()` in
  the component's constructor. A value derived from store state that the component then edits locally is a
  `linkedSignal`.

### Specs

- Mock signals with `signal(...)`, not `of(...)`: `mockProvider(MyStore, { isLoading: signal(false), load: jest.fn() })`.
- In store specs, read the public signals after `await settleApi()` instead of `firstValueFrom(store.state$)`.
