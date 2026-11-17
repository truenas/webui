import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import {
  applyEach, disabled, FieldTree, form, hidden,
} from '@angular/forms/signals';
import {
  activeValue, fieldAt, isFieldTree, patchModelValue, toFormModel,
} from 'app/modules/forms/signal-forms/signal-forms.utils';

interface Model {
  name: string;
  protocol: 'http' | 'https';
  port: number;
  locked: string;
  rows: { host: string; note: string }[];
  group: { a: string };
}

const initial: Model = {
  name: 'n',
  protocol: 'http',
  port: 443,
  locked: 'l',
  rows: [{ host: 'h', note: 'x' }],
  group: { a: 'a' },
};

function build(value: Model = initial): FieldTree<Model> {
  return runInInjectionContext(TestBed.inject(Injector), () => form(signal(value), (path) => {
    hidden(path.port, { when: ({ valueOf }) => valueOf(path.protocol) !== 'https' });
    disabled(path.locked);
    applyEach(path.rows, (row) => hidden(row.note, { when: () => true }));
  }));
}

describe('signal forms utils', () => {
  describe('activeValue', () => {
    it('leaves out hidden and disabled fields, including inside rows, and keeps the rest', () => {
      expect(activeValue(build())).toEqual({
        name: 'n',
        protocol: 'http',
        rows: [{ host: 'h' }],
        group: { a: 'a' },
      });
    });

    it('keeps a field once it is shown', () => {
      expect(activeValue(build({ ...initial, protocol: 'https' }))).toEqual(expect.objectContaining({ port: 443 }));
    });
  });

  describe('toFormModel', () => {
    it('unfreezes store data, which signal forms would otherwise throw on', () => {
      const frozen = Object.freeze({ ...initial, rows: Object.freeze([Object.freeze({ host: 'h', note: 'x' })]) });
      expect(() => build(frozen as Model).rows[0]().value()).toThrow(TypeError);

      const tree = build(toFormModel(frozen as Model));
      expect(tree.rows[0].host().value()).toBe('h');
      expect(frozen.rows[0]).toEqual({ host: 'h', note: 'x' });
    });
  });

  describe('fieldAt', () => {
    it('follows keys and indices, and answers null for anything that is not a field', () => {
      const tree = build();
      expect(fieldAt(tree, ['rows', 0, 'host'])?.().value()).toBe('h');
      expect(fieldAt(tree, ['rows', 3])).toBeNull();
      expect(fieldAt(tree, ['mystery'])).toBeNull();
    });
  });

  describe('patchModelValue', () => {
    const model = {
      name: 'n', ssh: { port: 22, enabled: false }, tags: ['a', 'b'], note: null as string | null,
    };

    it('merges nested groups deeply, like patchValue', () => {
      expect(patchModelValue(model, { ssh: { port: 2222 } }))
        .toEqual({ ...model, ssh: { port: 2222, enabled: false } });
    });

    it('leaves a group alone when the patch has null for it', () => {
      expect(patchModelValue(model, { ssh: null, name: 'm' })).toEqual({ ...model, name: 'm' });
    });

    it('ignores keys the model does not have, takes arrays whole and sets leaves to null', () => {
      expect(patchModelValue(model, { id: 7, tags: ['c'], note: 'x' })).toEqual({ ...model, tags: ['c'], note: 'x' });
      expect(patchModelValue({ ...model, note: 'x' }, { note: null })).toEqual(model);
    });
  });

  it('isFieldTree tells a field tree from a FormGroup', () => {
    expect(isFieldTree(build())).toBe(true);
    expect(isFieldTree(new FormGroup({}))).toBe(false);
  });
});
