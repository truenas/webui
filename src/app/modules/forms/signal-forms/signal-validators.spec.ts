import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldTree, form } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import {
  requiredList, validateIpAddress, validateRange,
} from 'app/modules/forms/signal-forms/signal-validators';

interface Model {
  tag: number | null;
  ip: string;
  cidr: string;
  ports: string[];
}

describe('signal validators', () => {
  function createForm(value: Partial<Model> = {}): FieldTree<Model> {
    TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()] });
    return runInInjectionContext(TestBed.inject(Injector), () => build(value));
  }

  function build(value: Partial<Model>): FieldTree<Model> {
    const model = signal<Model>({
      tag: null, ip: '', cidr: '', ports: [], ...value,
    });
    return form(model, (path) => {
      validateRange(path.tag, 1, 4094);
      validateIpAddress(path.ip);
      validateIpAddress(path.cidr, { cidr: true });
      requiredList(path.ports);
    });
  }

  function kinds(field: () => { errors: () => { kind: string }[] }): string[] {
    return field().errors().map((error) => error.kind);
  }

  it('passes empty values except an empty required list', () => {
    const tree = createForm();

    expect(kinds(tree.tag)).toEqual([]);
    expect(kinds(tree.ip)).toEqual([]);
    expect(kinds(tree.cidr)).toEqual([]);
    expect(kinds(tree.ports)).toEqual(['required']);
    expect(tree.ports().required()).toBe(true);
  });

  it('checks a whole number in range', () => {
    const tree = createForm({ tag: 4095 });
    expect(tree.tag().errors()).toEqual([
      expect.objectContaining({
        kind: 'range',
        message: 'The value is out of range. Enter a value between {min} and {max}.',
      }),
    ]);

    tree.tag().value.set(1.5);
    expect(kinds(tree.tag)).toEqual(['range']);

    tree.tag().value.set(4094);
    expect(kinds(tree.tag)).toEqual([]);
  });

  it('checks an IP address with or without a netmask', () => {
    const tree = createForm({ ip: '10.0.0.1/24', cidr: '10.0.0.1' });
    expect(kinds(tree.ip)).toEqual(['ip2']);
    expect(kinds(tree.cidr)).toEqual(['ip2']);

    tree.ip().value.set('fe80::1');
    tree.cidr().value.set('fe80::1/64');
    expect(kinds(tree.ip)).toEqual([]);
    expect(kinds(tree.cidr)).toEqual([]);
  });

  it('accepts a list with an item', () => {
    const tree = createForm({ ports: ['enp0s3'] });
    expect(kinds(tree.ports)).toEqual([]);
  });
});
