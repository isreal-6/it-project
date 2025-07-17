import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CharacterGrid from "../components/CharacterGrid";
import charactersData from "../data/characters";

function Store() {
  const [characters, setCharacters] = useState(charactersData);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const navigate = useNavigate();

  const handleSelect = (char) => {
    if (char.unlocked) setSelectedCharacter(char);
  };

  const handleUnlock = (id) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unlocked: true } : c))
    );
  };

  return (
    <div className="app">
        <button onClick={() => navigate(-1)}>뒤로가기</button>
        <CharacterGrid
        characters={characters}
        onSelect={handleSelect}
        onUnlock={handleUnlock}
        selectedCharacter={selectedCharacter} // ✅ 전달
      />
    </div>
  );
}

export default Store;
