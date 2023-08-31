import {Component, Input, OnInit} from '@angular/core';
import {CardDTO, GameDTO, HandDTO, ObligationDTO, TransferDTO, UnoMetaDTO} from "../../utils/dto";
import {OAuthService} from "angular-oauth2-oidc";
import {UnoService} from "./uno-service";
import {ToastrService} from "ngx-toastr";
import {MdbModalRef, MdbModalService} from "mdb-angular-ui-kit/modal";
import {UnoChooseColorModalComponent} from "./uno-choose-color-modal/uno-choose-color-modal.component";


@Component({
  selector: 'app-uno-table',
  templateUrl: './uno-table.component.html',
  styleUrls: ['./uno-table.component.css']
})
export class UnoTableComponent implements OnInit {
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

  constructor(private oAuthService: OAuthService,
              private unoService: UnoService,
              private toastService: ToastrService,
              private modalService: MdbModalService) {
  }

  ngOnInit(): void {
    const userClaims: any = this.oAuthService.getIdentityClaims();
    this.username = userClaims.family_name ? userClaims.family_name : "Anonim";

    this.updateGame(<GameDTO>this.game)

    if (this.game?.state?.hands) {
      this.setPlayerHand(this.game.state.hands)
      this.setEnemiesHands(this.game.state.hands)
    }
    if (this.game?.meta) {
      this.determineIfItsYourTurn(<UnoMetaDTO>this.game.meta)
    }

    this.gameSocket.subscribe(
      // @ts-ignore
      msg => this.handleMessage(msg),
      // @ts-ignore
      err => console.log(err),
      () => console.log('Closing WS connection to Lobby')
    )
  }

  private handleMessage(message: any) {
    switch (message.event) {
      case "gameUpdated":
        console.log('game updated: ', message)
        this.updateGame(message.data.game)
        this.updateReason(message.data)
        break
      case "gameEnded":
        this.toastService.success('Good Job!', 'End of the Uno Game !')
        break;

      default: {
        console.log("Wrong message type:", message.event)
        break;
      }
    }
  }

  private setPlayerHand(hands: HandDTO[]) {
    this.playerHand = <HandDTO>hands.find(hand => {
      return hand.owner === this.username;
    })
  }

  private setEnemiesHands(hands: HandDTO[]) {
    this.enemiesHands = []
    hands.forEach(hand => {
      if (hand.owner !== this.username && hand) {
        this.enemiesHands.push(hand)
      }
    })
  }

  private determineIfItsYourTurn(meta: UnoMetaDTO) {
    this.yourTurn = meta.turn.username === this.username;
  }

  skipTurn() {
    this.unoService.sendMessage({"type": "skip"}, this.gameId).subscribe({
        error: err => {
          this.toastService.error(err.error, 'Skip Turn',)
        }
      }
    )
  }

  sayUno() {
    this.unoService.sendMessage({"type": "declare"}, this.gameId).subscribe({
      complete: () => {
        this.toastService.success('', ' Uno', {
          positionClass: 'toast-bottom-right'
        })
      },
      error: err => {
        this.toastService.error(err.error, ' Uno', {
          positionClass: 'toast-bottom-right'
        })
      }
    });
  }

  accuse(selectedPlayer: string) {
    this.unoService.sendMessage({
        "type": "accuse",
        "username": selectedPlayer
      },
      this.gameId).subscribe({
      error: err => {
        this.toastService.error(err.error, ' Accusing', {
          positionClass: 'toast-bottom-right'
        })
      }
    });
  }

  drewCard() {
    let cardAmount = 1
    let transferDTO: TransferDTO = {

      "type": "transfer",
      "source": {
        "type": "stack",
        "name": "draw"
      },
      "destination": {
        "type": "hand",
      },
      "amount": cardAmount

    }
    this.unoService.transfer(transferDTO, this.gameId).subscribe({
        error: err => {
          this.toastService.error(err.error, 'Drew Card',)
        }
      }
    )
  }

  private updateGame(game: GameDTO) {
    this.game = game

    if (this.game?.state?.hands) {
      this.setPlayerHand(this.game.state.hands)
      this.setEnemiesHands(this.game.state.hands)
    }
    if (this.game?.meta) {
      this.determineIfItsYourTurn(<UnoMetaDTO>this.game.meta)
    }
    let obligation: ObligationDTO | undefined;
    obligation = this.getObligation(this.game?.meta?.obligations)
    if (obligation) {
      this.handleObligation(obligation)
    } else {
      this.chooseCardColorModalRef?.close()
    }
  }

  playCard() {
    let transferDTOs: TransferDTO[] = []
    this.selectedCards.forEach(card => {
      transferDTOs.push({
        "type": "transfer",
        "source": {
          "type": "hand"
        },
        "destination": {
          "type": "pile",
          "name": "discard"
        },
        "cards": [card]
      })
    })
    this.unoService.transfer(transferDTOs, this.gameId).subscribe({
        error: err => {
          this.toastService.error(err.error, 'Play Card',)
        }
      }
    )
  }

  readValueFromHand(value: Set<CardDTO>) {
    this.selectedCards = value;
  }

  private getObligation(obligations: ObligationDTO[]): ObligationDTO | undefined {
    return obligations.filter(obligation =>
      obligation.obliged === this.username
    ).pop();
  }

  private handleObligation(obligation: ObligationDTO) {
    switch (obligation.type) {
      case "orderColor":
        this.chooseCardColorModalRef = this.modalService.open(UnoChooseColorModalComponent, {
          data: {
            gameId: `${this.gameId}`,
          },
          ignoreBackdropClick: true,
          keyboard: false,
          modalClass: 'modal-dialog-centered'
        })
        break;
      case"draw":
        this.toastService.info(('You need to draw' + obligation.amount + ' cards or contr-attack'), 'Draw')
        break;

      default: {
        console.log("Wrong obligation type:", obligation.type)
        break;
      }
    }
  }

  private updateReason(data: any) {
    let cardAmountAcquiredInThisTurn = 0
    if (data.game.meta.turn.username === this.username) {
      cardAmountAcquiredInThisTurn = data.game.meta.turn.cardsDrawn
    }
    if (cardAmountAcquiredInThisTurn > 0) {
      this.cardsAcquiredInThisTurn = new Set(this.playerHand.cards.slice(-cardAmountAcquiredInThisTurn))
    }
  }
}
