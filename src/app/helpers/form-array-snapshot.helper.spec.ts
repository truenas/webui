import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@ngneat/reactive-forms';
import { createFormArraySnapshot } from './form-array-snapshot.helper';

describe('createFormArraySnapshot', () => {
  let fb: FormBuilder;
  let destroyRef: DestroyRef;

  beforeEach(() => {
    fb = new FormBuilder();
    destroyRef = TestBed.inject(DestroyRef);
  });

  it('initializes with form array current value', () => {
    const formArray = fb.array([
      fb.control('item1'),
      fb.control('item2'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    expect(snapshot()).toEqual(['item1', 'item2']);
  });

  it('initializes with custom initial value when provided', () => {
    const formArray = fb.array([
      fb.control('item1'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef, ['custom']);

    expect(snapshot()).toEqual(['custom']);
  });

  it('updates snapshot when form array value changes', () => {
    const formArray = fb.array([
      fb.control('item1'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    expect(snapshot()).toEqual(['item1']);

    // Add item
    formArray.push(fb.control('item2'));
    expect(snapshot()).toEqual(['item1', 'item2']);

    // Update item
    formArray.at(0).setValue('updated');
    expect(snapshot()).toEqual(['updated', 'item2']);

    // Remove item
    formArray.removeAt(1);
    expect(snapshot()).toEqual(['updated']);
  });

  it('handles form array with objects', () => {
    interface Item {
      name: string;
      value: number;
    }

    const formArray = fb.array([
      fb.group({ name: fb.control('test'), value: fb.control(1) }),
    ]);

    const snapshot = createFormArraySnapshot<Item>(formArray, destroyRef);

    expect(snapshot()).toEqual([{ name: 'test', value: 1 }]);

    formArray.push(fb.group({ name: fb.control('test2'), value: fb.control(2) }));
    expect(snapshot()).toEqual([
      { name: 'test', value: 1 },
      { name: 'test2', value: 2 },
    ]);
  });

  it('handles empty form array', () => {
    const formArray = fb.array<string>([]);

    const snapshot = createFormArraySnapshot<string>(formArray, destroyRef);

    expect(snapshot()).toEqual([]);

    formArray.push(fb.control('new'));
    expect(snapshot()).toEqual(['new']);
  });

  it('captures disabled control values with getRawValue', () => {
    const formArray = fb.array([
      fb.control({ value: 'enabled', disabled: false }),
      fb.control({ value: 'disabled', disabled: true }),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    // getRawValue includes disabled controls
    expect(snapshot()).toEqual(['enabled', 'disabled']);
  });

  it('updates snapshot when form array is cleared', () => {
    const formArray = fb.array([
      fb.control('item1'),
      fb.control('item2'),
      fb.control('item3'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    expect(snapshot()).toEqual(['item1', 'item2', 'item3']);

    formArray.clear();
    expect(snapshot()).toEqual([]);
  });

  it('updates snapshot when form array values are patched', () => {
    const formArray = fb.array([
      fb.group({ name: fb.control('test1'), value: fb.control(1) }),
      fb.group({ name: fb.control('test2'), value: fb.control(2) }),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    expect(snapshot()).toEqual([
      { name: 'test1', value: 1 },
      { name: 'test2', value: 2 },
    ]);

    // Patch individual item
    formArray.at(0).patchValue({ name: 'updated' });
    expect(snapshot()).toEqual([
      { name: 'updated', value: 1 },
      { name: 'test2', value: 2 },
    ]);
  });

  it('updates snapshot when form array is reset', () => {
    const formArray = fb.array([
      fb.control('item1'),
      fb.control('item2'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    // Make changes
    formArray.at(0).setValue('changed');
    expect(snapshot()).toEqual(['changed', 'item2']);

    // Reset
    formArray.reset();
    expect(snapshot()).toEqual([null, null]);
  });

  it('handles multiple rapid changes correctly', () => {
    const formArray = fb.array([fb.control('initial')]);
    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    // Multiple rapid changes
    formArray.push(fb.control('second'));
    formArray.push(fb.control('third'));
    formArray.removeAt(0);
    formArray.at(0).setValue('modified');

    // Should capture the final state
    expect(snapshot()).toEqual(['modified', 'third']);
  });

  it('handles nested form groups with complex structures', () => {
    interface ComplexItem {
      port: string | null;
      host_id: number | null;
    }

    const formArray = fb.array([
      fb.group({
        port: fb.control<string | null>('fc0'),
        host_id: fb.control<number | null>(null),
      }),
      fb.group({
        port: fb.control<string | null>(null),
        host_id: fb.control<number | null>(123),
      }),
    ]);

    const snapshot = createFormArraySnapshot<ComplexItem>(formArray, destroyRef);

    expect(snapshot()).toEqual([
      { port: 'fc0', host_id: null },
      { port: null, host_id: 123 },
    ]);

    // Modify nested values
    formArray.at(0).patchValue({ port: 'fc1' });
    expect(snapshot()).toEqual([
      { port: 'fc1', host_id: null },
      { port: null, host_id: 123 },
    ]);
  });

  it('works correctly with mixed disabled/enabled controls', () => {
    const formArray = fb.array([
      fb.group({
        port: fb.control({ value: 'fc0', disabled: false }),
        host_id: fb.control({ value: null, disabled: true }),
      }),
      fb.group({
        port: fb.control({ value: null, disabled: true }),
        host_id: fb.control({ value: 456, disabled: false }),
      }),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    // getRawValue should include all values regardless of disabled state
    expect(snapshot()).toEqual([
      { port: 'fc0', host_id: null },
      { port: null, host_id: 456 },
    ]);

    // Enable a disabled control and change value
    formArray.at(0).controls.host_id.enable();
    formArray.at(0).controls.host_id.setValue(789);

    expect(snapshot()).toEqual([
      { port: 'fc0', host_id: 789 },
      { port: null, host_id: 456 },
    ]);
  });

  it('maintains separate snapshots for different form arrays', () => {
    const formArray1 = fb.array([fb.control('array1-item')]);
    const formArray2 = fb.array([fb.control('array2-item')]);

    const snapshot1 = createFormArraySnapshot(formArray1, destroyRef);
    const snapshot2 = createFormArraySnapshot(formArray2, destroyRef);

    expect(snapshot1()).toEqual(['array1-item']);
    expect(snapshot2()).toEqual(['array2-item']);

    // Modify one, other should be unchanged
    formArray1.push(fb.control('array1-new'));
    expect(snapshot1()).toEqual(['array1-item', 'array1-new']);
    expect(snapshot2()).toEqual(['array2-item']); // Unchanged
  });

  it('handles form arrays with null and undefined values', () => {
    const formArray = fb.array([
      fb.control(null),
      fb.control(),
      fb.control('valid'),
    ]);

    const snapshot = createFormArraySnapshot(formArray, destroyRef);

    expect(snapshot()).toEqual([null, null, 'valid']); // undefined becomes null in forms
  });
});
