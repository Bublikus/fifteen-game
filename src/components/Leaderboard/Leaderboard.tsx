import React, { useEffect, useRef } from "react";
import {getTime} from '../../App';
import { Leader } from "../../firebase";
import "./styles.css";

interface LeaderboardProps {
  open: boolean;
  active: boolean;
  player: Leader;
  leaders: Leader[];
  onClose(): void;
}

const emptyPlayer: Omit<Leader, 'id'> = {
  player: '',
  time: '' as unknown as number,
  level: '' as unknown as string,
  date: '',
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  open,
  active,
  player,
  leaders,
  onClose,
}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const sortedLeaders = [...leaders].slice(0, 10)
  const paddedLeaders = [...Array(10 - sortedLeaders.length).fill(emptyPlayer)]
    .concat(sortedLeaders)
    .sort((a, b) => (!b.time ? -1 : a.time - b.time))

  const getPrize = (i: number) => {
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

  useEffect(() => {
    const handleEscClose = (e: KeyboardEvent) => {
      if (["Escape", "Enter", "Space"].includes(e.code)) onCloseRef.current();
    };

    if (open && active) {
      window.addEventListener("keydown", handleEscClose);
    }

    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [open, active]);

  return !open ? null : (
    <div role="button" className="leaderboard" onClick={onClose}>
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
            {paddedLeaders.map((leader, i) => (
              <tr
                key={leader.id || i}
                className={leader.id === player.id ? "strong" : ""}
              >
                <td>
                  <span>{leader.id === player.id ? "→ " : ""}</span>
                  <span>{i + 1}</span>
                  <span>
                    {getPrize(i) || <span className="invisible">🥉</span>}
                  </span>
                </td>
                <td>{leader.player.slice(0, 20).padEnd(20, ".")}</td>
                <td>{getTime(leader.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
