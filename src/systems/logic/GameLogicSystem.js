import { GameEvents } from "../../utils/Constants.js";
import { GameConfig } from "../../configs/GameConfig.js";
import { GameSetupSystem } from "./GameSetupSystem.js";
import { CardMovementSystem } from "./CardMovementSystem.js";
import { ScoringSystem } from "./ScoringSystem.js";
import { WinConditionSystem } from "./WinConditionSystem.js";
import { HintSystem } from "./HintSystem.js";
import { UndoSystem } from "./UndoSystem.js";
import { AudioName } from "../../utils/Constants.js";
import { UIConfig } from "../../configs/UIConfig.js";

export class GameLogicSystem {
  constructor(eventManager, stateManager, audioManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
    this.audioManager = audioManager;

    this.setupSystems();
    this.setupEventListeners();
  }

  setupSystems() {
    this.setupSystem = new GameSetupSystem(
      this.eventManager,
      this.stateManager
    );
    this.movementSystem = new CardMovementSystem(
      this.eventManager,
      this.stateManager,
      this.audioManager
    );
    this.scoringSystem = new ScoringSystem(
      this.eventManager,
      this.stateManager
    );
    this.winSystem = new WinConditionSystem(
      this.eventManager,
      this.stateManager,
      this.audioManager
    );
    this.hintSystem = new HintSystem(
      this.eventManager,
      this.stateManager,
      this.audioManager
    );
    this.undoSystem = new UndoSystem(
      this.eventManager,
      this.stateManager,
      this.audioManager
    );
  }

  // init() {
  //   this.setupEventListeners();
  // }

  setupEventListeners() {
    this.eventManager.on(GameEvents.CARD_CLICK, (card) => {
      this.handleCardClick(card);
    });

    this.eventManager.on(GameEvents.CARD_MOVE, (data) => {
      this.handleCardMove(data);
    });

    // this.eventManager.on(GameEvents.CARD_TO_TABLEAU, (data) =>
    //   this.handleCardMove(data)
    // );

    this.eventManager.on("hint:request", () => this.hintSystem.provide());
    this.eventManager.on("game:undo", () => this.undoSystem.execute());
  }

  setCards(deck, stock) {
    this.setupSystem.setCards(deck, stock);
  }

  async dealTableauCards(stock, tableaus) {
    await this.setupSystem.dealTableauCards(stock, tableaus);
  }

  handleCardClick(card) {
    this.audioManager.play(AudioName.CLICK);
    if (this.winSystem.check()) return;
    this.movementSystem.handleCardClick(card);
  }

  handleCardMove({ card, toContainerIndex, toContainer, nameToContainer }) {
    const source = this.movementSystem.getCardSource(card);

    const elementFrom = this.movementSystem.getElementFrom(source);
    this.undoSystem.updateLastMove({
      card,
      from: source,
      to: `${nameToContainer}-${toContainerIndex}`,
    });

    this.eventManager.emit(
      GameEvents.ANIMATE_CARD_MOVE,
      card,
      source,
      elementFrom,
      toContainer,
      this.movementSystem
    );

    if (nameToContainer === GameConfig.cardContainers.foundation) {
      new Promise((resolve) => {
        setTimeout(() => {
          const score = GameConfig.rules.scoreForFoundation;

          this.eventManager.emit(
            GameEvents.UI_ANIMATION_POINTS_EARNED,
            card,
            score
          );
          this.scoringSystem.addPoints(score);
        }, UIConfig.animations.cardMoveDuration);
        resolve();
      });
    }
    const backStyle =
      this.stateManager.state.player.selectedItems.backs.styleClass;
    const faceStyle =
      this.stateManager.state.player.selectedItems.faces.styleClass;
    if (this.winSystem.check()) {
      this.winSystem.handleWin();
    }

    const openCard = this.movementSystem.openNextCardIfNeeded(
      source,
      backStyle,
      faceStyle
    );
    console.log("openCard:", openCard);

    card.openCard = openCard;
    if (openCard) {
      console.log("openCard:", openCard);

      const score = GameConfig.rules.scoreForCardFlip;
      new Promise((resolve) => {
        setTimeout(() => {
          this.eventManager.emit(
            GameEvents.UI_ANIMATION_POINTS_EARNED,
            openCard,
            score
          );
          this.scoringSystem.addPoints(score);
        }, UIConfig.animations.cardFlipDuration * 1000);
        resolve();
      });
    }
  }

  // handleTableauMove({ card, toContainerIndex, toContainer, nameToContainer }) {
  //   const source = this.movementSystem.getCardSource(card);

  //   this.undoSystem.updateLastMove({
  //     card,
  //     from: source,
  //     to: `${nameToContainer}-${toContainerIndex}`,
  //   });

  //   const elementFrom = this.movementSystem.getElementFrom(source);

  //   this.eventManager.emit(
  //     GameEvents.ANIMATE_CARD_MOVE,
  //     card,
  //     source,
  //     elementFrom,
  //     toContainer,
  //     this.movementSystem
  //   );

  //   this.scoringSystem.addPoints(GameConfig.rules.scoreForTableauMove);
  //   const backStyle =
  //     this.stateManager.state.player.selectedItems.backs.styleClass;
  //   const faceStyle =
  //     this.stateManager.state.player.selectedItems.faces.styleClass;

  //   const openCard = this.movementSystem.openNextCardIfNeeded(
  //     source,
  //     backStyle,
  //     faceStyle
  //   );
  //   card.openCard = openCard;
  // }
}

// import { GameEvents, AudioName } from "../utils/Constants.js";
// import { GameConfig } from "../configs/GameConfig.js";
// import { WinSystem } from "./WinSystem.js";
// import { MoveCardToFoundation } from "./MoveCardToFoundation.js";
// import { MoveCardToTableau } from "./MoveToTableau.js";
// import { OpenNextCard } from "./OpenNextCard.js";

// export class GameLogicSystem {
//   constructor(eventManager, stateManager, audioManager) {
//     this.systems = {};
//     this.eventManager = eventManager;
//     this.stateManager = stateManager;
//     this.audioManager = audioManager;
//     this.init();
//   }

//   init() {
//     this.setupEventListeners();
//     this.registerSystems();
//   }

//   setupEventListeners() {
//     this.eventManager.on(GameEvents.CARD_TO_FOUNDATION, (data) => {
//       this.moveCardToFoundation(data);
//     });
//     this.eventManager.on(GameEvents.CARD_TO_TABLEAU, (data) =>
//       this.moveCardToTableau(data)
//     );
//     this.eventManager.on("hint:request", () => this.provideHint());
//     this.eventManager.on("game:undo", () => this.handleUndo());
//   }

//   registerSystems() {
//     this.systems = {
//       winSystem: new WinSystem(this.eventManager, this.stateManager),
//       openNextCard: new OpenNextCard(this.eventManager, this.stateManager),
//       moveCardToFoundation: new MoveCardToFoundation(
//         this.eventManager,
//         this.stateManager
//       ),
//       moveCardToTableau: new MoveCardToTableau(
//         this.eventManager,
//         this.stateManager
//       ),
//     };
//     console.log("this.systems.openNextCard:", this.systems.openNextCard);
//   }

//   // setupNewGame(deck, tableaus, stock) {
//   //   deck.reset();

//   //   // // Раздача карт в tableau
//   //   // for (let i = 0; i < 7; i++) {
//   //   //   for (let j = 0; j <= i; j++) {
//   //   //     const card = deck.deal();
//   //   //     card.faceUp = j === i;
//   //   //     tableaus[i].addCard(card);
//   //   //   }
//   //   // }

//   //   // Оставшиеся карты в сток
//   //   const stockCards = [];

//   //   while (!deck.isEmpty()) {
//   //     stockCards.push(deck.deal());
//   //     console.log("stockCards:", stockCards);
//   //   }
//   //   stock.addCards(stockCards);

//   //   // Сброс состояния игры
//   //   this.eventManager.emit(GameEvents.END_SET_NEW_GAME);
//   // }

//   setupInitialGameState(deck, tableaus, stock) {
//     deck.shuffle();
//     this.dealCardsToTableaus(deck, tableaus);
//     this.moveRemainingToStock(deck, stock);
//   }

//   dealCardsToTableaus(deck, tableaus) {
//     for (let i = 0; i < tableaus.length; i++) {
//       for (let j = 0; j <= i; j++) {
//         const card = deck.deal();
//         card.faceUp = j === i;
//         tableaus[i].addCard(card);
//       }
//     }
//   }

//   handleCardClick(card) {
//     this.audioManager.play(AudioName.CLICK);
//     if (!card.faceUp || this.stateManager.state.game.isPaused) return;
//     if (this.systems.winSystem.checkWinCondition()) return;
//     const gameComponents = this.stateManager.state.cardsComponents;
//     // Проверяем можно ли переместить карту в foundation
//     for (let i = 0; i < gameComponents.foundations.length; i++) {
//       if (gameComponents.foundations[i].canAccept(card)) {
//         this.systems.moveCardToFoundation.move({
//           card,
//           foundationIndex: i,
//         });
//         return;
//       }
//     }

//     // Если нет - проверяем tableau
//     for (let i = 0; i < gameComponents.tableaus.length; i++) {
//       if (gameComponents.tableaus[i].canAccept(card)) {
//         this.systems.moveCardToTableau.move({
//           card,
//           tableauIndex: i,
//         });
//         return;
//       }
//     }

//     // Если карту нельзя переместить - звуковой сигнал
//     this.audioManager.play(AudioName.INFO);
//   }

//   // Остальные методы системы логики...

//   getCardSource(card) {
//     // Определяем откуда взята карта (tableau, foundation, waste)
//     if (card.positionData.parent.includes("tableau")) {
//       return `tableau-${card.positionData.index}`;
//     } else if (card.positionData.parent.includes("foundation")) {
//       return `foundation-${card.positionData.index}`;
//     } else {
//       return "waste";
//     }
//   }

//   removeCardFromSource(card, source) {
//     if (source.startsWith("tableau")) {
//       const index = parseInt(source.split("-")[1]);
//       return this.stateManager.state.currentGame.components.tableaus[
//         index
//       ].removeCardsFrom(card);
//     } else if (source.startsWith("foundation")) {
//       const index = parseInt(source.split("-")[1]);
//       return this.stateManager.state.currentGame.components.foundations[
//         index
//       ].removeTopCard();
//     } else if (source === "waste") {
//       this.stateManager.state.currentGame.components.waste.removeCurrentCard(
//         card
//       );
//       this.stateManager.state.currentGame.components.stock.removeCurrentCard(
//         card
//       );
//       return card;
//     }
//   }

//   openNextCardIfNeeded(source, backClass, faceClass) {
//     if (!source.startsWith("tableau")) return;

//     const index = parseInt(source.split("-")[1]);

//     const tableau =
//       this.stateManager.state.currentGame.components.tableaus[index];
//     const topCard = tableau.getTopCard();
//     if (topCard && !topCard.faceUp) {
//       topCard.flip();
//       this.eventManager.emit(
//         GameEvents.CARD_FLIP,
//         topCard,
//         backClass,
//         faceClass
//       );
//       const score = GameConfig.rules.scoreForCardFlip;
//       this.stateManager.incrementStat("cardsFlipped");
//       this.stateManager.updateScore(this.calculatePoints(score));
//       this.eventManager.emit(GameEvents.AUDIO_CARD_FLIP);
//       this.eventManager.emit(
//         GameEvents.UI_ANIMATION_POINTS_EARNED,
//         topCard,
//         score
//       );
//       return topCard;
//     }
//   }
//   calculatePoints(score) {
//     const { difficulty } = this.stateManager.state.game;
//     const multiplier = {
//       easy: 1.2,
//       normal: 1.0,
//       hard: 0.8,
//     }[difficulty];

//     const resultScore = Math.round(score * multiplier);
//     return resultScore;
//   }

//   handleWin() {
//     this.stateManager.incrementStat("wins");
//     this.stateManager.updateScore(
//       this.calculatePoints(GameConfig.rules.winScoreBonus)
//     );

//     // Проверяем победу без подсказок
//     if (this.stateManager.state.game.hintsUsed === 0) {
//       this.stateManager.incrementStat("winsWithoutHints");
//     }

//     // Проверяем быструю победу
//     if (
//       this.stateManager.state.game.time <
//       this.stateManager.state.player.fastestWin
//     ) {
//       this.stateManager.state.player.fastestWin =
//         this.stateManager.state.game.time;
//     }

//     this.audioManager.play(AudioName.WIN);
//     // this.eventManager.emit(GameEvents.CARD_MOVED);
//     this.eventManager.emit(GameEvents.UI_ANIMATE_WIN);
//     this.eventManager.emit(
//       GameEvents.INCREMENT_COINS,
//       GameConfig.earnedCoins.win
//     );
//     this.eventManager.emit(
//       GameEvents.ANIMATION_COINS_EARNED,
//       `Вы заработали ${GameConfig.earnedCoins.win} хусынок`
//     );
//     this.eventManager.emit(GameEvents.GAME_END);
//   }

//   provideHint() {
//     if (this.stateManager.state.game.score < 5) {
//       this.eventManager.emit(
//         "ui:notification",
//         "Нужно минимум 5 очков для подсказки"
//       );
//       this.audioManager.play("error");
//       return;
//     }

//     // Логика поиска возможных ходов...
//     const hint = this.findBestHint();

//     if (hint) {
//       this.stateManager.deductCoins(5);
//       this.stateManager.state.game.hintsUsed =
//         (this.stateManager.state.game.hintsUsed || 0) + 1;
//       this.eventManager.emit("hint:show", hint);
//     } else {
//       this.eventManager.emit("ui:notification", "Нет доступных ходов");
//     }
//   }

//   findBestHint() {
//     // Сначала проверяем карты в waste
//     const wasteCard = this.stateManager.currentGame.stock.getWasteCard();
//     if (wasteCard) {
//       // Проверяем foundation
//       for (
//         let i = 0;
//         i < this.stateManager.currentGame.foundations.length;
//         i++
//       ) {
//         if (this.stateManager.currentGame.foundations[i].canAccept(wasteCard)) {
//           return {
//             card: wasteCard,
//             target: `foundation-${i}`,
//             type: "waste-to-foundation",
//           };
//         }
//       }

//       // Проверяем tableau
//       for (let i = 0; i < this.stateManager.currentGame.tableaus.length; i++) {
//         if (this.stateManager.currentGame.tableaus[i].canAccept(wasteCard)) {
//           return {
//             card: wasteCard,
//             target: `tableau-${i}`,
//             type: "waste-to-tableau",
//           };
//         }
//       }
//     }

//     // Затем проверяем tableau
//     for (let i = 0; i < this.stateManager.currentGame.tableaus.length; i++) {
//       const tableau = this.stateManager.currentGame.tableaus[i];
//       const topCard = tableau.getTopCard();

//       if (!topCard) continue;

//       // Проверяем foundation
//       for (
//         let j = 0;
//         j < this.stateManager.currentGame.foundations.length;
//         j++
//       ) {
//         if (this.stateManager.currentGame.foundations[j].canAccept(topCard)) {
//           return {
//             card: topCard,
//             target: `foundation-${j}`,
//             type: "tableau-to-foundation",
//           };
//         }
//       }
//     }

//     return null;
//   }

//   handleUndo() {
//     if (!this.stateManager.state.game.lastMove) {
//       this.audioManager.play(AudioName.INFO);
//       return;
//     }

//     const { card, from, to } = this.stateManager.state.game.lastMove;
//     this.eventManager.emit("game:undo:move", { card, from, to });
//   }
// }
