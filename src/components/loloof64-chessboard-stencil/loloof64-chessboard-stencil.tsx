import { Component, h, Fragment, State, getAssetPath, Prop, Listen, Watch, Event, EventEmitter, Method } from '@stencil/core';
import { Chess, ChessInstance, Piece, ShortMove, Square, Move } from 'chess.js';

const EMPTY_POSITION = '8/8/8/8/8/8/8/8 w - - 0 1';
const DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface DndPiece {
  startFile?: number;
  startRank?: number;
  endFile?: number;
  endRank?: number;
  x?: number;
  y?: number;
  piece?: Piece;
}

interface LastMove {
  startFile: number;
  startRank: number;
  endFile: number;
  endRank: number;
}

interface PromotionRequest {
  startFile?: number;
  startRank?: number;
  endFile?: number;
  endRank?: number;
  draggedPieceX?: number;
  draggedPieceY?: number;
}

export interface MoveDone {
  moveNumber: number;
  whiteTurn: boolean;
  moveFan: string;
  moveSan: string;
  fromFileIndex: number;
  fromRankIndex: number;
  toFileIndex: number;
  toRankIndex: number;
}

export interface MoveAsParameter {
  startFile: number;
  startRank: number;
  endFile: number;
  endRank: number;
  promotion?: string;
}

export interface ManualMoveSet {
  positionFen: string;
  fromFileIndex: number;
  fromRankIndex: number;
  toFileIndex: number;
  toRankIndex: number;
}

@Component({
  tag: 'loloof64-chessboard-stencil',
  styleUrl: 'loloof64-chessboard-stencil.css',
  shadow: true,
  assetsDirs: ['assets'],
})
export class Loloof64ChessboardStencil {
  /**
   * True if and only if the black side is at bottom.
   */
  @Prop() reversed: boolean = false;

  /**
   * True if white can play move on the board, or false if white
   * must set moves manually (by calling playMove() or playMoveSAN() method).
   */
  @Prop() whitePlayerHuman: boolean = true;

  /**
   * True if black can play move on the board, or false if black
   * must set moves manually (by calling playMove() or playMoveSAN() method).
   */
  @Prop() blackPlayerHuman: boolean = true;

  /**
   * True if and only if last move arrow must be visible (if available).
   */
  @Prop() lastMoveVisible = true;

  /**
   * True if and only if coordinates should be visible.
   */
  @Prop() coordinatesVisible = true;

  /**
   Game ended by checkmate. The payload detail (eventValue.detail) is true if and only if white has been checkmated.
   */
  @Event() checkmate: EventEmitter<boolean>;

  /**
   * Game ended by stalemate.
   */
  @Event() stalemate: EventEmitter<void>;

  /**
   * Game ended by threeFoldRepetition.
   */
  @Event() threeFoldRepetition: EventEmitter<void>;

  /**
   * Game ended by insufficient material.
   */
  @Event() insufficientMaterial: EventEmitter<void>;

  /**
   * Game ended by 50 moves rule.
   */
  @Event() fiftyMovesRule: EventEmitter<void>;

  /**
   * Move done on the board: either by human, or done manually.
   * The payload detail has the following values : moveNumber (number), whiteTurn (boolean), moveFan (string), moveSan (string), fromFileIndex (number), fromRankIndex (number), toFileIndex (number), toRankIndex (number).
   */
  @Event() moveDone: EventEmitter<MoveDone>;

  /**
   * The game is "stalled" as the current player to move is set to external player : so you
   * should commit a move manually. So you can call method playMove() or playMoveSAN(). Eventually,
   * you can check side to move with call to isWhiteTurn() and current position with getCurrentPosition().
   * Useful for making an engine play, for example.
   */
  @Event() waitingManualMove: EventEmitter<void>;

  dragLayerElement!: HTMLDivElement;
  draggedPieceElement!: HTMLImageElement;

  @State() logicalBoard: ChessInstance = new Chess(EMPTY_POSITION);
  @State() dndPieceData: DndPiece = {};
  @State() promotionRequest: PromotionRequest = {};
  @State() gameRunning = false;
  @State() refreshKey: string;

  @State() lastMoveBaselineLeft = 0;
  @State() lastMoveBaselineTop = 0;
  @State() lastMoveBaselineWidth = 0;
  @State() lastMoveBaselineHeight = 0;
  @State() lastMoveBaselineTransform = '';
  @State() lastMoveBaselineTransformOrigin = '0px 0px';

  @State() lastMoveArrow1Left = 0;
  @State() lastMoveArrow1Top = 0;
  @State() lastMoveArrow1Width = 0;
  @State() lastMoveArrow1Height = 0;
  @State() lastMoveArrow1Transform = '';
  @State() lastMoveArrow1TransformOrigin = '0px 0px';

  @State() lastMoveArrow2Left = 0;
  @State() lastMoveArrow2Top = 0;
  @State() lastMoveArrow2Width = 0;
  @State() lastMoveArrow2Height = 0;
  @State() lastMoveArrow2Transform = '';
  @State() lastMoveArrow2TransformOrigin = '0px 0px';

  @State() lastMovePointLeft = 0;
  @State() lastMovePointTop = 0;
  @State() lastMovePointWidth = 0;
  @State() lastMovePointHeight = 0;
  @State() lastMovePointTransform = '';
  @State() lastMovePointTransformOrigin = '0px 0px';

  @State() lastMove: LastMove = undefined;

  @State() firstPosition: string = EMPTY_POSITION;

  /**
   * Starts a new game.
   * * startPositionFen: the requested position. If passed an empty string, will load
   * default position. If passed illegal position, will throw an exception
   * (with an english message as a string).
   */
  @Method()
  async startNewGame(startPositionFen: string) {
    if (startPositionFen.length > 0) {
      this.logicalBoard = new Chess(startPositionFen);
      this.firstPosition = startPositionFen;
    } else {
      this.firstPosition = DEFAULT_POSITION;
      this.logicalBoard = new Chess();
    }

    /*
    Could not start game !
    */
    if (this.logicalBoard.fen() === EMPTY_POSITION) throw 'Illegal position !';

    this.cancelDragAndDrop();
    this.lastMove = undefined;
    this.promotionRequest = {
      startFile: undefined,
      startRank: undefined,
      endFile: undefined,
      endRank: undefined,
    };
    this.gameRunning = true;
  }

  /**
   * Tries to play the given move SAN on the board, only if the current player is defined as an external user.
   * Returns (boolean) true if and only if the move has been commited.
   */
  @Method()
  async playMoveSAN(moveSan: string): Promise<boolean> {
    if (!this.gameRunning) return false;
    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (humanTurn) return false;

    const moveDone = this.logicalBoard.move(moveSan);
    const from = moveDone.from;
    const to = moveDone.to;
    const [startFile, startRank] = this.algebraicCoordinatesToObject(from);
    const [endFile, endRank] = this.algebraicCoordinatesToObject(to);
    this.lastMove = {
      startFile,
      startRank,
      endFile,
      endRank,
    };
    this.updateLastMoveArrow();

    setTimeout(() => {
      this.notifyGameFinishedIfNecessary();
    }, 50);
    return !!moveDone;
  }

  /**
   * Tries to play the given move on the board, only if the current player is defined as an external user.
   * MoveAsParameter is simply an alias for the following : {
      startFile: number;
      startRank: number;
      endFile: number;
      endRank: number;
      promotion?: string;
    }.
   * startFile/startRank/endFile/endRank should be in the range [0,7].
   * promotion valu can be 'n', 'b', 'r' or 'q' string.
   * Returns (boolean) true if and only if the move has been commited.
   */
  @Method()
  async playMove(move: MoveAsParameter): Promise<boolean> {
    if (!this.gameRunning) return false;
    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (humanTurn) return false;

    const from = this.getSquareFromCoordinates(move.startFile, move.startRank);
    const to = this.getSquareFromCoordinates(move.endFile, move.endRank);
    let moveDone: Move;
    if (move.promotion) {
      moveDone = this.logicalBoard.move({
        from,
        to,
        promotion: move.promotion as ShortMove['promotion'],
      });
    } else {
      moveDone = this.logicalBoard.move({
        from,
        to,
      });
    }
    this.lastMove = {
      startFile: move.startFile,
      startRank: move.startRank,
      endFile: move.endFile,
      endRank: move.endRank,
    };
    this.updateLastMoveArrow();

    setTimeout(() => {
      this.notifyGameFinishedIfNecessary();
    }, 50);
    return !!moveDone;
  }

  /**
   * Says if game is running or not.
   * Returns (boolean) true if and only if the game is in progress.
   */
  @Method()
  async gameInProgress(): Promise<boolean> {
    return this.gameRunning;
  }

  /**
   * Returns the current position.
   * Returns (string) the position in Forsyth-Edwards Notation.
   */
  @Method()
  async getCurrentPosition(): Promise<string> {
    return this.logicalBoard.fen();
  }

  /**
   * True if it is white turn, false otherwise.
   */
  @Method()
  async isWhiteTurn(): Promise<boolean> {
    return this.logicalBoard.turn() === 'w';
  }

  /**
   * Stops the current game (if any).
   */
  @Method()
  async stop() {
    this.gameRunning = false;
  }

  /**
   * You can set up the position and last move arrow, if the game is not in progress.
   * Otherwise won't have any effect. 
   * Returns true if the position and last move could be set, false otherwise.
   * If no parameter given or wrong arrow values or null/undefined position, then it will clear last move arrow and sets the board to the position before the first move. 
   * Particularly useful for history managers.
   * 
   * ManualMoveSet is an alias for the following :
   * {
      positionFen: string;
      fromFileIndex: number;
      fromRankIndex: number;
      toFileIndex: number;
      toRankIndex: number;
    }.
    fromFileIndex/fromRankIndex/toFileIndex/toRankIndex should be in the range [0,7].
   */
  @Method()
  async setPositionAndLastMove(data: ManualMoveSet): Promise<boolean> {
    if (this.gameRunning) return false;
    const validArrowValues =
      data.fromFileIndex >= 0 &&
      data.fromFileIndex <= 7 &&
      data.fromRankIndex >= 0 &&
      data.fromRankIndex <= 7 &&
      data.toFileIndex >= 0 &&
      data.toFileIndex <= 7 &&
      data.toRankIndex >= 0 &&
      data.toRankIndex <= 7;
    if (validArrowValues && data.positionFen) {
      this.lastMove = {
        startFile: data.fromFileIndex,
        startRank: data.fromRankIndex,
        endFile: data.toFileIndex,
        endRank: data.toRankIndex,
      };
      this.logicalBoard = new Chess(data.positionFen);
      return true;
    }

    this.lastMove = {
      startFile: undefined,
      startRank: undefined,
      endFile: undefined,
      endRank: undefined,
    };
    this.logicalBoard = new Chess(this.firstPosition);
    return false;
  }

  /**
   * Returns the game pgn as a string. Only sets white and black names if they are defined.
   * newLineChar if set, defines the new line string (it is '\n' by default).
   * maxWidth if set, defines the maximum line width.
   */
  @Method()
  gamePgn(whiteName: string, blackName: string, newLineChar: string = '\n', maxWidth?: number): Promise<string> {
    this.logicalBoard.header('White', whiteName);
    this.logicalBoard.header('Black', blackName);
    return Promise.resolve(this.logicalBoard.pgn({ newline_char: newLineChar, max_width: maxWidth }));
  }

  emitWaitingManualMoveIfPossible() {
    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);

    if (humanTurn) return;
    this.waitingManualMove.emit();
  }

  algebraicCoordinatesToObject(coordsStr: string): Array<number> {
    const asciiLowerA = 97;
    const ascii1 = 49;
    const file = coordsStr.charCodeAt(0) - asciiLowerA;
    const rank = coordsStr.charCodeAt(1) - ascii1;
    return [file, rank];
  }

  updateLastMoveArrow() {
    const componentSize = this.dragLayerElement.getBoundingClientRect().width;
    const cellsSize = componentSize * 0.1;
    const halfThickness = cellsSize * 0.08;

    if (this.lastMove) {
      const startColumn = ['true', true].includes(this.reversed) ? 7 - this.lastMove.startFile : this.lastMove.startFile;
      const startLine = ['true', true].includes(this.reversed) ? this.lastMove.startRank : 7 - this.lastMove.startRank;
      const endColumn = ['true', true].includes(this.reversed) ? 7 - this.lastMove.endFile : this.lastMove.endFile;
      const endLine = ['true', true].includes(this.reversed) ? this.lastMove.endRank : 7 - this.lastMove.endRank;
      const ax = cellsSize * (startColumn + 1.5);
      const ay = cellsSize * (startLine + 1.5);
      const bx = cellsSize * (endColumn + 1.5);
      const by = cellsSize * (endLine + 1.5);
      const realAx = ax - halfThickness;
      const realAy = ay;
      const realBx = bx - halfThickness;
      const realBy = by;
      const vectX = realBx - realAx;
      const vectY = realBy - realAy;
      const baseLineAngleRad = Math.atan2(vectY, vectX) - Math.PI / 2.0;
      const baseLineLength = Math.sqrt(vectX * vectX + vectY * vectY);
      this.lastMoveBaselineLeft = realAx;
      this.lastMoveBaselineTop = realAy;
      this.lastMoveBaselineWidth = 2 * halfThickness;
      this.lastMoveBaselineHeight = baseLineLength;
      this.lastMoveBaselineTransform = `rotate(${baseLineAngleRad}rad)`;
      this.lastMoveBaselineTransformOrigin = `${halfThickness}px ${0}px`;
      const arrow1AngleRad = Math.atan2(vectY, vectX) - Math.PI / 2.0 - (3 * Math.PI) / 4.0;
      const arrow1Length = Math.sqrt(vectX * vectX + vectY * vectY) * 0.4;
      this.lastMoveArrow1Left = realBx;
      this.lastMoveArrow1Top = realBy;
      this.lastMoveArrow1Width = 2 * halfThickness;
      this.lastMoveArrow1Height = arrow1Length;
      this.lastMoveArrow1Transform = `rotate(${arrow1AngleRad}rad)`;
      this.lastMoveArrow1TransformOrigin = `${halfThickness}px ${0}px`;
      const arrow2AngleRad = Math.atan2(vectY, vectX) - Math.PI / 2.0 + (3 * Math.PI) / 4.0;
      const arrow2Length = Math.sqrt(vectX * vectX + vectY * vectY) * 0.4;
      this.lastMoveArrow2Left = realBx;
      this.lastMoveArrow2Top = realBy;
      this.lastMoveArrow2Width = 2 * halfThickness;
      this.lastMoveArrow2Height = arrow2Length;
      this.lastMoveArrow2Transform = `rotate(${arrow2AngleRad}rad)`;
      this.lastMoveArrow2TransformOrigin = `${halfThickness}px ${0}px`;
      const pointAngleRad = Math.atan2(vectY, vectX) + Math.PI / 4.0;
      const pointLength = 2 * halfThickness;
      this.lastMovePointLeft = realBx;
      this.lastMovePointTop = realBy;
      this.lastMovePointWidth = 2 * halfThickness;
      this.lastMovePointHeight = pointLength;
      this.lastMovePointTransform = `rotate(${pointAngleRad}rad)`;
      this.lastMovePointTransformOrigin = 'center';
    } else {
      this.lastMoveBaselineLeft = undefined;
      this.lastMoveBaselineTop = undefined;
      this.lastMoveBaselineWidth = undefined;
      this.lastMoveBaselineHeight = undefined;
      this.lastMoveBaselineTransform = undefined;
      this.lastMoveBaselineTransformOrigin = undefined;
      this.lastMoveArrow1Left = undefined;
      this.lastMoveArrow1Top = undefined;
      this.lastMoveArrow1Width = undefined;
      this.lastMoveArrow1Height = undefined;
      this.lastMoveArrow1Transform = undefined;
      this.lastMoveArrow1TransformOrigin = undefined;
      this.lastMoveArrow2Left = undefined;
      this.lastMoveArrow2Top = undefined;
      this.lastMoveArrow2Width = undefined;
      this.lastMoveArrow2Height = undefined;
      this.lastMoveArrow2Transform = undefined;
      this.lastMoveArrow2TransformOrigin = undefined;
      this.lastMovePointLeft = undefined;
      this.lastMovePointTop = undefined;
      this.lastMovePointWidth = undefined;
      this.lastMovePointHeight = undefined;
      this.lastMovePointTransform = undefined;
      this.lastMovePointTransformOrigin = undefined;
    }
  }

  generateKey() {
    const set = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const KEY_SIZE = 30;
    let result = '';
    for (let i = 0; i < KEY_SIZE; i++) {
      const index = Math.floor(Math.random() * set.length);
      result += set.charAt(index);
    }
    this.refreshKey = result;
  }

  getSquareFromCoordinates(file: number, rank: number): Square {
    return (String.fromCharCode('a'.charCodeAt(0) + file) + String.fromCharCode('1'.charCodeAt(0) + rank)) as Square;
  }

  getImageAtCell(col: number, row: number): string {
    const file = this.reversed ? 7 - col : col;
    const rank = this.reversed ? row : 7 - row;

    if (this.dndPieceData) {
      const isDraggedPieceCell = file === this.dndPieceData.startFile && rank === this.dndPieceData.startRank;
      if (isDraggedPieceCell) return;
    }

    const cellAlgebraic = this.getSquareFromCoordinates(file, rank);
    const piece = this.logicalBoard.get(cellAlgebraic);

    if (!piece) return;

    let pieceCode: string;

    switch (piece.type) {
      case 'p':
        pieceCode = piece.color === 'w' ? 'pl' : 'pd';
        break;
      case 'n':
        pieceCode = piece.color === 'w' ? 'nl' : 'nd';
        break;
      case 'b':
        pieceCode = piece.color === 'w' ? 'bl' : 'bd';
        break;
      case 'r':
        pieceCode = piece.color === 'w' ? 'rl' : 'rd';
        break;
      case 'q':
        pieceCode = piece.color === 'w' ? 'ql' : 'qd';
        break;
      case 'k':
        pieceCode = piece.color === 'w' ? 'kl' : 'kd';
        break;
    }

    if (!pieceCode) return;

    const path = `./assets/chess_vectors/Chess_${pieceCode}t45.svg`;
    return getAssetPath(path);
  }

  getLocalCoordinates(event: MouseEvent): Array<number> {
    if (!this.dragLayerElement) return;

    const thisComponentLocation = this.dragLayerElement.getBoundingClientRect();
    const localX = event.clientX - thisComponentLocation.x;
    const localY = event.clientY - thisComponentLocation.y;

    return [localX, localY];
  }

  getCell(x: number, y: number): Array<number> {
    const componentSize = this.dragLayerElement.getBoundingClientRect().width;
    const cellsSize = componentSize * 0.1;
    const cellX = Math.floor((x - cellsSize) / cellsSize);
    const cellY = Math.floor((y - cellsSize) / cellsSize);

    const file = this.reversed ? 7 - cellX : cellX;
    const rank = this.reversed ? cellY : 7 - cellY;

    return [file, rank];
  }

  getPiece(file: number, rank: number): Piece {
    const square = this.getSquareFromCoordinates(file, rank);
    const piece = this.logicalBoard.get(square);
    return piece;
  }

  cancelDragAndDrop() {
    this.dndPieceData = {
      startFile: undefined,
      startRank: undefined,
      endFile: undefined,
      endRank: undefined,
      piece: undefined,
    };
  }

  @Listen('mousedown', { passive: false })
  handleMouseDown(evt: MouseEvent) {
    evt.preventDefault();
    if (!this.gameRunning) return;
    if (this.promotionRequest.startFile) return;

    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (!humanTurn) return;

    const componentSize = this.dragLayerElement.getBoundingClientRect().width;
    const cellsSize = componentSize * 0.1;

    const [x, y] = this.getLocalCoordinates(evt);
    const [file, rank] = this.getCell(x, y);

    const piece = this.getPiece(file, rank);
    if (!piece) return;

    const whitePiece = piece.color === 'w';
    const isPlayerPiece = (whiteTurn && whitePiece) || (!whiteTurn && !whitePiece);
    if (!isPlayerPiece) return;

    this.dndPieceData = {
      startFile: file,
      startRank: rank,
      endFile: undefined,
      endRank: undefined,
      piece,
      x: cellsSize * (this.reversed ? 8 - file : file + 1),
      y: cellsSize * (this.reversed ? rank + 1 : 8 - rank),
    };
  }

  @Listen('mousemove', { passive: false })
  handleMouseMove(evt: MouseEvent) {
    evt.preventDefault();
    if (!this.gameRunning) return;
    if (!this.dndPieceData.piece) return;
    if (this.promotionRequest.startFile) return;

    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (!humanTurn) return;

    const [x, y] = this.getLocalCoordinates(evt);
    const [file, rank] = this.getCell(x, y);

    this.dndPieceData = {
      ...this.dndPieceData,
      x,
      y,
      endFile: file,
      endRank: rank,
    };
  }

  @Listen('mouseup', { passive: false })
  handleMouseUp(evt: MouseEvent) {
    evt.preventDefault();
    if (!this.gameRunning) return;
    if (this.promotionRequest.startFile) return;
    if (!this.dndPieceData.piece) return;

    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (!humanTurn) return;

    const componentSize = this.dragLayerElement.getBoundingClientRect().width;
    const cellsSize = componentSize * 0.1;

    const [x, y] = this.getLocalCoordinates(evt);
    const [targetFile, targetRank] = this.getCell(x, y);

    const { startFile: originFile, startRank: originRank } = this.dndPieceData;

    const originSquare = this.getSquareFromCoordinates(originFile, originRank);
    const targetSquare = this.getSquareFromCoordinates(targetFile, targetRank);

    const boardLogicCopy = new Chess(this.logicalBoard.fen());
    const moveTryResult = boardLogicCopy.move({ from: originSquare, to: targetSquare, promotion: 'q' as ShortMove['promotion'] });

    if (!moveTryResult) {
      this.cancelDragAndDrop();
      return;
    }

    const isPromotionMove =
      (this.dndPieceData.piece.type === 'p' && this.dndPieceData.piece.color === 'w' && this.dndPieceData.startRank === 6 && this.dndPieceData.endRank === 7) ||
      (this.dndPieceData.piece.type === 'p' && this.dndPieceData.piece.color === 'b' && this.dndPieceData.startRank === 1 && this.dndPieceData.endRank === 0);
    if (isPromotionMove) {
      /*
      Centering the moved piece along in the target cell : better for handling board reversing
       */

      const left = cellsSize * (this.reversed ? 8 - this.dndPieceData.endFile : this.dndPieceData.endFile + 1);
      const top = cellsSize * (this.reversed ? this.dndPieceData.endRank + 1 : 8 - this.dndPieceData.endRank);

      this.draggedPieceElement.style.left = left + 'px';
      this.draggedPieceElement.style.top = top + 'px';

      this.promotionRequest = {
        startFile: originFile,
        startRank: originRank,
        endFile: targetFile,
        endRank: targetRank,
        draggedPieceX: x,
        draggedPieceY: y,
      };
      return;
    }

    const moveNumberBeforeMove = parseInt(this.logicalBoard.fen().split(' ')[5]);
    const moveData = this.logicalBoard.move({ from: originSquare, to: targetSquare });

    this.emitMoveDone(moveData.san, moveNumberBeforeMove);

    this.lastMove = {
      startFile: this.dndPieceData.startFile,
      startRank: this.dndPieceData.startRank,
      endFile: this.dndPieceData.endFile,
      endRank: this.dndPieceData.endRank,
    };
    this.cancelDragAndDrop();
    this.updateLastMoveArrow();

    setTimeout(() => {
      this.notifyGameFinishedIfNecessary();
    }, 50);
  }

  @Listen('mouseleave', { passive: false })
  handleMouseLeave(evt: MouseEvent) {
    evt.preventDefault();
    if (!this.gameRunning) return;
    if (this.promotionRequest.startFile) return;
    if (!this.dndPieceData.piece) return;

    const whiteTurn = this.logicalBoard.turn() === 'w';
    const humanTurn = (whiteTurn && this.whitePlayerHuman) || (!whiteTurn && this.blackPlayerHuman);
    if (!humanTurn) return;
    this.cancelDragAndDrop();
  }

  isDndCrossCell(col: number, row: number): boolean {
    if (!this.dndPieceData.piece) return false;
    const file = this.reversed ? 7 - col : col;
    const rank = this.reversed ? row : 7 - row;

    return file === this.dndPieceData.endFile || rank === this.dndPieceData.endRank;
  }

  isDndOriginCell(col: number, row: number): boolean {
    if (!this.dndPieceData.piece) return false;
    const file = this.reversed ? 7 - col : col;
    const rank = this.reversed ? row : 7 - row;

    return file === this.dndPieceData.startFile && rank === this.dndPieceData.startRank;
  }

  isDndTargetCell(col: number, row: number): boolean {
    if (!this.dndPieceData.piece) return false;
    const file = this.reversed ? 7 - col : col;
    const rank = this.reversed ? row : 7 - row;

    return file === this.dndPieceData.endFile && rank === this.dndPieceData.endRank;
  }

  commitPromotion(pieceType: string) {
    if (!this.promotionRequest.startFile) return;
    if (!['n', 'b', 'r', 'q'].includes(pieceType)) return;

    const originSquare = this.getSquareFromCoordinates(this.promotionRequest.startFile, this.promotionRequest.startRank);
    const targetSquare = this.getSquareFromCoordinates(this.promotionRequest.endFile, this.promotionRequest.endRank);

    const moveNumberBeforeMove = parseInt(this.logicalBoard.fen().split(' ')[5]);
    const moveData = this.logicalBoard.move({ from: originSquare, to: targetSquare, promotion: pieceType as ShortMove['promotion'] });

    this.emitMoveDone(moveData.san, moveNumberBeforeMove);

    this.promotionRequest = {
      startFile: undefined,
      startRank: undefined,
      endFile: undefined,
      endRank: undefined,
    };

    this.lastMove = {
      startFile: this.dndPieceData.startFile,
      startRank: this.dndPieceData.startRank,
      endFile: this.dndPieceData.endFile,
      endRank: this.dndPieceData.endRank,
    };

    this.cancelDragAndDrop();

    this.updateLastMoveArrow();

    setTimeout(() => {
      this.notifyGameFinishedIfNecessary();
    }, 50);
  }

  cancelPendindPrmotion() {
    if (!this.promotionRequest.startFile) return;

    this.promotionRequest = {
      startFile: undefined,
      startRank: undefined,
      endFile: undefined,
      endRank: undefined,
    };

    this.cancelDragAndDrop();
  }

  notifyGameFinishedIfNecessary() {
    if (this.logicalBoard.in_checkmate()) {
      this.gameRunning = false;
      const whiteHasBeenCheckmated = this.logicalBoard.turn() === 'w';
      this.checkmate.emit(whiteHasBeenCheckmated);
      return;
    }
    if (this.logicalBoard.in_stalemate()) {
      this.gameRunning = false;
      this.stalemate.emit();
      return;
    }
    if (this.logicalBoard.in_threefold_repetition()) {
      this.gameRunning = false;
      this.threeFoldRepetition.emit();
      return;
    }
    if (this.logicalBoard.insufficient_material()) {
      this.gameRunning = false;
      this.insufficientMaterial.emit();
      return;
    }
    if (this.logicalBoard.in_draw()) {
      this.gameRunning = false;
      this.fiftyMovesRule.emit();
      return;
    }
    this.emitWaitingManualMoveIfPossible();
  }

  /*
  Must be called before reseting Drag and drop data - as it relies on it. - and after the move has been done.
  */
  emitMoveDone(moveSan: string, moveNumberBeforeMove: number) {
    const whiteTurn = this.logicalBoard.turn() === 'b';
    const moveFan = this.convertMoveSanToFan(moveSan, whiteTurn);

    this.moveDone.emit({
      moveNumber: moveNumberBeforeMove,
      moveSan,
      moveFan,
      whiteTurn,
      fromFileIndex: this.dndPieceData.startFile,
      fromRankIndex: this.dndPieceData.startRank,
      toFileIndex: this.dndPieceData.endFile,
      toRankIndex: this.dndPieceData.endRank,
    });
  }

  convertMoveSanToFan(moveSan: string, whiteTurn: boolean): string {
    moveSan = moveSan.replace(/K/g, whiteTurn ? '\u2654' : '\u265A').normalize('NFKC');
    moveSan = moveSan.replace(/Q/g, whiteTurn ? '\u2655' : '\u265B').normalize('NFKC');
    moveSan = moveSan.replace(/R/g, whiteTurn ? '\u2656' : '\u265C').normalize('NFKC');
    moveSan = moveSan.replace(/B/g, whiteTurn ? '\u2657' : '\u265D').normalize('NFKC');
    moveSan = moveSan.replace(/N/g, whiteTurn ? '\u2658' : '\u265E').normalize('NFKC');
    return moveSan;
  }

  @Watch('reversed')
  updateBoardRegardingReversedState() {
    if (this.draggedPieceElement) {
      const componentSize = this.dragLayerElement.getBoundingClientRect().width;
      const cellsSize = componentSize * 0.1;
      const left = cellsSize * (this.reversed ? 8 - this.dndPieceData.endFile : this.dndPieceData.endFile + 1);
      const top = cellsSize * (this.reversed ? this.dndPieceData.endRank + 1 : 8 - this.dndPieceData.endRank);

      this.draggedPieceElement.style.left = left + 'px';
      this.draggedPieceElement.style.top = top + 'px';
    }
    this.updateLastMoveArrow();
  }

  render() {
    const isWhiteTurn = this.logicalBoard.turn() === 'w';
    const turnClasses = isWhiteTurn ? 'turn--white' : 'turn--black';

    let whitePawnDragged = false;
    let whiteKnightDragged = false;
    let whiteBishopDragged = false;
    let whiteRookDragged = false;
    let whiteQueenDragged = false;
    let whiteKingDragged = false;

    let blackPawnDragged = false;
    let blackKnightDragged = false;
    let blackBishopDragged = false;
    let blackRookDragged = false;
    let blackQueenDragged = false;
    let blackKingDragged = false;

    try {
      whitePawnDragged = this.dndPieceData.piece.type === 'p' && this.dndPieceData.piece.color === 'w';
      whiteKnightDragged = this.dndPieceData.piece.type === 'n' && this.dndPieceData.piece.color === 'w';
      whiteBishopDragged = this.dndPieceData.piece.type === 'b' && this.dndPieceData.piece.color === 'w';
      whiteRookDragged = this.dndPieceData.piece.type === 'r' && this.dndPieceData.piece.color === 'w';
      whiteQueenDragged = this.dndPieceData.piece.type === 'q' && this.dndPieceData.piece.color === 'w';
      whiteKingDragged = this.dndPieceData.piece.type === 'k' && this.dndPieceData.piece.color === 'w';

      blackPawnDragged = this.dndPieceData.piece.type === 'p' && this.dndPieceData.piece.color === 'b';
      blackKnightDragged = this.dndPieceData.piece.type === 'n' && this.dndPieceData.piece.color === 'b';
      blackBishopDragged = this.dndPieceData.piece.type === 'b' && this.dndPieceData.piece.color === 'b';
      blackRookDragged = this.dndPieceData.piece.type === 'r' && this.dndPieceData.piece.color === 'b';
      blackQueenDragged = this.dndPieceData.piece.type === 'q' && this.dndPieceData.piece.color === 'b';
      blackKingDragged = this.dndPieceData.piece.type === 'k' && this.dndPieceData.piece.color === 'b';
    } catch {}

    let draggedImage: string;
    if (whitePawnDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_plt45.svg');
    if (whiteKnightDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_nlt45.svg');
    if (whiteBishopDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_blt45.svg');
    if (whiteRookDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_rlt45.svg');
    if (whiteQueenDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_qlt45.svg');
    if (whiteKingDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_klt45.svg');
    if (blackPawnDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_pdt45.svg');
    if (blackKnightDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_ndt45.svg');
    if (blackBishopDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_bdt45.svg');
    if (blackRookDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_rdt45.svg');
    if (blackQueenDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_qdt45.svg');
    if (blackKingDragged) draggedImage = getAssetPath('./assets/chess_vectors/Chess_kdt45.svg');

    const draggedPieceStyle = draggedImage
      ? {
          left: this.dndPieceData.x.toString() + 'px',
          top: this.dndPieceData.y.toString() + 'px',
        }
      : {};

    const lastMoveBaseLineStyle = this.lastMoveVisible
      ? {
          'left': `${this.lastMoveBaselineLeft}px`,
          'top': `${this.lastMoveBaselineTop}px`,
          'width': `${this.lastMoveBaselineWidth}px`,
          'height': `${this.lastMoveBaselineHeight}px`,
          'transform': `${this.lastMoveBaselineTransform}`,
          '-ms-transform': `${this.lastMoveBaselineTransform}`,
          '-moz-transform': `${this.lastMoveBaselineTransform}`,
          '-webkit-transform': `${this.lastMoveBaselineTransform}`,
          'transform-origin': `${this.lastMoveBaselineTransformOrigin}`,
          '-ms-transform-origin': `${this.lastMoveBaselineTransformOrigin}`,
          '-moz-transform-origin': `${this.lastMoveBaselineTransformOrigin}`,
          '-webkit-transform-origin': `${this.lastMoveBaselineTransformOrigin}`,
        }
      : {};
    const lastMoveArrow1Style = this.lastMoveVisible
      ? {
          'left': `${this.lastMoveArrow1Left}px`,
          'top': `${this.lastMoveArrow1Top}px`,
          'width': `${this.lastMoveArrow1Width}px`,
          'height': `${this.lastMoveArrow1Height}px`,
          'transform': `${this.lastMoveArrow1Transform}`,
          '-ms-transform': `${this.lastMoveArrow1Transform}`,
          '-moz-transform': `${this.lastMoveArrow1Transform}`,
          '-webkit-transform': `${this.lastMoveArrow1Transform}`,
          'transform-origin': `${this.lastMoveArrow1TransformOrigin}`,
          '-ms-transform-origin': `${this.lastMoveArrow1TransformOrigin}`,
          '-moz-transform-origin': `${this.lastMoveArrow1TransformOrigin}`,
          '-webkit-transform-origin': `${this.lastMoveArrow1TransformOrigin}`,
        }
      : {};
    const lastMoveArrow2Style = this.lastMoveVisible
      ? {
          'left': `${this.lastMoveArrow2Left}px`,
          'top': `${this.lastMoveArrow2Top}px`,
          'width': `${this.lastMoveArrow2Width}px`,
          'height': `${this.lastMoveArrow2Height}px`,
          'transform': `${this.lastMoveArrow2Transform}`,
          '-ms-transform': `${this.lastMoveArrow2Transform}`,
          '-moz-transform': `${this.lastMoveArrow2Transform}`,
          '-webkit-transform': `${this.lastMoveArrow2Transform}`,
          'transform-origin': `${this.lastMoveArrow2TransformOrigin}`,
          '-ms-transform-origin': `${this.lastMoveArrow2TransformOrigin}`,
          '-moz-transform-origin': `${this.lastMoveArrow2TransformOrigin}`,
          '-webkit-transform-origin': `${this.lastMoveArrow2TransformOrigin}`,
        }
      : {};
    const lastMovePointStyle = this.lastMoveVisible
      ? {
          'left': `${this.lastMovePointLeft}px`,
          'top': `${this.lastMovePointTop}px`,
          'width': `${this.lastMovePointWidth}px`,
          'height': `${this.lastMovePointHeight}px`,
          'transform': `${this.lastMovePointTransform}`,
          '-ms-transform': `${this.lastMovePointTransform}`,
          '-moz-transform': `${this.lastMovePointTransform}`,
          '-webkit-transform': `${this.lastMovePointTransform}`,
          'transform-origin': `${this.lastMovePointTransformOrigin}`,
          '-ms-transform-origin': `${this.lastMovePointTransformOrigin}`,
          '-moz-transform-origin': `${this.lastMovePointTransformOrigin}`,
          '-webkit-transform-origin': `${this.lastMovePointTransformOrigin}`,
        }
      : {};

    const promotionKnight = this.logicalBoard.turn() === 'w' ? getAssetPath('./assets/chess_vectors/Chess_nlt45.svg') : getAssetPath('./assets/chess_vectors/Chess_ndt45.svg');
    const promotionBishop = this.logicalBoard.turn() === 'w' ? getAssetPath('./assets/chess_vectors/Chess_blt45.svg') : getAssetPath('./assets/chess_vectors/Chess_bdt45.svg');
    const promotionRook = this.logicalBoard.turn() === 'w' ? getAssetPath('./assets/chess_vectors/Chess_rlt45.svg') : getAssetPath('./assets/chess_vectors/Chess_rdt45.svg');
    const promotionQueen = this.logicalBoard.turn() === 'w' ? getAssetPath('./assets/chess_vectors/Chess_qlt45.svg') : getAssetPath('./assets/chess_vectors/Chess_qdt45.svg');

    return (
      <Fragment>
        <div id="lower_layer" key={this.refreshKey}>
          <div></div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
            const key = 'top_coord_' + colIndex;
            const letter = String.fromCharCode('A'.charCodeAt(0) + (this.reversed ? 7 - colIndex : colIndex));
            return (
              <p class="coordinate" key={key}>
                {this.coordinatesVisible ? letter : ''}
              </p>
            );
          })}
          <div></div>

          {[0, 1, 2, 3, 4, 5, 6, 7].map(rowIndex => {
            const digit = String.fromCharCode('1'.charCodeAt(0) + (this.reversed ? rowIndex : 7 - rowIndex));
            return (
              <Fragment>
                <p class="coordinate" key={'left_coord_' + rowIndex}>
                  {this.coordinatesVisible ? digit : ''}
                </p>
                {[
                  ...[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
                    const isWhiteCell = (colIndex + rowIndex) % 2 == 0;
                    let classes = isWhiteCell ? 'cell cell--white' : 'cell cell--black';
                    if (this.isDndCrossCell(colIndex, rowIndex)) classes = 'cell cell--dndcross';
                    if (this.isDndOriginCell(colIndex, rowIndex)) classes = 'cell cell--dndorigin';
                    if (this.isDndTargetCell(colIndex, rowIndex)) classes = 'cell cell--dndtarget';
                    const pieceImage = this.getImageAtCell(colIndex, rowIndex);
                    return (
                      <div class={classes} key={'cell_' + rowIndex + colIndex}>
                        {pieceImage && <img class="cell_piece" src={pieceImage}></img>}
                      </div>
                    );
                  }),
                ]}
                <p class="coordinate" key={'right_coord_' + rowIndex}>
                  {this.coordinatesVisible ? digit : ''}
                </p>
              </Fragment>
            );
          })}

          <div></div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
            const key = 'bottom_coord_' + colIndex;
            const letter = String.fromCharCode('A'.charCodeAt(0) + (this.reversed ? 7 - colIndex : colIndex));
            return (
              <p class="coordinate" key={key}>
                {this.coordinatesVisible ? letter : ''}
              </p>
            );
          })}
          <div class="turn">
            <div class={turnClasses}></div>
          </div>
        </div>

        <div id="last_move_layer" hidden={!this.lastMoveVisible || !this.lastMove}>
          <div class="last_move_line" style={lastMoveBaseLineStyle}></div>
          <div class="last_move_line" style={lastMoveArrow1Style}></div>
          <div class="last_move_line" style={lastMoveArrow2Style}></div>
          <div class="last_move_line" style={lastMovePointStyle}></div>
        </div>

        <div id="dnd_layer" ref={el => (this.dragLayerElement = el as HTMLDivElement)}>
          {draggedImage && <img src={draggedImage} class="dragged_piece" ref={el => (this.draggedPieceElement = el as HTMLImageElement)} style={draggedPieceStyle}></img>}
        </div>

        {this.promotionRequest.startFile && (
          <div id="promotion_dialog_backdrop" onClick={() => this.cancelPendindPrmotion()}>
            <div id="promotion_dialog_content">
              <img class="promotion_button" onClick={() => this.commitPromotion('q')} src={promotionQueen}></img>
              <img class="promotion_button" onClick={() => this.commitPromotion('r')} src={promotionRook}></img>
              <img class="promotion_button" onClick={() => this.commitPromotion('b')} src={promotionBishop}></img>
              <img class="promotion_button" onClick={() => this.commitPromotion('n')} src={promotionKnight}></img>
            </div>
          </div>
        )}
      </Fragment>
    );
  }
}
