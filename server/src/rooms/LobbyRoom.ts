import { Room, Client } from '@colyseus/core';
import { Schema, type } from '@colyseus/schema';

class LobbyState extends Schema {
  @type('number') count: number = 0;
}

export class LobbyRoom extends Room<LobbyState> {
  maxClients = 64;

  onCreate() {
    this.setState(new LobbyState());
    this.autoDispose = false;
  }

  onJoin(client: Client, options: any) {
    this.state.count += 1;
  }

  onLeave(client: Client) {
    this.state.count = Math.max(0, this.state.count - 1);
  }
}
