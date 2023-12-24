import React, { useEffect, useRef, useState } from "react";
import Modal from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import {getTime} from '../../App';
import "./styles.css";

interface PlayerModalProps {
  open: boolean;
  score: number;
  defaultName?: string;
  onClose(name: string): void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  open,
  score,
  defaultName: defaultPlayerName = `player_${Math.floor(
    new Date().getTime() / 1000
  )}`,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultStorageName = useRef(localStorage.getItem("playerName") || "");
  const defaultName = useRef(defaultStorageName.current || defaultPlayerName);
  const prevScoreRef = useRef(score);

  prevScoreRef.current = prevScoreRef.current || score;

  const [name, setName] = useState("");

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();

    if (name && !name.trim()) {
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    const playerName = name.trim().slice(0, 50) || defaultName.current;
    localStorage.setItem("playerName", playerName);

    defaultName.current = playerName;
    defaultStorageName.current = playerName;
    setName("");

    onClose(playerName);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={() => onClose(defaultName.current)}
      center
      blockScroll
      closeOnEsc
      showCloseIcon={false}
      focusTrapped
      closeOnOverlayClick
    >
      <form onSubmit={handleSubmit} className="player-modal__form">
        <div className="player-modal__form-section">
          <h2 className="player-modal__score-title">Time</h2>
          <h3 className="player-modal__score">
            {getTime(score || prevScoreRef.current)}
          </h3>
        </div>

        <div className="player-modal__form-section">
          <h2 className="player-modal__name-title">Enter your name</h2>
          <input
            ref={inputRef}
            type="text"
            id="firstName"
            name="firstName"
            autoFocus
            placeholder={defaultName.current}
            autoComplete="firstName"
            value={name}
            className="player-modal__input"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <footer className="player-modal__footer">
          <button type="submit" className="player-modal__footer-button">
            Save
          </button>
        </footer>
      </form>
    </Modal>
  );
};
