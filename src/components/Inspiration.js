import React, { useState, useEffect } from 'react';
import inspirationCards from '../data/cards/CardIndex'; // 이미지 배열 가져오기
import './Inspiration.css'; // 스타일링을 위한 CSS 파일

function Inspiration () {
    const [showPopup, setShowPopup] = useState(false);
    const [randomCard, setRandomCard] = useState(null);

    const handleCardClick = () => {
        // 이미지 배열에서 무작위 인덱스 선택
        const randomIndex = Math.floor(Math.random() * inspirationCards.length);
        setRandomCard(inspirationCards[randomIndex]);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
        setRandomCard(null);
    };

    return (
        <>
            <div className="inspiration-container" onClick={handleCardClick}>
                <h3>영감카드</h3>
                <p>클릭해서 오늘의 영감을 얻어보세요!</p>
            </div>

            {showPopup && randomCard && (
                <div className="modal-overlay" onClick={closePopup}>
                    <div className="modal inspiration-popup" onClick={(e) => e.stopPropagation()}>
                        <img src={randomCard} alt="Inspiration Card" />
                        <button onClick={closePopup}>닫기</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Inspiration;