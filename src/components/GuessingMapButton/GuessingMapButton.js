import React from 'react';
import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { TOTAL_ROUNDS_MAX } from '../../constants/game';
import { setTotalRoundCounter } from '../../redux/actions/game';
import { setLastResult } from '../../redux/actions/result';

const GuessingMapButton = ({
    refreshMap,
    isBattle,
    guessSingleplayerRound,
    allGuessedPoints,
    guessBattleRound,
    round,
    totalScore,
    roundGuessed,
    disabled,
    currentRound,
    currentGame,
    nextRoundButtonVisible,
}) => {
    const dispatch = useDispatch();

    return (
        <>
            {currentRound >= TOTAL_ROUNDS_MAX && roundGuessed ? (
                <Button
                    type="primary"
                    onClick={() => {
                        dispatch(
                            setLastResult({
                                guessedPoints: allGuessedPoints,
                                totalScore,
                                mode: currentGame?.mode,
                                city: currentGame?.city,
                                radius: currentGame?.radius,
                                isBattle,
                            }),
                        );
                    }}
                >
                    <Link
                        to={{
                            pathname: '/vysledek',
                        }}
                    >
                        Vyhodnotit hru
                    </Link>
                </Button>
            ) : (
                <>
                    {!nextRoundButtonVisible ? (
                        <Button
                            disabled={disabled}
                            onClick={async () => {
                                if (isBattle) {
                                    await guessBattleRound();
                                } else {
                                    await guessSingleplayerRound();
                                }
                            }}
                            type="primary"
                        >
                            Hádej!
                        </Button>
                    ) : null}
                    {!isBattle && nextRoundButtonVisible ? (
                        <Button
                            onClick={() => {
                                refreshMap();
                                if (round < TOTAL_ROUNDS_MAX) {
                                    dispatch(setTotalRoundCounter(round + 1));
                                }
                            }}
                            type="primary"
                        >
                            Další kolo
                        </Button>
                    ) : null}
                </>
            )}
        </>
    );
};

export default GuessingMapButton;
