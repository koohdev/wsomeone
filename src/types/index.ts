export interface Card {
  id: string;
  text: string;
  isCover?: boolean;
  coverTitle?: string;
  coverTagline?: string;
  coverPrompt?: string;
  edition?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  editionText: string;
  cards: Card[];
}
