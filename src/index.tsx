import './app.css';

import type { JSX } from 'preact/jsx-runtime';
import { render } from 'preact';

function App(): JSX.Element {
  return (
    <p>Hello world!</p>
  );
}

render(<App />, document.querySelector<HTMLDivElement>('#app')!);
