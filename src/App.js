import React, { useState, useEffect, useRef, useCallback } from "react";
import FlipMove from "react-flip-move";
import Select from "react-select";
import {
  getLeaderboard,
  addPayerToLeaderboard,
  trackGameWin,
  trackSignGame,
} from "./firebase";
import { useFifteenGame } from "./useFifteenGame";
import bgImg from "./bg.jpg";
import swipeImg from "./swipe-all-directions.png";
import tapImg from "./tap.png";
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

const ANIM_DURATION = 100;
const MIX_DURATION = 1000;

const isTouch = "touchstart" in window || !!navigator.maxTouchPoints;

const options = Object.keys(levels).map((lev) => ({
  value: lev,
  label: `${lev} — ${levels[lev].cols}x${levels[lev].rows}`,
}));

export const getTime = (time) =>
  `${String(Math.floor(time / 60) || "").padStart(2, "_")}:${String(
    time % 60 || ""
  ).padStart(2, Math.floor(time / 60) ? "0" : "_")}`;

export default function App() {
  const timerRef = useRef(0);

  const [level, setLevel] = useState(levels[Object.keys(levels)[0]]);
  const [duration, setDuration] = useState(MIX_DURATION);
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [ownId, setOwnId] = useState("");
  const [isEnd, setIsEnd] = useState(false);
  const [time, setTime] = useState(0);
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);
  const [isShownInstructions, setIsShownInstructions] = useState(isTouch);

  const defaultName = useRef(localStorage.getItem("playerName"));

  const sortedLeaders = leaders.sort((a, b) => a.time - b.time).slice(0, 10);

  const onSuccess = useCallback(
    (time) =>
      new Promise(async (resolve) => {
        setIsEnd(true);
        trackGameWin(time, level);

        await new Promise((resolve) => setTimeout(resolve, 200));

        setIsShownLeaderboard(true);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const promptPlayer = () => {
          let playerName;

          while (true) {
            const player = prompt(
              `Time: ⏱️${getTime(time)}\n👤Enter your name: `,
              defaultName.current ?? undefined
            );

            playerName = player?.trim().slice(0, 50);

            if (playerName !== null && playerName !== "") break;
          }

          return playerName;
        };

        const oneHour = 60 * 60 * 1000;
        if (time && !Number.isNaN(+time) && time < oneHour) {
          const playerName = promptPlayer();

          if (playerName) {
            const playerId = await addPayerToLeaderboard(
              playerName,
              time,
              level
            );

            localStorage.setItem("playerName", playerName);
            defaultName.current = playerName;

            if (playerId) setOwnId(playerId);

            trackSignGame(playerName, time, level);

            await getLeaderboard(level).then(setLeaders);
          }
        }

        resolve();
      }),
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

  const onChangeLevel = (levOption) => {
    const lev = levOption.value;
    setCols(levels[lev].cols);
    setRows(levels[lev].rows);
    setLevel(lev);
  };

  const handleRestart = () => {
    setIsEnd(false);
    setTime(0);
    setIsShownLeaderboard(false);
    setIsShownInstructions(false);
    setOwnId("");
    restart();
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

  useEffect(() => {
    const checkSelectionInterval = setInterval(
      () => window.getSelection()?.removeAllRanges?.(),
      20
    );

    const blockGestures = (e) => {
      e.preventDefault();
      document.body.style.zoom = 1;
    };

    document.addEventListener("gesturestart", blockGestures);
    document.addEventListener("gesturechange", blockGestures);
    document.addEventListener("gestureend", blockGestures);

    return () => {
      document.removeEventListener("gesturestart", blockGestures);
      document.removeEventListener("gesturechange", blockGestures);
      document.removeEventListener("gestureend", blockGestures);

      clearInterval(checkSelectionInterval);
    };
  }, []);

  const getPrize = (i) => {
    if (i === 0) {
      return "🥇";
    } else if (i === 1) {
      return "🥈";
    } else if (i === 2) {
      return "🥉";
    } else {
      return "";
    }
  };

  return (
    <>
      {loading && <p className="loading">loading...</p>}
      <main className={loading ? "loading" : ""}>
        <img
          className="bg"
          src={bgImg}
          alt="bg"
          onLoad={() => setLoading(false)}
        />

        {isShownInstructions && (
          <div role="button" className="instruction" onClick={handleRestart}>
            <h2>How to play</h2>

            <div className="instruction__images">
              <div className="instruction__image">
                <span className="instruction__image-title">
                  Swipe{"\n"}to{"\n"}move
                </span>
                <img src={swipeImg} alt="swipe" />
              </div>
              <div className="instruction__or">Or</div>
              <div className="instruction__image">
                <span className="instruction__image-title">
                  Tap{"\n"}on{"\n"}tails
                </span>
                <img src={tapImg} alt="tap" />
              </div>
            </div>

            <h2>Tap to start</h2>
          </div>
        )}

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

        <section style={{ "--rows": rows, "--cols": cols }}>
          <FlipMove typeName={null} duration={duration} easing="ease-out">
            {cells.map((cell) => (
              <button key={cell} onClick={onCellClick.bind(null, cell)}>
                {cell === empty ? "" : cell}
              </button>
            ))}
          </FlipMove>
        </section>

        {isShownLeaderboard && (
          <div role="button" className="leaderboard" onClick={handleRestart}>
            <div className="leaderboard-box">
              <h3>Leaderboard</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaders.map((leader, i) => (
                    <tr
                      key={leader.id}
                      className={leader.id === ownId ? "strong" : ""}
                    >
                      <td>
                        {leader.id === ownId ? "→ " : ""}
                        {i + 1}
                        <span>
                          {getPrize(i) || <span className="invisible">🥉</span>}
                        </span>
                      </td>
                      <td>{leader.player.slice(0, 20).padEnd(20, ".")}</td>
                      <td>⏱️{getTime(leader.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
      </main>
    </>
  );
}
