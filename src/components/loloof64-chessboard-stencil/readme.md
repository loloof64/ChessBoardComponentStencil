# loloof64-chessboard-stencil

A chess board web component.

* You can play legal moves for sides for which you define an human mode. If a side has a external mode, you must give the legal moves manually, by calling the method `playMove` or `playMoveSAN`.
* A dialog is shown to you for choosing the promotion piece (clicking outside buttons dismiss it)
* Events are sent when game is finished, as well as a move has been done on the board (i mean in human mode)
* You can configure several colors: cells, coordinates, hovering cell indicator, ...

## CSS variables

| Name                                                | Description                                                | Default     |
|-----------------------------------------------------|------------------------------------------------------------|-------------|
| --loloof64-chessboard-stencil-size                  | The size of the board (width and height)                   | 100px       |
| --loloof64-chessboard-stencil-background-color      | The color of the outside of the board (coordinates zone)   | #124589     |
| --loloof64-chessboard-stencil-coordinate-color      | The color of the coordinates letter and digits             | yellow      |
| --loloof64-chessboard-stencil-white-cell-color      | The color of the white cells                               | navajowhite |
| --loloof64-chessboard-stencil-black-cell-color      | The color of the black cells                               | peru        |
| --loloof64-chessboard-stencil-dnd-origin            | The color of the start cell of Drag and Drop               | crimson     |
| --loloof64-chessboard-stencil-dnd-target            | The color of the target cell of Drag and Drop              | forestGreen |
| --loloof64-chessboard-stencil-dnd-end               | The color of cells belonging to the cross of Drag and Drop | dimGray     |
| --loloof64-chessboard-stencil-last-move-arrow-color | The color of last move arrow                               | cadetBlue   |

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute             | Description                                                                                                                          | Type      | Default |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------- |
| `blackPlayerHuman`   | `black-player-human`  | True if black can play move on the board, or false if black must set moves manually (by calling playMove() or playMoveSAN() method). | `boolean` | `true`  |
| `coordinatesVisible` | `coordinates-visible` | True if and only if coordinates should be visible.                                                                                   | `boolean` | `true`  |
| `lastMoveVisible`    | `last-move-visible`   | True if and only if last move arrow must be visible (if available).                                                                  | `boolean` | `true`  |
| `reversed`           | `reversed`            | True if and only if the black side is at bottom.                                                                                     | `boolean` | `false` |
| `whitePlayerHuman`   | `white-player-human`  | True if white can play move on the board, or false if white must set moves manually (by calling playMove() or playMoveSAN() method). | `boolean` | `true`  |


## Events

| Event                  | Description                                                                                                                                                                                                                                                                                                                                | Type                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `checkmate`            | Game ended by checkmate. The payload detail (eventValue.detail) is true if and only if white has been checkmated.                                                                                                                                                                                                                          | `CustomEvent<boolean>`  |
| `fiftyMovesRule`       | Game ended by 50 moves rule.                                                                                                                                                                                                                                                                                                               | `CustomEvent<void>`     |
| `insufficientMaterial` | Game ended by insufficient material.                                                                                                                                                                                                                                                                                                       | `CustomEvent<void>`     |
| `moveDone`             | Move done on the board: either by human, or done manually. The payload detail has the following values : moveNumber (number), whiteTurn (boolean), moveFan (string), moveSan (string), fromFileIndex (number), fromRankIndex (number), toFileIndex (number), toRankIndex (number).                                                         | `CustomEvent<MoveDone>` |
| `stalemate`            | Game ended by stalemate.                                                                                                                                                                                                                                                                                                                   | `CustomEvent<void>`     |
| `threeFoldRepetition`  | Game ended by threeFoldRepetition.                                                                                                                                                                                                                                                                                                         | `CustomEvent<void>`     |
| `waitingManualMove`    | The game is "stalled" as the current player to move is set to external player : so you should commit a move manually. So you can call method playMove() or playMoveSAN(). Eventually, you can check side to move with call to isWhiteTurn() and current position with getCurrentPosition(). Useful for making an engine play, for example. | `CustomEvent<void>`     |


## Methods

### `gameInProgress() => Promise<boolean>`

Says if game is running or not.
Returns (boolean) true if and only if the game is in progress.

#### Returns

Type: `Promise<boolean>`



### `getCurrentPosition() => Promise<string>`

Returns the current position.
Returns (string) the position in Forsyth-Edwards Notation.

#### Returns

Type: `Promise<string>`



### `isWhiteTurn() => Promise<boolean>`

True if it is white turn, false otherwise.

#### Returns

Type: `Promise<boolean>`



### `playMove(move: MoveAsParameter) => Promise<boolean>`

Tries to play the given move on the board, only if the current player is defined as an external user.
MoveAsParameter is simply an alias for the following : {
 startFile: number;
 startRank: number;
 endFile: number;
 endRank: number;
 promotion?: string;
}.
startFile/startRank/endFile/endRank should be in the range [0,7].
promotion valu can be 'n', 'b', 'r' or 'q' string.
Returns (boolean) true if and only if the move has been commited.

#### Returns

Type: `Promise<boolean>`



### `playMoveSAN(moveSan: string) => Promise<boolean>`

Tries to play the given move SAN on the board, only if the current player is defined as an external user.
Returns (boolean) true if and only if the move has been commited.

#### Returns

Type: `Promise<boolean>`



### `setPositionAndLastMove(data: ManualMoveSet) => Promise<boolean>`

You can set up the position and last move arrow, if the game is not in progress.
Otherwise won't have any effect. 
Returns true if the position and last move could be set, false otherwise.
If no parameter given or wrong arrow values or null/undefined position, then it will clear last move arrow and sets the board to the position before the first move. 
Particularly useful for history managers.

ManualMoveSet is an alias for the following :
{
 positionFen: string;
 fromFileIndex: number;
 fromRankIndex: number;
 toFileIndex: number;
 toRankIndex: number;
}.
fromFileIndex/fromRankIndex/toFileIndex/toRankIndex should be in the range [0,7].

#### Returns

Type: `Promise<boolean>`



### `startNewGame(startPositionFen: string) => Promise<void>`

Starts a new game.
* startPositionFen: the requested position. If passed an empty string, will load
default position. If passed illegal position, will throw an exception
(with an english message as a string).

#### Returns

Type: `Promise<void>`



### `stop() => Promise<void>`

Stops the current game (if any).

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
