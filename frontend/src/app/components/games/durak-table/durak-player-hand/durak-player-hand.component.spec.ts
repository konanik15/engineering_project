import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakPlayerHandComponent} from './durak-player-hand.component';

describe('DurakPlayerHandComponent', () => {
    let component: DurakPlayerHandComponent;
    let fixture: ComponentFixture<DurakPlayerHandComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakPlayerHandComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakPlayerHandComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
