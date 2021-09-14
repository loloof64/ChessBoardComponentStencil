import { Component, h, Fragment, State, getAssetPath, Prop } from '@stencil/core';
import { Chess, ChessInstance, Square } from 'chess.js';

@Component({
  tag: 'loloof64-chessboard-stencil',
  styleUrl: 'loloof64-chessboard-stencil.css',
  shadow: true,
  assetsDirs: ['assets/chess_vectors'],
})
export class Loloof64ChessboardStencil {
  /** 
  True if and only if the black side is at bottom 
  */
  @Prop() reversed: boolean = false;

  @State() logicalBoard: ChessInstance = new Chess();

  getImageAtCell(col: number, row: number) {
    const file = this.reversed ? 7 - col : col;
    const rank = this.reversed ? row : 7 - row;

    const cellAlgebraic = (String.fromCharCode('a'.charCodeAt(0) + file) + String.fromCharCode('1'.charCodeAt(0) + rank)) as Square;
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

  render() {
    const isWhiteTurn = this.logicalBoard.turn() === 'w';
    const turnClasses = isWhiteTurn ? 'turn--white' : 'turn--black';

    return (
      <Fragment>
        <div id="lower_layer">
          <div></div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
            const key = 'top_coord_' + colIndex;
            const letter = String.fromCharCode('A'.charCodeAt(0) + (this.reversed ? 7- colIndex : colIndex));
            return (
              <p class="coordinate" key={key}>
                {letter}
              </p>
            );
          })}
          <div></div>

          {[0, 1, 2, 3, 4, 5, 6, 7].map(rowIndex => {
            const digit = String.fromCharCode('1'.charCodeAt(0) + (this.reversed ? rowIndex : 7 - rowIndex));
            return (
              <Fragment>
                <p class="coordinate" key={'left_coord_' + rowIndex}>
                  {digit}
                </p>
                {[
                  ...[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
                    const isWhiteCell = (colIndex + rowIndex) % 2 == 0;
                    const classes = isWhiteCell ? 'cell cell--white' : 'cell cell--black';
                    const pieceImage = this.getImageAtCell(colIndex, rowIndex);
                    return (
                      <div class={classes} key={'cell_' + rowIndex + colIndex}>
                        {pieceImage && <img class="cell_piece" src={pieceImage}></img>}
                      </div>
                    );
                  }),
                ]}
                <p class="coordinate" key={'right_coord_' + rowIndex}>
                  {digit}
                </p>
              </Fragment>
            );
          })}

          <div></div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
            const key = 'bottom_coord_' + colIndex;
            const letter = String.fromCharCode('A'.charCodeAt(0) + (this.reversed ? 7- colIndex : colIndex));
            return (
              <p class="coordinate" key={key}>
                {letter}
              </p>
            );
          })}
          <div class="turn">
            <div class={turnClasses}></div>
          </div>
        </div>

        <div id="dnd_layer"></div>
      </Fragment>
    );
  }
}
