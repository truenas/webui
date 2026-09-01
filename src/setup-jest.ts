// eslint-disable-next-line max-classes-per-file
import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { HighContrastModeDetector } from '@angular/cdk/a11y';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { defineGlobalsInjections } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import {
  MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule, TranslateFakeLoader,
} from '@ngx-translate/core';
import {
  LabelMarkupPipe,
  TN_DEFAULT_FALLBACK_LABELS,
  TN_FALLBACK_LABELS,
  TN_TEST_ATTR, TnButtonComponent, TnIconButtonComponent, TnIconComponent, TnIconTesting,
  TnInputComponent,
  TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective, TnTablePagerComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import failOnConsole from 'jest-fail-on-console';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { MockComponent, MockProvider, ngMocks } from 'ng-mocks';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import {
  Observable,
} from 'rxjs';
import { defaultLanguage } from 'app/constants/languages.constant';
import { provideTnSelectLabels } from 'app/core/providers/tn-select-labels.provider';
import { EmptyApiService } from 'app/core/testing/utils/empty-api.service';
import { EmptyAuthService } from 'app/core/testing/utils/empty-auth.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxIconGroupComponent } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IcuMissingTranslationHandler } from 'app/modules/language/translations/icu-missing-translation-handler';
import {
  WithLoadingStateDirective,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Nothing renders this. It exists so the global `declarations` array is non-empty and holds an
 * ng-mocks mock: ng-mocks only patches `TestBed.configureTestingModule` to tolerate
 * re-configuration when a mock declaration is present, and specs that nest a
 * `createComponentFactory` inside a describe whose outer `beforeEach` already created a component
 * rely on that tolerance. `ix-modal-header`'s global mock used to supply it; this replaces it.
 */
/* eslint-disable @angular-eslint/prefer-standalone, @angular-eslint/prefer-on-push-component-change-detection,
   angular-file-naming/component-filename-suffix -- a declarations-array anchor, never rendered. */
@Component({ selector: 'ix-global-declarations-anchor', template: '', standalone: false })
class GlobalDeclarationsAnchorComponent {}
/* eslint-enable @angular-eslint/prefer-standalone, @angular-eslint/prefer-on-push-component-change-detection,
   angular-file-naming/component-filename-suffix */

setupZoneTestEnv();

// `TnCardComponent` imports `TnButtonComponent`, which imports `LabelMarkupPipe`
// (the pipe that renders a tn-button's `[label]`). When ng-mocks deep-mocks any
// component that transitively imports `TnCardComponent`, it also mocks this pipe,
// and the mocked `transform()` returns empty — silently blanking the label of
// every *real* tn-button in the same TestBed. Keep the pure pipe real everywhere
// so mocking a card-bearing component never corrupts a sibling button's label.
ngMocks.globalKeep(LabelMarkupPipe);

// `TnInputComponent` exposes its `<input>` through a signal `viewChild('inputEl')`,
// which real consumers read (e.g. `BasicSearchComponent.focusInput()` calls
// `searchInput().inputEl()`, and harnesses query the rendered `input.tn-input`).
// When ng-mocks deep-mocks any component whose graph transitively imports
// `tn-input`, it replaces `TnInputComponent` across the whole TestBed with an empty
// mock — silently breaking sibling *real* search inputs that depend on the rendered
// element. Keep the lightweight input real everywhere so a deep-mocked parent never
// blanks an unrelated real search field.
ngMocks.globalKeep(TnInputComponent);

// Every tn-* component hosts `TnTestIdDirective` in its own template to compose its
// `data-test` attribute. When ng-mocks deep-mocks any component whose standalone import
// graph transitively includes the directive (e.g. `MockComponent(PageHeaderComponent)`
// once breadcrumb imports it), the mock leaks into the *library components'* template
// scope too — silently dropping every library-composed `data-test` in the TestBed and
// breaking `[data-test=...]` selectors on unrelated real components. Keep the pure,
// render-only directive real everywhere.
ngMocks.globalKeep(TnTestIdDirective);

const silenceJsDomCssParseError: (message: string, methodName: string) => boolean = (message, methodName) => {
  if (methodName === 'error' && message.startsWith('Error: Could not parse CSS stylesheet')) {
    return true;
  }
  // <ix-form> emits this warning in dev mode (which jest runs as) when a
  // submit's request$ resolves to undefined without a closeWith override.
  // The default test mock intentionally uses `request$: of(undefined)` as
  // a no-op success — production callers should still see the warning, so
  // it's silenced only at the test layer.
  if (methodName === 'warn' && message.startsWith('[ix-form] submitHandler close payload resolved to undefined')) {
    return true;
  }
  return false;
};
failOnConsole({ silenceMessage: silenceJsDomCssParseError });

jest.setTimeout(30 * 1000);

defineGlobalsInjections({
  imports: [
    MatCheckboxModule,
    MatSlideToggleModule,
    MatMenuModule,
    TnButtonComponent,
    TnIconComponent,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDialogModule,
    MatSortModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    MatToolbarModule,
    MatBadgeModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    IxInputComponent,
    IxCheckboxComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    IxFieldsetComponent,
    IxFormSectionComponent,
    IxButtonGroupComponent,
    IxExplorerComponent,
    IxFileInputComponent,
    IxTextareaComponent,
    IxSlideToggleComponent,
    IxIconGroupComponent,
    IxChipsComponent,
    IxComboboxComponent,
    IxListComponent,
    IxListItemComponent,
    IxErrorsComponent,
    IxLabelComponent,
    WarningComponent,
    FormActionsComponent,
    RouterModule.forRoot([]),
    UiSearchDirective,
    RequiresRolesDirective,
    TnTablePagerComponent,
    TestDirective,
    TestOverrideDirective,
    WithLoadingStateDirective,
    TranslateModule.forRoot({
      defaultLanguage,
      loader: {
        provide: TranslateLoader,
        useClass: TranslateFakeLoader,
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler,
      },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: IcuMissingTranslationHandler,
      },
      useDefaultLang: false,
    }),
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
  ],
  declarations: [
    MockComponent(GlobalDeclarationsAnchorComponent),
  ],
  providers: [
    provideHttpClient(),
    MockProvider(HighContrastModeDetector),
    {
      provide: APP_BASE_HREF,
      useValue: '',
    },
    {
      // Mirror production (main.ts): render tn-component test ids to `data-test`
      // so specs and Release Engineering selectors target the same attribute.
      provide: TN_TEST_ATTR,
      useValue: 'data-test',
    },
    // Also mirrored from main.ts: without it a spec reads the library's own English copy
    // ('No options available') where the app renders webui's ('No options').
    provideTnSelectLabels(),
    {
      // Mirror production (main.ts) again: the app names every unnamed spinner,
      // progress bar and modal surface through this token, which is also what stands
      // the library's dev-mode naming warning down. Without it here, a spec rendering
      // one warns and `jest-fail-on-console` fails the test for a decision the app
      // has already made.
      //
      // The library's English defaults rather than `provideTnFallbackLabels()`: what a
      // spec needs is the token PROVIDED, and reusing the app provider would make every
      // spec that renders a spinner depend on a TranslateService too.
      provide: TN_FALLBACK_LABELS,
      useValue: TN_DEFAULT_FALLBACK_LABELS,
    },
    {
      provide: WINDOW,
      // eslint-disable-next-line no-restricted-globals
      useValue: window,
    },
    mockProvider(LoaderService, {
      withLoader: () => (source$: Observable<unknown>) => source$,
    }),
    mockProvider(ErrorHandlerService, {
      withErrorHandler: () => (source$: Observable<unknown>) => source$,
    }),
    mockProvider(FormErrorHandlerService),
    {
      provide: AuthService,
      useClass: EmptyAuthService,
    },
    {
      provide: ApiService,
      useClass: EmptyApiService,
    },
    ...TnIconTesting.jest.providers(),
  ],
});

beforeEach(() => {
  // `defineGlobalsInjections` above reaches Spectator specs only, and a plain
  // `TestBed` spec renders the same components — so the fallback-name token is
  // registered here too, where every spec sees it. Called before the spec's own
  // `configureTestingModule`, which merges with rather than replaces this.
  TestBed.configureTestingModule({
    providers: [{ provide: TN_FALLBACK_LABELS, useValue: TN_DEFAULT_FALLBACK_LABELS }],
  });

  // eslint-disable-next-line no-restricted-globals
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: unknown) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // eslint-disable-next-line no-restricted-globals
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    })),
  });

  // Mock scrollIntoView since it's not available in JSDOM test environment
  Element.prototype.scrollIntoView = jest.fn();
});

// https://github.com/jsdom/jsdom/issues/3002
Range.prototype.getBoundingClientRect = () => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
} as DOMRect);
Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: jest.fn(),
});

// eslint-disable-next-line no-restricted-globals
Object.defineProperty(window.URL, 'createObjectURL', { value: () => '' });

// jsdom's own `performance` is replaced rather than extended, so anything this stub omits
// is missing entirely: `@truenas/ui-components` reads `performance.now()` to time its
// transition fallbacks, and without it every spec rendering a side panel or dialog throws.
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    mark: () => {},
    measure: () => {},
    now: () => Date.now(),
  },
});

class MockDataTransfer {
  private filesArray: File[] = [];

  get items(): DataTransferItemList {
    return {
      add: (file: File) => this.filesArray.push(file),
      remove: (index: number) => this.filesArray.splice(index, 1),
    } as unknown as DataTransferItemList;
  }

  get files(): FileList {
    // Simple FileList mock that references our filesArray
    const fileList: Partial<FileList> = {
      length: this.filesArray.length,
      item: (index: number) => this.filesArray[index] || null,
      * [Symbol.iterator]() {
        for (let i = 0; i < Number(this.length); i++) {
          yield this.item(i);
        }
      },
    };
    // We can manually copy properties to make it more FileList-like
    this.filesArray.forEach((file, index) => {
      fileList[index] = file;
    });
    return fileList as FileList;
  }
}

// 2. Create a mock for ClipboardEvent that uses the above DataTransfer
class MockClipboardEvent extends Event {
  clipboardData: DataTransfer;

  constructor(type: string, eventInitDict?: ClipboardEventInit) {
    super(type, eventInitDict);
    this.clipboardData = new MockDataTransfer() as unknown as DataTransfer;
  }
}

// 3. Attach both mocks to global
Object.defineProperty(global, 'ClipboardEvent', {
  value: MockClipboardEvent,
});

Object.defineProperty(global, 'DataTransfer', {
  value: MockDataTransfer,
});

// Polyfill for structuredClone (not available in JSDOM)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
