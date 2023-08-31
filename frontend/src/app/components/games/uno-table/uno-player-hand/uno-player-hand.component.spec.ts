import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoPlayerHandComponent } from './uno-player-hand.component';

describe('UnoPlayerHandComponent', () => {
  let component: UnoPlayerHandComponent;
  let fixture: ComponentFixture<UnoPlayerHandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoPlayerHandComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoPlayerHandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
