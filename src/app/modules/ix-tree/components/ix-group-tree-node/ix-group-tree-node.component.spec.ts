import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxGroupTreeNodeComponent } from './ix-group-tree-node.component';

describe('IxGroupTreeNodeComponent', () => {
  let component: IxGroupTreeNodeComponent;
  let fixture: ComponentFixture<IxGroupTreeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxGroupTreeNodeComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(IxGroupTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
