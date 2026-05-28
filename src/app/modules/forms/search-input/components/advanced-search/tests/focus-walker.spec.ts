import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Option } from 'app/interfaces/option.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import {
  AdvancedSearchAutocompleteService,
} from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';

describe('AdvancedSearchComponent – focus walker', () => {
  let spectator: Spectator<AdvancedSearchComponent<AuditEntry>>;
  let beforeOuter: HTMLButtonElement;
  let afterOuter: HTMLButtonElement;
  let beforeInDialog: HTMLButtonElement;
  let afterInDialog: HTMLButtonElement;
  let dialog: HTMLElement | null;
  const addedElements: HTMLElement[] = [];

  const createComponent = createComponentFactory({
    component: AdvancedSearchComponent<AuditEntry>,
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  function makeButton(label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    addedElements.push(button);
    return button;
  }

  function mount(insideDialog: boolean): void {
    spectator = createComponent({
      props: {
        properties: searchProperties<AuditEntry>([
          textProperty('username', 'Username', of<Option[]>([])),
        ]),
      },
    });

    const componentEl = spectator.fixture.nativeElement as HTMLElement;
    const parent = componentEl.parentElement!;

    beforeOuter = makeButton('outer-before');
    afterOuter = makeButton('outer-after');

    if (insideDialog) {
      parent.insertBefore(beforeOuter, componentEl);
      dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      addedElements.push(dialog);

      beforeInDialog = makeButton('dialog-before');
      afterInDialog = makeButton('dialog-after');

      parent.insertBefore(dialog, componentEl);
      dialog.appendChild(beforeInDialog);
      dialog.appendChild(componentEl);
      dialog.appendChild(afterInDialog);
      parent.appendChild(afterOuter);
    } else {
      dialog = null;
      parent.insertBefore(beforeOuter, componentEl);
      parent.appendChild(afterOuter);
    }
  }

  // CodeMirror renders its editor as a contenteditable rooted on `.cm-editor`
  // (the outer wrapper that owns the keymap listener) with `.cm-content` inside.
  function getEditorRoot(): HTMLElement {
    return spectator.fixture.nativeElement.querySelector('.cm-editor') as HTMLElement;
  }

  // Drives the public Tab/Shift-Tab keymap by dispatching a keydown on the
  // editor's contenteditable, which is what CodeMirror's keymap listens to.
  function pressTab(shift: boolean): void {
    const content = spectator.fixture.nativeElement.querySelector('.cm-content') as HTMLElement;
    content.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      shiftKey: shift,
      bubbles: true,
      cancelable: true,
    }));
  }

  afterEach(() => {
    while (addedElements.length) {
      const el = addedElements.pop();
      el?.remove();
    }
  });

  describe('outside a dialog (no surrounding focus trap)', () => {
    beforeEach(() => mount(false));

    it('moves focus off the editor when Tab is pressed', () => {
      pressTab(false);
      expect(getEditorRoot().contains(document.activeElement)).toBe(false);
      expect(document.activeElement).not.toBe(document.body);
    });

    it('moves focus to the previous focusable element preceding the editor on Shift-Tab', () => {
      pressTab(true);
      expect(document.activeElement).toBe(beforeOuter);
    });
  });

  describe('inside a dialog (cdkTrapFocus / role="dialog" scope)', () => {
    beforeEach(() => mount(true));

    it('keeps forward focus walk inside the dialog', () => {
      pressTab(false);
      expect(dialog!.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(afterOuter);
    });

    it('keeps backward focus walk inside the dialog', () => {
      pressTab(true);
      expect(document.activeElement).toBe(beforeInDialog);
      expect(document.activeElement).not.toBe(beforeOuter);
    });
  });
});
