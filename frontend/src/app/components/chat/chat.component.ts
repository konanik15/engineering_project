import {Component, OnInit} from '@angular/core';
import {WebSocketSubject} from 'rxjs/webSocket';
import {LobbiesService} from "../utils/lobbies-service";

interface ChatMessage {
  sender: string;
  content: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';

  private socket$: WebSocketSubject<any> | undefined;


  constructor(private lobbiesService: LobbiesService) {
  }

  ngOnInit() {
    this.socket$ = this.lobbiesService.socket;

    this.socket$?.subscribe(
      (message) => {
        this.handleIncomingMessage(message);
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
  }

  private handleIncomingMessage(message: any) {
    if (message.sender && message.content) {
      const newChatMessage: ChatMessage = {
        sender: message.sender,
        content: message.content
      };
      this.chatMessages.push(newChatMessage);
    }
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      const newChatMessage: ChatMessage = {
        sender: 'Ty',
        content: this.newMessage
      };

      this.socket$?.next(newChatMessage);
      this.chatMessages.push(newChatMessage);
      this.newMessage = '';
    }
  }
}
