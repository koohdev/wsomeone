export interface Card {
  id: string;
  text: string;
  isCover?: boolean;
  subtext?: string;
  edition?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  editionText: string;
  cards: Card[];
}
