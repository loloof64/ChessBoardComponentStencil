# loloof64-chessboard-stencil

A chess board web component.

* You can play legal moves for sides for which you define an human mode. If a side has a external mode, you must give the legal moves manually, by calling the method `playMove`
* A dialog is shown to you for choosing the promotion piece (clicking outside buttons dismiss it)
* Events are sent when game is finished, as well as a move has been done on the board (i mean in human mode)
* You can configure several colors: cells, coordinates, hovering cell indicator, ...

## CSS variables

| Name                                           | Description                                                | Default     |
|------------------------------------------------|------------------------------------------------------------|-------------|
| --loloof64-chessboard-stencil-size             | The size of the board (width and height)                   | 100px       |
| --loloof64-chessboard-stencil-background-color | The color of the outside of the board (coordinates zone)   | #124589     |
| --loloof64-chessboard-stencil-coordinate-color | The color of the coordinates letter and digits             | yellow      |
| --loloof64-chessboard-stencil-white-cell-color | The color of the white cells                               | navajowhite |
| --loloof64-chessboard-stencil-black-cell-color | The color of the black cells                               | peru        |
| --loloof64-chessboard-stencil-dnd-origin       | The color of the start cell of Drag and Drop               | crimson     |
| --loloof64-chessboard-stencil-dnd-target       | The color of the target cell of Drag and Drop              | forestGreen |
| --loloof64-chessboard-stencil-dnd-end          | The color of cells belonging to the cross of Drag and Drop | dimGray     |

<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description                                      | Type      | Default |
| ---------- | ---------- | ------------------------------------------------ | --------- | ------- |
| `reversed` | `reversed` | True if and only if the black side is at bottom. | `boolean` | `false` |


## Events

| Event                  | Description                                                                                                    | Type                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `checkmate`            | Game ended by checkmate. Detail property (eventValue.detail) is true if and only if white has been checkmated. | `CustomEvent<boolean>` |
| `fiftyMovesRule`       | Game ended by 50 moves rule.                                                                                   | `CustomEvent<void>`    |
| `insufficientMaterial` | Game ended by insufficient material.                                                                           | `CustomEvent<void>`    |
| `stalemate`            | Game ended by stalemate.                                                                                       | `CustomEvent<void>`    |
| `threeFoldRepetition`  | Game ended by threeFoldRepetition.                                                                             | `CustomEvent<void>`    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
