import { CdkDragEnter, DragDropModule, DropListRef } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ComponentFactory,
  ComponentFactoryResolver, ComponentRef, EventEmitter, Injector, Provider, ReflectiveInjector, ViewContainerRef,
} from '@angular/core';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { IxDropGridItemDirective } from 'app/modules/ix-drop-grid/ix-drop-grid-item.directive';
import { IxDropGridPlaceholderComponent } from 'app/modules/ix-drop-grid/ix-drop-grid-placeholder.component';
import { IxDropGridDirective } from 'app/modules/ix-drop-grid/ix-drop-grid.directive';
import { ixDropGridDirectiveToken } from 'app/modules/ix-drop-grid/ix-drop-grid.tokens';

const timeoutMs = 1;
const animationTimeoutMs = 200;

describe('IxDropGridDirective', () => {
  let spectator: SpectatorDirective<IxDropGridDirective>;

  let resolveAndCreateOriginal: (providers: Provider[], parent?: Injector) => ReflectiveInjector;
  let viewContainerRefMock: ViewContainerRef;
  let componentFactoryResolverMock: ComponentFactoryResolver;
  const fakeFactory = {};
  const fakeInjector = {};

  const createDirective = createDirectiveFactory({
    directive: IxDropGridDirective,
    template: '<div ixDropGrid>',
    imports: [
      DragDropModule,
    ],
    declarations: [IxDropGridDirective],
    providers: [
      mockProvider(ViewContainerRef, {
        createComponent: jest.fn(),
      }),
      mockProvider(ComponentFactoryResolver, {
        resolveComponentFactory: jest.fn(),
      }),
    ],
  });

  function setupMocks(spectator: SpectatorDirective<IxDropGridDirective>): void {
    resolveAndCreateOriginal = ReflectiveInjector.resolveAndCreate;
    ReflectiveInjector.resolveAndCreate = jest.fn().mockReturnValue(fakeInjector);

    viewContainerRefMock = spectator.inject(ViewContainerRef);
    jest.spyOn(viewContainerRefMock, 'createComponent').mockReturnValue({ instance: undefined } as ComponentRef<unknown>);
    spectator.directive['viewContainerRef'] = viewContainerRefMock;

    componentFactoryResolverMock = spectator.inject(ComponentFactoryResolver);
    jest.spyOn(componentFactoryResolverMock, 'resolveComponentFactory').mockReturnValue(fakeFactory as ComponentFactory<unknown>);
    spectator.directive['resolver'] = componentFactoryResolverMock;

    spectator.detectChanges();
  }

  function restoreMocks(): void {
    jest.restoreAllMocks();
    ReflectiveInjector.resolveAndCreate = resolveAndCreateOriginal;
  }

  describe('ngOnInit()', () => {
    beforeEach(() => {
      spectator = createDirective(null, { detectChanges: false });
      setupMocks(spectator);
    });

    afterEach(() => {
      restoreMocks();
    });

    it('calls \'resolveAndCreate()\' with correct arguments', () => {
      expect(ReflectiveInjector.resolveAndCreate)
        .toHaveBeenCalledWith([{ provide: ixDropGridDirectiveToken, useValue: spectator.directive }]);
    });

    it('calls \'createComponent()\' with correct arguments', () => {
      expect(viewContainerRefMock.createComponent)
        .toHaveBeenCalledWith(fakeFactory, 0, fakeInjector);
    });
  });

  describe('registerPlaceholder()', () => {
    beforeEach(() => {
      spectator = createDirective(null, { detectChanges: false });
      setupMocks(spectator);
    });
    afterEach(() => {
      restoreMocks();
    });
    it('populates \'placeholder\' with correct value', () => {
      const fakePlaceholder = {} as IxDropGridPlaceholderComponent;
      spectator.directive.registerPlaceholder(fakePlaceholder);
      expect(spectator.directive.placeholder).toBe(fakePlaceholder);
    });
  });

  describe('registerItem()', () => {
    beforeEach(() => {
      spectator = createDirective(null, { detectChanges: false });
      setupMocks(spectator);
    });
    afterEach(() => {
      restoreMocks();
    });
    it('pipes \'entered\' stream into \'onItemEntered()\' calls', () => {
      const enteredEmitter = new EventEmitter();
      spectator.directive.registerItem(
        { entered: enteredEmitter, dropped: new EventEmitter() } as IxDropGridItemDirective,
      );
      jest.spyOn(spectator.directive, 'onItemEntered').mockImplementation();
      const fakeObj = {};
      enteredEmitter.emit(fakeObj);
      expect(spectator.directive.onItemEntered).toHaveBeenCalledWith(fakeObj);
    });
    it('pipes \'dropped\' stream into \'onItemDropped()\' calls', () => {
      const droppedEmitter = new EventEmitter();
      spectator.directive.registerItem(
        { entered: new EventEmitter(), dropped: droppedEmitter } as IxDropGridItemDirective,
      );
      jest.spyOn(spectator.directive, 'onItemDropped').mockImplementation();
      droppedEmitter.emit();
      expect(spectator.directive.onItemDropped).toHaveBeenCalledWith();
    });
    it('stops piping \'entered\' stream into \'onItemEntered()\' after ngOnDestroy()', () => {
      const enteredEmitter = new EventEmitter();
      spectator.directive.registerItem(
        { entered: enteredEmitter, dropped: new EventEmitter() } as IxDropGridItemDirective,
      );
      jest.spyOn(spectator.directive, 'onItemEntered').mockImplementation();

      spectator.directive.ngOnDestroy();
      enteredEmitter.emit();
      expect(spectator.directive.onItemEntered).not.toHaveBeenCalled();
    });
    it('stops piping \'dropped\' stream into \'onItemDropped()\' after ngOnDestroy()', () => {
      const droppedEmitter = new EventEmitter();
      spectator.directive.registerItem(
        { entered: new EventEmitter(), dropped: droppedEmitter } as IxDropGridItemDirective,
      );
      jest.spyOn(spectator.directive, 'onItemDropped').mockImplementation();

      spectator.directive.ngOnDestroy();
      droppedEmitter.emit();
      expect(spectator.directive.onItemDropped).not.toHaveBeenCalled();
    });
  });

  describe('onItemEntered()', () => {
    let requestAnimationFrameSpy: jest.SpyInstance;
    let fakeEvent: CdkDragEnter;
    let fakeItemElement: Partial<HTMLElement>;
    let fakeSourceElement: Partial<HTMLElement>;
    let fakeDropElement: Partial<HTMLElement>;
    let fakePlaceholder: IxDropGridPlaceholderComponent;
    let fakePhElement: Partial<HTMLElement>;

    beforeEach(() => {
      spectator = createDirective(null, { detectChanges: false });
      setupMocks(spectator);

      const fakeSourceParentElement = {
        removeChild: jest.fn(),
      } as Partial<HTMLElement>;
      fakeSourceElement = { parentElement: fakeSourceParentElement } as Partial<HTMLElement>;

      fakeItemElement = {
        offsetLeft: 11,
        offsetTop: 22,
      } as Partial<HTMLElement>;

      const fakeDropParentElement = {
        insertBefore: jest.fn(),
        children: {} as HTMLCollection,
      } as Partial<HTMLElement>;
      fakeDropElement = { parentElement: fakeDropParentElement } as Partial<HTMLElement>;

      fakeEvent = {
        item: {
          dropContainer: {
            element: {
              nativeElement: fakeSourceElement,
            },
          },
          element: {
            nativeElement: fakeItemElement,
          },
          _dragRef: {},
        },
        container: {
          element: {
            nativeElement: fakeDropElement,
          },
        },
      } as CdkDragEnter;

      fakePhElement = {
        style: {
          display: 'none',
        } as CSSStyleDeclaration,
      };

      fakePlaceholder = {
        itemInstance: {
          element: {
            nativeElement: fakePhElement,
          },
          _dropListRef: {
            enter: jest.fn(),
          } as Partial<DropListRef<unknown>>,
        } as IxDropGridItemDirective,
      } as IxDropGridPlaceholderComponent;

      spectator.directive.placeholder = fakePlaceholder;

      const document = spectator.inject(DOCUMENT);
      requestAnimationFrameSpy = jest.spyOn(document.defaultView, 'requestAnimationFrame');
    });

    afterEach(() => {
      restoreMocks();
    });

    it('when element dropped on itself: skips \'removeChild()\' call', () => {
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(fakeSourceElement.parentElement.removeChild).not.toHaveBeenCalled();
    });
    it('when element dropped on itself: skips \'insertBefore()\' call', () => {
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(fakeDropElement.parentElement.insertBefore).not.toHaveBeenCalled();
    });
    it('when element dropped on itself: keeps previous value of \'display\' property', () => {
      fakePhElement.style.display = 'none';
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(fakePhElement.style.display).toBe('none');
    });
    it('when element dropped on itself: keeps previous value of \'sourceIndex\' property', () => {
      spectator.directive.sourceIndex = 22;
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(spectator.directive.sourceIndex).toBe(22);
    });
    it('when element dropped on itself: keeps previous value of \'source\' property', () => {
      const fakeValue = {} as IxDropGridItemDirective;
      spectator.directive.source = fakeValue;
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(spectator.directive.source).toBe(fakeValue);
    });
    it('when element dropped on itself: keeps previous value of \'targetIndex\' property', () => {
      spectator.directive.targetIndex = 22;
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(spectator.directive.targetIndex).toBe(22);
    });
    it('when element dropped on itself: keeps previous value of \'target\' property', () => {
      const fakeValue = {} as IxDropGridItemDirective;
      spectator.directive.target = fakeValue;
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(spectator.directive.target).toBe(fakeValue);
    });
    it('when element dropped on itself: skips \'requestAnimationFrame()\' call', () => {
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
    });
    it('when element dropped on itself: skips \'enter()\' call', (done) => {
      spectator.directive.onItemEntered({ ...fakeEvent, container: fakePlaceholder.itemInstance });
      setTimeout(() => {
        expect(fakePlaceholder.itemInstance._dropListRef.enter).not.toHaveBeenCalled();
        done();
      }, animationTimeoutMs);
    }, 2 * animationTimeoutMs);
    it('when \'source\' empty: puts correct value into \'sourceIndex\' property', () => {
      spectator.directive.source = null;
      Object.assign(fakeDropElement.parentElement.children, [{}, fakeSourceElement], { length: 2 });
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.sourceIndex).toBe(1);
    });
    it('when \'source\' empty: puts correct value into \'source\' property', () => {
      spectator.directive.source = null;
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.source).toBe(fakeEvent.item.dropContainer);
    });
    it('when \'source\' empty: makes \'removeChild()\' call with correct arguments', () => {
      spectator.directive.source = null;
      spectator.directive.onItemEntered(fakeEvent);
      expect(fakeSourceElement.parentElement.removeChild).toHaveBeenCalledWith(fakeSourceElement);
    });
    it('when \'source\' not empty: keeps previous value of \'sourceIndex\' property', () => {
      spectator.directive.source = {} as IxDropGridItemDirective;
      spectator.directive.sourceIndex = 22;
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.sourceIndex).toBe(22);
    });
    it('when \'source\' not empty: puts correct value into \'source\' property', () => {
      spectator.directive.source = null;
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.source).toBe(fakeEvent.item.dropContainer);
    });
    it('when \'source\' not empty: skips \'removeChild()\' call', () => {
      spectator.directive.source = {} as IxDropGridItemDirective;
      spectator.directive.onItemEntered(fakeEvent);
      expect(fakeSourceElement.parentElement.removeChild).not.toHaveBeenCalled();
    });
    it('puts correct value into \'targetIndex\' property', () => {
      spectator.directive.targetIndex = null;
      Object.assign(fakeDropElement.parentElement.children, [{}, fakeDropElement], { length: 2 });
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.targetIndex).toBe(1);
    });
    it('puts correct value into \'target\' property', () => {
      spectator.directive.onItemEntered(fakeEvent);
      expect(spectator.directive.target).toBe(fakeEvent.container);
    });
    it('puts correct value into \'display\' property', () => {
      spectator.directive.onItemEntered(fakeEvent);
      expect(fakePhElement.style.display).toBe('');
    });
    it('makes \'insertBefore()\' call with correct arguments', () => {
      spectator.directive.onItemEntered(fakeEvent);
      expect(fakeDropElement.parentElement.insertBefore)
        .toHaveBeenCalledWith(
          fakePhElement,
          fakeDropElement,
        );
    });
    it('makes \'requestAnimationFrame()\' call with correct arguments', () => {
      spectator.directive.onItemEntered(fakeEvent);
      expect(requestAnimationFrameSpy).toHaveBeenCalled();
    });
    it('makes \'enter()\' call with correct arguments', (done) => {
      spectator.directive.onItemEntered(fakeEvent);
      setTimeout(() => {
        expect(fakePlaceholder.itemInstance._dropListRef.enter)
          .toHaveBeenCalledWith(
            fakeEvent.item._dragRef,
            fakeItemElement.offsetLeft,
            fakeItemElement.offsetTop,
          );
        done();
      }, animationTimeoutMs);
    }, 2 * animationTimeoutMs);
  });

  describe('onItemDropped()', () => {
    let fakeParentElement: Partial<HTMLElement>;
    let fakePhElement: Partial<HTMLElement>;
    let fakePlaceholder: IxDropGridPlaceholderComponent;
    let fakeSource: IxDropGridItemDirective;

    beforeEach(() => {
      spectator = createDirective(null, { detectChanges: false });
      setupMocks(spectator);

      fakeParentElement = {
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        removeChild: jest.fn(),
        children: {} as HTMLCollection,
      } as Partial<HTMLElement>;

      fakePhElement = {
        style: {} as CSSStyleDeclaration,
        parentElement: fakeParentElement,
      } as Partial<HTMLElement>;

      fakePlaceholder = {
        itemInstance: {
          element: {
            nativeElement: fakePhElement,
          },
        },
      } as IxDropGridPlaceholderComponent;

      spectator.directive.placeholder = fakePlaceholder;
      spectator.directive.target = {} as IxDropGridItemDirective;

      fakeSource = {
        element: {
          nativeElement: {},
        },
      } as IxDropGridItemDirective;
      spectator.directive.source = fakeSource;
    });
    afterEach(() => {
      restoreMocks();
    });
    it('puts correct value into \'style.display\'', () => {
      spectator.directive.onItemDropped();
      expect(fakePhElement.style.display).toBe('none');
    });
    it('calls \'removeChild()\' with correct argument', () => {
      spectator.directive.onItemDropped();
      expect(fakeParentElement.removeChild).toHaveBeenCalledWith(fakePhElement);
    });
    it('calls \'appendChild()\' with correct argument', () => {
      spectator.directive.onItemDropped();
      expect(fakeParentElement.appendChild).toHaveBeenCalledWith(fakePhElement);
    });
    it('calls \'insertBefore()\' with correct argument', () => {
      spectator.directive.onItemDropped();
      expect(fakeParentElement.insertBefore).toHaveBeenCalledWith(fakeSource.element.nativeElement, undefined);
    });
    it('calls removeChild-appendChild-insertBefore in correct order', () => {
      const spy1 = jest.spyOn(fakeParentElement, 'removeChild');
      const spy2 = jest.spyOn(fakeParentElement, 'appendChild');
      const spy3 = jest.spyOn(fakeParentElement, 'insertBefore');
      spectator.directive.onItemDropped();
      expect(spy1.mock.invocationCallOrder[0]).toBeLessThan(spy2.mock.invocationCallOrder[0]);
      expect(spy2.mock.invocationCallOrder[0]).toBeLessThan(spy3.mock.invocationCallOrder[0]);
    });
    it('deletes value of \'target\' property', () => {
      spectator.directive.onItemDropped();
      expect(spectator.directive.target).toBeFalsy();
    });
    it('deletes value of \'target\' property', () => {
      spectator.directive.onItemDropped();
      expect(spectator.directive.source).toBeFalsy();
    });

    const vals = {
      a: {}, b: {}, c: {}, x: {}, y: {}, z: {},
    };
    [
      {
        input: [vals.a, vals.b, vals.c], sourceIndex: 0, targetIndex: 1, expectedOutput: [vals.b, vals.a, vals.c],
      },
      {
        input: [vals.a, vals.b, vals.c], sourceIndex: 0, targetIndex: 2, expectedOutput: [vals.b, vals.c, vals.a],
      },
      {
        input: [vals.a, vals.b, vals.c], sourceIndex: 1, targetIndex: 2, expectedOutput: [vals.a, vals.c, vals.b],
      },
      {
        input: [vals.a, vals.b, vals.c], sourceIndex: 2, targetIndex: 1, expectedOutput: [vals.a, vals.c, vals.b],
      },
      {
        input: [vals.a, vals.b, vals.c], sourceIndex: 1, targetIndex: 0, expectedOutput: [vals.b, vals.a, vals.c],
      },
    ].forEach(({
      input, sourceIndex, targetIndex, expectedOutput,
    }) => {
      it(`moves item in input array from ${sourceIndex} to ${targetIndex}`, (done) => {
        spectator.directive.sourceIndex = sourceIndex;
        spectator.directive.targetIndex = targetIndex;
        spectator.directive.ixDropGridModel = input;
        spectator.directive.ixDropGridModelChange.subscribe((output) => {
          expect(output).toEqual(expectedOutput);
          done();
        });
        spectator.directive.onItemDropped();
      }, timeoutMs);
    });
  });
});
