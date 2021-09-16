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

| Property           | Attribute            | Description                                                                                                                          | Type      | Default |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------- |
| `blackPlayerHuman` | `black-player-human` | True if black can play move on the board, or false if black must set moves manually (by calling playMove() or playMoveSAN() method). | `boolean` | `true`  |
| `reversed`         | `reversed`           | True if and only if the black side is at bottom.                                                                                     | `boolean` | `false` |
| `whitePlayerHuman` | `white-player-human` | True if white can play move on the board, or false if white must set moves manually (by calling playMove() or playMoveSAN() method). | `boolean` | `true`  |


## Events

| Event                  | Description                                                                                                                                                                                                                                                                        | Type                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `checkmate`            | Game ended by checkmate. The payload detail (eventValue.detail) is true if and only if white has been checkmated.                                                                                                                                                                  | `CustomEvent<boolean>`  |
| `fiftyMovesRule`       | Game ended by 50 moves rule.                                                                                                                                                                                                                                                       | `CustomEvent<void>`     |
| `insufficientMaterial` | Game ended by insufficient material.                                                                                                                                                                                                                                               | `CustomEvent<void>`     |
| `moveDone`             | Move done on the board: either by human, or done manually. The payload detail has the following values : moveNumber (number), whiteTurn (boolean), moveFan (string), moveSan (string), fromFileIndex (number), fromRankIndex (number), toFileIndex (number), toRankIndex (number). | `CustomEvent<MoveDone>` |
| `stalemate`            | Game ended by stalemate.                                                                                                                                                                                                                                                           | `CustomEvent<void>`     |
| `threeFoldRepetition`  | Game ended by threeFoldRepetition.                                                                                                                                                                                                                                                 | `CustomEvent<void>`     |


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



### `playMove(move: MoveAsParameter) => Promise<boolean>`

Tries to play the given move on the board, only if the current player is defined as an external user.
Returns (boolean) true if and only if the move has been commited.

#### Returns

Type: `Promise<boolean>`



### `playMoveSAN(moveSan: string) => Promise<boolean>`

Tries to play the given move SAN on the board, only if the current player is defined as an external user.
Returns (boolean) true if and only if the move has been commited.

#### Returns

Type: `Promise<boolean>`



### `startNewGame(startPositionFen: string) => Promise<void>`

Starts a new game.
* startPositionFen: the requested position. If passed an empty string, will load
default position. If passed illegal position, will throw an exception
(with an english message as a string).

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
