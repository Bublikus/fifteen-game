import React, { useState, useEffect, useRef } from "react";
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

const options = Object.keys(levels).map((lev) => ({
  value: lev,
  label: `${lev} — ${levels[lev].cols}x${levels[lev].rows}`,
}));

export const getTime = (time) =>
  `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
    time % 60
  ).padStart(2, "0")}`;

export default function App() {
  const [level, setLevel] = useState(levels[Object.keys(levels)[0]]);
  const [duration, setDuration] = useState(MIX_DURATION);
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [ownId, setOwnId] = useState("");
  const [isShownLeaderboard, setIsShownLeaderboard] = useState(false);

  const defaultName = useRef(localStorage.getItem("playerName"));

  const sortedLeaders = leaders.sort((a, b) => a.time - b.time).slice(0, 10);

  const onSuccess = (time) =>
    new Promise(async (resolve) => {
      console.info(time, getTime(time));
      trackGameWin(time, level);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsShownLeaderboard(true);

      const promptPlayer = () => {
        let playerName;

        while (true) {
          const player = prompt(
            `Time: ${getTime(time)}\n\nEnter your name: `,
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
          const playerId = await addPayerToLeaderboard(playerName, time, level);

          localStorage.setItem("playerName", playerName);
          defaultName.current = playerName;

          if (playerId) setOwnId(playerId);

          trackSignGame(playerName, time, level);

          await getLeaderboard(level).then(setLeaders);
        }
      }

      resolve();
    });

  const { rows, cols, empty, cells, setRows, setCols, onCellClick, restart } =
    useFifteenGame(onSuccess, { rows: level.rows, cols: level.cols });

  const onChangeLevel = (levOption) => {
    const lev = levOption.value;
    setCols(levels[lev].cols);
    setRows(levels[lev].rows);
    setLevel(lev);
  };

  useEffect(() => {
    setTimeout(() => setDuration(ANIM_DURATION), MIX_DURATION);
  }, []);

  const handleRestart = () => {
    setIsShownLeaderboard(false);
    setOwnId("");
    restart();
  };

  useEffect(() => {
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
                      </td>
                      <td>{leader.player.slice(0, 20).padEnd(20, ".")}</td>
                      <td>{getTime(leader.time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
