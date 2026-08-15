export interface Card {
  id: string;
  text: string;
  edition?: string;
}

export interface Deck {
  id: string;
  title: string;
  editionText: string;
  cardCountLabel?: string;
  cards: Card[];
}
