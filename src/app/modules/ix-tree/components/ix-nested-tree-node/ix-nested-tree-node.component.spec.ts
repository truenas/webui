import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxNestedTreeNodeComponent } from './ix-nested-tree-node.component';

describe('IxNestedTreeNodeComponent', () => {
  let component: IxNestedTreeNodeComponent;
  let fixture: ComponentFixture<IxNestedTreeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxNestedTreeNodeComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IxNestedTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
