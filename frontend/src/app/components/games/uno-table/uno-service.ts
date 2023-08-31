import {Injectable} from '@angular/core';
import {TransferDTO, UnoMessageDTO} from "../../utils/dto";
import {SharedUrls} from "../../utils/shared-urls";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UnoService {

  constructor(private http: HttpClient) {
  }


  transfer(transferDTO: TransferDTO | TransferDTO[], gameId: string) {
    return this.http.patch<TransferDTO>(`${SharedUrls.GAME_CORE_SERVER_HTTP}/${gameId}`, transferDTO)
  }

  sendMessage(unoMessageDTO: UnoMessageDTO, gameId: string) {
    return this.http.patch<TransferDTO>(`${SharedUrls.GAME_CORE_SERVER_HTTP}/${gameId}`, unoMessageDTO)
  }
}
