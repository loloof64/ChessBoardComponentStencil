import { Component, h, Fragment } from '@stencil/core';

@Component({
  tag: 'loloof64-chessboard-stencil',
  styleUrl: 'loloof64-chessboard-stencil.css',
  shadow: true,
})
export class Loloof64ChessboardStencil {
  render() {
    return (
      <Fragment>
        <div id="lower_layer">
          <div></div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
            const key = 'top_coord_' + colIndex;
            const letter = String.fromCharCode('A'.charCodeAt(0) + colIndex);
            return (
              <p class="coordinate" key={key}>
                {letter}
              </p>
            );
          })}
          <div></div>

          {[0, 1, 2, 3, 4, 5, 6, 7].map(rowIndex => {
            const digit = String.fromCharCode('8'.charCodeAt(0) - rowIndex);
            return (
              <Fragment>
                <p class="coordinate" key={'left_coord_' + rowIndex}>
                  {digit}
                </p>
                {[
                  ...[0, 1, 2, 3, 4, 5, 6, 7].map(colIndex => {
                    const isWhiteCell = (colIndex + rowIndex) % 2 == 0;
                    const classes = isWhiteCell ? 'cell--white' : 'cell--black';
                    return <div class={classes} key={'cell_' + rowIndex + colIndex}></div>;
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
            const letter = String.fromCharCode('A'.charCodeAt(0) + colIndex);
            return (
              <p class="coordinate" key={key}>
                {letter}
              </p>
            );
          })}
          <div></div>
        </div>
      </Fragment>
    );
  }
}
