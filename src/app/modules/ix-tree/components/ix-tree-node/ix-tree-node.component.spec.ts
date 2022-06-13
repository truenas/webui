import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxTreeNodeComponent } from './ix-tree-node.component';

describe('IxTreeNodeComponent', () => {
  let component: IxTreeNodeComponent;
  let fixture: ComponentFixture<IxTreeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxTreeNodeComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IxTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
