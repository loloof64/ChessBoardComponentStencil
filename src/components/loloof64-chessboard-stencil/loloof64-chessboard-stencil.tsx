import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'loloof64-chessboard-stencil',
  styleUrl: 'loloof64-chessboard-stencil.css',
  shadow: true,
})
export class Loloof64ChessboardStencil {

  render() {
    return (
      <Host>
        <div id="lower_layer"></div>
      </Host>
    );
  }

}
