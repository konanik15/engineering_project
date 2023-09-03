import {Component, Input, OnInit} from '@angular/core';
import {CardDTO, GameDTO, HandDTO} from "../../utils/dto";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {UnoChooseColorModalComponent} from "../uno-table/uno-choose-color-modal/uno-choose-color-modal.component";

@Component({
    selector: 'app-durak-table',
    templateUrl: './durak-table.component.html',
    styleUrls: ['./durak-table.component.css']
})
export class DurakTableComponent implements OnInit {
    @Input() gameSocket: any;
    @Input() game?: GameDTO;
    @Input() gameId!: string

    playerHand!: HandDTO;

    enemiesHands: HandDTO[] = [];

    username: string = "";

    yourTurn: boolean = false;

    cardsAcquiredInThisTurn: Set<CardDTO> = new Set<CardDTO>();

    chooseCardColorModalRef: MdbModalRef<UnoChooseColorModalComponent> | null = null;

    selectedCards: Set<CardDTO> = new Set();

    selectedPlayer: string = '';


    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }

    readValueFromHand($event: any) {

    }

    drewCard() {

    }

    playCard() {

    }

    skipTurn() {

    }
}
