import { GameEvents, AudioName } from "../../utils/Constants.js";
import { GameConfig } from "../../configs/GameConfig.js";

export class CardMovementSystem {
  constructor(eventManager, stateManager, audioManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
    this.audioManager = audioManager;
    this.cardContainers = GameConfig.cardContainers;

    this.setupEventListeners();
  }

  setupEventListeners() {
    
  }

  handleCardClick(card) {
    if (!card.faceUp || this.stateManager.state.game.isPaused) return false;

    const gameComponents = this.stateManager.state.cardsComponents;
    const usedAutoCollectCards =
      this.stateManager.state.game.usedAutoCollectCards;
    // Проверка foundation
    for (let i = 0; i < gameComponents.foundations.length; i++) {
      if (gameComponents.foundations[i].canAccept(card, gameComponents)) {
        if (!usedAutoCollectCards) this.audioManager.play(AudioName.CLICK);
        const containerTo = gameComponents.foundations[i];
        const containerToName = this.cardContainers.foundation;
        this.eventManager.emit(GameEvents.CARD_MOVE, {
          card,
          containerToIndex: i,
          containerTo,
          containerToName,
        });
        return true;
      }
    }

    // Проверка tableau
    for (let i = 0; i < gameComponents.tableaus.length; i++) {
      if (gameComponents.tableaus[i].canAccept(card)) {
        if (!usedAutoCollectCards) this.audioManager.play(AudioName.CLICK);
        const containerTo = gameComponents.tableaus[i];
        const containerToName = this.cardContainers.tableau;
        this.eventManager.emit(GameEvents.CARD_MOVE, {
          card,
          containerToIndex: i,
          containerTo,
          containerToName,
        });
        return true;
      }
    }

    if (!usedAutoCollectCards) this.audioManager.play(AudioName.INFO);
    return false;
  }

  isCardMoveToFoundations(card, gameComponents) {
    for (let i = 0; i < gameComponents.foundations.length; i++) {
      if (gameComponents.foundations[i].canAccept(card, gameComponents)) {
        this.audioManager.play(AudioName.CLICK);
        const containerTo = gameComponents.foundations[i];
        const containerToName = this.cardContainers.foundation;
        this.eventManager.emit(GameEvents.CARD_MOVE, {
          card,
          containerToIndex: i,
          containerTo,
          containerToName,
        });
        return true;
      }
    }
  }

  getCardSource(card) {
    if (card.positionData.parent.includes(this.cardContainers.tableau)) {
      return `${this.cardContainers.tableau}-${card.positionData.index}`;
    } else if (
      card.positionData.parent.includes(this.cardContainers.foundation)
    ) {
      return `${this.cardContainers.foundation}-${card.positionData.index}`;
    } else if (card.positionData.parent.includes(this.cardContainers.stock)) {
      return `${this.cardContainers.stock}-0`;
    }
    return `${this.cardContainers.waste}-0`;
  }

  getElementFrom(source) {
    if (source.startsWith(this.cardContainers.tableau)) {
      const index = parseInt(source.split("-")[1]);
      return this.stateManager.state.cardsComponents.tableaus[index];
    } else if (source.startsWith(this.cardContainers.foundation)) {
      const index = parseInt(source.split("-")[1]);
      return this.stateManager.state.cardsComponents.foundations[index];
    } else if (source.startsWith(this.cardContainers.stock)) {
      return this.stateManager.state.cardsComponents.stock;
    } else if (source.startsWith(this.cardContainers.waste)) {
      return this.stateManager.state.cardsComponents.waste;
    }
  }

  removeCardFromSource(card, source, elementFrom) {
    // ... реализация аналогична оригиналу
    if (source.startsWith(this.cardContainers.tableau)) {
      return elementFrom.removeCardsFrom(card);
    } else if (source.startsWith(this.cardContainers.foundation)) {
      return [elementFrom.removeTopCard()];
    } else if (source.startsWith(this.cardContainers.stock)) {
      return [elementFrom.removeTopCard()];
    } else if (source.startsWith(this.cardContainers.waste)) {
      return [elementFrom.removeTopCard()];
    }
  }

  openNextCardIfNeeded(source) {
    if (!source.startsWith(this.cardContainers.tableau)) return null;

    const index = parseInt(source.split("-")[1]);

    const tableau = this.stateManager.state.cardsComponents.tableaus[index];
    const card = tableau.getTopCard();
    if (card && !card.faceUp) {
      card.flip();
      this.eventManager.emit(GameEvents.CARD_FLIP, card);
      this.stateManager.incrementStat("cardsFlipped");
      return card;
    }
  }
}
