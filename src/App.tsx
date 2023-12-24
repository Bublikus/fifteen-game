import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react";
import FlipMove from "react-flip-move";
import Select from "react-select";
import {
  getLeaderboard,
  addPayerToLeaderboard,
  trackGameWin,
  trackSignGame,
  Leader,
} from "./firebase";
import { useFifteenGame } from "./useFifteenGame";
import { GameContainer } from "./components/GameContainer";
import { Instructions } from "./components/Instructions";
import { PlayerModal } from "./components/PlayerModal";
import { Leaderboard } from "./components/Leaderboard";
import { useBlockGestures } from "./hooks/useBlockGestures";
import { useRemoveSelection } from "./hooks/useRemoveSelection";
import "./style.css";

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

const ANIM_DURATION = 200;
const MIX_DURATION = 1000;

const isTouch = "touchstart" in window || !!navigator.maxTouchPoints;

const options = Object.keys(levels).map((lev) => ({
  value: lev,
  // @ts-ignore
  label: `${lev} — ${levels[lev].cols}x${levels[lev].rows}`,
}));

export const getTime = (time: number) =>
  `${String(Math.floor(time / 60) || "").padStart(2, "_")}:${String(
    time % 60 || ""
  ).padStart(2, Math.floor(time / 60) ? "0" : "_")}`;

const defaultPlayer: Leader = {
  id: "",
  player: `player_${Math.floor(new Date().getTime() / 1000)}`,
  time: 0,
  level: Object.keys(levels)[0],
  date: new Date().toLocaleString(),
};

export default function App() {
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const isOverlay = useRef(false);

  // @ts-ignore
  const [level, setLevel] = useState(levels[Object.keys(levels)[0]]);
  const [duration, setDuration] = useState(MIX_DURATION);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [player, setPlayer] = useState<Leader>(defaultPlayer);
  const [isEnd, setIsEnd] = useState(false);
  const [time, setTime] = useState(0);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);
  const [isShownInstructions, setIsShownInstructions] = useState(isTouch);

  isOverlay.current = isShownLeaderboard || isShownInstructions;

  const onSuccess = useCallback(
    async (time: number) => {
      setIsEnd(true);
      trackGameWin(time, level);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setIsShownLeaderboard(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (time) setShowPlayerModal(true);
    },
    [level]
  );

  const {
    rows,
    cols,
    empty,
    cells,
    setRows,
    setCols,
    onCellClick,
    restart,
    startTime,
  } = useFifteenGame(onSuccess, { rows: level.rows, cols: level.cols });

  const onChangeLevel = (levOption: any) => {
    const lev = levOption.value;
    // @ts-ignore
    setCols(levels[lev].cols);
    // @ts-ignore
    setRows(levels[lev].rows);
    setLevel(lev);
  };

  const handleRestart = () => {
    setIsEnd(false);
    setTime(0);
    setIsShownLeaderboard(false);
    setIsShownInstructions(false);
    setPlayer(defaultPlayer);
    restart();
  };

  const onPlayerModalClose = async (playerName: string) => {
    setShowPlayerModal(false);

    const oneHour = 60 * 60 * 1000;
    if (time && !Number.isNaN(+time) && time < oneHour) {
      const playerId = await addPayerToLeaderboard(playerName, time, level);
      if (playerId) setPlayer((prev) => ({ ...prev, id: playerId }));
      trackSignGame(playerName, time, level);
      await getLeaderboard(level).then(setLeaders);
    }
  };

  useEffect(() => {
    if (isEnd && startTime) {
      clearInterval(timerRef.current);
    } else if (startTime) {
      timerRef.current = setInterval(() => {
        const time = Math.floor((Date.now() - startTime) / 1000);
        setTime(time);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isEnd]);

  useEffect(() => {
    setTimeout(() => setDuration(ANIM_DURATION), MIX_DURATION);
  }, []);

  useEffect(() => {
    setTime(0);
    getLeaderboard(level).then(setLeaders);
  }, [level]);

  useRemoveSelection(!isOverlay.current);
  useBlockGestures();

  return (
    <GameContainer>
      <Instructions open={isShownInstructions} onClose={handleRestart} />

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
        <h3>
          Time: <span>⏱️{getTime(time)}</span>
        </h3>
      </header>

      <section style={{ "--rows": rows, "--cols": cols } as CSSProperties}>
        <FlipMove typeName={null} duration={duration} easing="ease-out">
          {cells.map((cell) => (
            <div
              key={cell}
              role="button"
              className="tile"
              onClick={onCellClick.bind(null, cell)}
            >
              {cell === empty ? "" : cell}
            </div>
          ))}
        </FlipMove>
      </section>

      <footer>
        <strong className="help">
          <p>Sort all numbers:</p>
          <div>
            <div>1 2 3</div>
            <div>4 5 6</div>
            <div>7 8</div>
          </div>
        </strong>
      </footer>

      <Leaderboard
        open={isShownLeaderboard}
        active={!isShownInstructions && !showPlayerModal}
        player={player}
        leaders={leaders}
        onClose={handleRestart}
      />

      <PlayerModal
        open={showPlayerModal}
        score={time}
        defaultName={defaultPlayer.player}
        onClose={onPlayerModalClose}
      />
    </GameContainer>
  );
}
