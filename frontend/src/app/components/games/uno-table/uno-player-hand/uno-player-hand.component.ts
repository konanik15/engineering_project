import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CardDTO, HandDTO} from "../../../utils/dto";

@Component({
  selector: 'app-uno-player-hand',
  templateUrl: './uno-player-hand.component.html',
  styleUrls: ['./uno-player-hand.component.css']
})
export class UnoPlayerHandComponent {

  @Input() hand?: HandDTO;
  @Input() cardsAcquiredInThisTurn?: Set<CardDTO>

  activeCards: Set<CardDTO> = new Set();

  @Output() activeCardsEmitter = new EventEmitter<Set<CardDTO>>();


  //We are assuming we respect Uno Original rules, only one card can be played
  toggleSelect(card: CardDTO) {
    if (this.activeCards.has(card)) {
      this.activeCards.delete(card);
      return
    }
    this.activeCards = new Set<CardDTO>()
    this.activeCards.add(card);
    this.emitValue(this.activeCards)
  }

  emitValue(cards: Set<CardDTO>) {
    this.activeCardsEmitter.emit(cards);
  }

}
