import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoTableComponent } from './uno-table.component';

describe('UnoTableComponent', () => {
  let component: UnoTableComponent;
  let fixture: ComponentFixture<UnoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
