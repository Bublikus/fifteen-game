import { useRef, useState, useEffect, useCallback } from 'react';
import { InputHandler } from './InputHandler';
import {trackGameStart} from './firebase';

export function useFifteenGame(solvedCallback, config) {
  const ROWS = config?.rows || 4;
  const COLS = config?.cols || 4;
  const empty = 0;

  const handlerRef = useRef();
  const startGameTimeRef = useRef(0);

  const [rows, setRows] = useState(ROWS);
  const [cols, setCols] = useState(COLS);
  const [values, setValues] = useState(generateValues({ rows, cols, empty }));

  const [cells, setCells] = useState(values);

  const resetGame = async () => {
    startGameTimeRef.current = 0;

    const values = generateValues({ rows, cols, empty });
    const initial = shuffle(values, 1000);

    setValues(values);
    setCells(initial);
  };

  useEffect(() => {
    resetGame();
  }, [rows, cols]);

  const actionHandler = useCallback(
    async (action) => {
      if (!startGameTimeRef.current) trackGameStart();
      startGameTimeRef.current = startGameTimeRef.current || Date.now();

      const emptyIndex = cells.indexOf(empty);

      const cellIndex = {
        up: emptyIndex + cols,
        down: emptyIndex - cols,
        left: emptyIndex + 1,
        right: emptyIndex - 1,
      }[action];

      const cellRowIndex = Math.ceil((cellIndex + 1) / rows);
      const emptyRowIndex = Math.ceil((emptyIndex + 1) / rows);
      const isSameRow = cellRowIndex === emptyRowIndex;
      const isHorizontalAction = ['left', 'right'].includes(action);
      const invalidHorizontal = isHorizontalAction && !isSameRow;

      if (!cells[cellIndex] || invalidHorizontal) return;

      const newCells = cells.slice();
      newCells[emptyIndex] = newCells[cellIndex];
      newCells[cellIndex] = empty;

      setCells(newCells);

      if (isValidResult(newCells)) {
        const time = Math.floor((Date.now() - startGameTimeRef.current) / 1000);
        await solvedCallback?.(time);
      }
    },
    [cols, rows, cells, isValidResult, solvedCallback]
  );

  useEffect(() => {
    handlerRef.current = (
      handlerRef.current || new InputHandler({ swipeTickThresholdPX: 0 })
    ).handleActions({
      ArrowUp: () => actionHandler('up'),
      ArrowDown: () => actionHandler('down'),
      ArrowLeft: () => actionHandler('left'),
      ArrowRight: () => actionHandler('right'),
      swipeUp: () => actionHandler('up'),
      swipeDown: () => actionHandler('down'),
      swipeLeft: () => actionHandler('left'),
      swipeRight: () => actionHandler('right'),
    });
  }, [actionHandler]);

  function generateValues({ rows, cols, empty }) {
    const values = Array.from({ length: rows * cols - 1 }).map((_, i) => i + 1);
    return values.concat(empty);
  }

  async function onCellClick(cell) {
    if (!isNextToEmpty(cells, cell)) return;

    const cellIndex = cells.indexOf(cell);
    const emptyIndex = cells.indexOf(empty);

    const newCells = cells.slice();
    newCells[cellIndex] = empty;
    newCells[emptyIndex] = cell;

    setCells(newCells);

    if (isValidResult(newCells)) {
      const time = Math.floor((Date.now() - startGameTimeRef.current) / 1000);
      await solvedCallback?.(time);
    }
  }

  function shuffle(rawCells, mixLoops) {
    const cells = rawCells.slice();

    for (let i = 0; i < mixLoops; i++) {
      const emptyIndex = cells.indexOf(empty);

      const nextIndexes = cells.reduce((acc, cell) => {
        const cellIndex = cells.indexOf(cell);
        if (isNextToEmpty(cells, cell)) acc.push(cellIndex);
        return acc;
      }, []);

      const randomIndex = Math.floor(Math.random() * nextIndexes.length);
      const valueIndex = nextIndexes[randomIndex];

      cells[emptyIndex] = cells[valueIndex];
      cells[valueIndex] = empty;
    }

    return cells;
  }

  function isNextToEmpty(cells, cell) {
    const cellIndex = cells.indexOf(cell);
    const emptyIndex = cells.indexOf(empty);

    const { x: cellX, y: cellY } = getCellCoordsByIndex(cellIndex);
    const { x: emptyX, y: emptyY } = getCellCoordsByIndex(emptyIndex);

    const isXNextToEmpty = Math.abs(cellX - emptyX) === 1 && cellY === emptyY;
    const isYNextToEmpty = Math.abs(cellY - emptyY) === 1 && cellX === emptyX;

    return isXNextToEmpty || isYNextToEmpty;
  }

  function getCellCoordsByIndex(cellIndex) {
    return {
      x: cellIndex % cols,
      y: (cellIndex - (cellIndex % cols)) / cols,
    };
  }

  function isValidResult(cells) {
    return values.every((_, i) => cells[i] === values[i]);
  }

  return {
    rows,
    cols,
    empty,
    cells,
    setRows,
    setCols,
    onCellClick,
  };
}
