import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakTableComponent} from './durak-table.component';

describe('DurakTableComponent', () => {
  let component: DurakTableComponent;
  let fixture: ComponentFixture<DurakTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DurakTableComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DurakTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
