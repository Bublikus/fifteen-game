import React, { useState, useEffect } from 'react';
import FlipMove from 'react-flip-move';
import Select from 'react-select';
import { useFifteenGame } from './useFifteenGame';
import './style.css';

const levels = {
  easy: {
    rows: 3,
    cols: 3,
  },
  medium: {
    rows: 4,
    cols: 4,
  },
  hard: {
    rows: 5,
    cols: 5,
  },
};

const ANIM_DURATION = 100;
const MIX_DURATION = 1000;

const options = Object.keys(levels).map((lev) => ({
  value: lev,
  label: `${lev} — ${levels[lev].cols}x${levels[lev].rows}`,
}));

export default function App() {
  const [level, setLevel] = useState(levels[Object.keys(levels)[0]]);
  const [duration, setDuration] = useState(MIX_DURATION);
  const [loading, setLoading] = useState(true);

  const onSuccess = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        alert('😎 You win!');
        resolve();
      }, ANIM_DURATION);
    });

  const { rows, cols, empty, cells, setRows, setCols, onCellClick } =
    useFifteenGame(onSuccess, { rows: level.rows, cols: level.cols });

  const onChangeLevel = (levOption) => {
    const lev = levOption.value;
    setCols(levels[lev].cols);
    setRows(levels[lev].rows);
    setLevel(lev);
  };

  useEffect(
    () => setTimeout(() => setDuration(ANIM_DURATION), MIX_DURATION),
    []
  );

  useEffect(() => {
    const checkSelectionInterval = setInterval(
      () => window.getSelection()?.removeAllRanges?.(),
      20
    );

    const blockGestures = (e) => {
      e.preventDefault();
      document.body.style.zoom = 1;
    };

    document.addEventListener('gesturestart', blockGestures);
    document.addEventListener('gesturechange', blockGestures);
    document.addEventListener('gestureend', blockGestures);

    return () => {
      document.removeEventListener('gesturestart', blockGestures);
      document.removeEventListener('gesturechange', blockGestures);
      document.removeEventListener('gestureend', blockGestures);

      clearInterval(checkSelectionInterval);
    };
  }, []);

  return (
    <>
      {loading && <p className="loading">loading...</p>}
      <main className={loading ? 'loading' : ''}>
        <img
          className="bg"
          src="https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmtSQ1E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--508ba3f1b614e749f8c574141293bb35e953f58d/tetris-bg-5.jpg"
          alt="bg"
          onLoad={() => setLoading(false)}
        />

        <header>
          <h1>Fifteen Game</h1>
          <h3>
            Level:
            <label>
              <Select
                isSearchable={false}
                defaultValue={options[0]}
                options={options}
                onChange={onChangeLevel}
              />
            </label>
          </h3>
        </header>

        <section style={{ '--rows': rows, '--cols': cols }}>
          <FlipMove typeName={null} duration={duration} easing="ease-out">
            {cells.map((cell) => (
              <button key={cell} onClick={onCellClick.bind(null, cell)}>
                {cell === empty ? '' : cell}
              </button>
            ))}
          </FlipMove>
        </section>

        <footer>
          <strong className="help">
            <span>Sort numbers:</span>
            <div>
              <div>1 2 3</div>
              <div>4 5 6</div>
              <div>7 8</div>
            </div>
          </strong>
        </footer>
      </main>
    </>
  );
}
