
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  sources?: Source[];
}
