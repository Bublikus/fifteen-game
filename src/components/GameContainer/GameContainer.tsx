import React, { useState } from "react";
// @ts-ignore
import bgImg from "./bg.jpg";

export const GameContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);

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

        {children}
      </main>
    </>
  );
};
