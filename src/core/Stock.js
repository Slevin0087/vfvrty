import { Pile } from "./Pile.js";
import { Waste } from "./Waste.js";
import { UIConfig } from "../configs/UIConfig.js";

export class Stock extends Pile {
  constructor() {
    super("stock");
    this.overlapX = UIConfig.layout.card.stockOverlapX;
    this.overlapY = UIConfig.layout.card.stockOverlapY; // Небольшое смещение для стока
    // this.waste = new Waste();
    this.element = this.createPileElement();
  }

  createPileElement() {
    const element = super.createPileElement();
    const span = document.createElement("span");
    // span.innerHTML = '<svg viewBox="0 0 24 24" width="90"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>';
    span.textContent = "↺";
    span.classList.add("stock-span");
    element.append(span);
    return element;
  }

  deal() {
    if (this.isEmpty()) return null;
    const card = this.cards.pop();
    card.faceUp = true;
    this.index--;
    return card;
  }

  addCards(cards) {
    super.addCards(cards);
    this.index = this.cards.length - 1;
  }

  addCard(card) {
    super.addCard(card);
    // card.positionData.offsetX = this.cards.length * this.overlapX;
    card.faceUp = false;
  }

  getWasteCard() {
    const card = this.cards[this.index];
    if (card) {
      card.faceUp = true; // Карты в стоке рубашкой вверх
      this.index--;
      // this.waste.addCard(card);
      // card.positionData.parent = "waste";
      // card.positionData.zIndex = this.waste.length ? this.waste.length - 1 : 0;
      // this.waste.cards.push(card);
      return card;
    }
    return null;
  }

  recycleWaste(waste) {
    this.cards = [];
    this.addCards(waste.cards.reverse());
    this.index = this.cards.length - 1;
    waste.cards = [];
  }
}
