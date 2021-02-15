import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { differenceInSeconds } from 'date-fns';
import { useLocation } from 'react-router-dom';
import useGetRandomUserToken from '../../hooks/useGetRandomUserToken';
import { findUserFromBattleByRandomTokenId, getDateFromUnixTimestamp } from '../../util';
import useTimeInterval from '../../hooks/useTimeInterval';
import { setIsRoundActive } from '../../redux/actions/battle';
import { TOTAL_ROUNDS_MAX } from '../../constants/game';

const getAlertMessageFastestPlayer = (round, countdownTime) => (
    <>
        {countdownTime > 0 && (
            <>
                Byl jsi nejrychlejší! Do konce kola zbývá
                <b>
                    {' '}
                    {countdownTime}
                </b>
                {' '}
                sekund.
            </>
        )}
    </>
);

const getAlertMessageOtherPlayers = (round, name, countdownTime) => (
    <>
        {countdownTime > 0 && (
            <>
                <b>{name}</b>
                {' '}
                byl nejrychlejší. Na tvůj tip ti zbývá
                <b>
                    {' '}
                    {countdownTime}
                </b>
                {' '}
                sekund.
            </>
        )}
    </>
);

const BattleCountDown = ({ currentBattleInfo }) => {
    const dispatch = useDispatch();
    const randomUserToken = useGetRandomUserToken();
    const currentBattleRoundId = useSelector(state => state.battle.currentBattle.round);
    const currentBattlePlayers = useSelector(state => state.battle.currentBattle.players);
    const [countdownTime, setCountdownTime] = useState(-1);
    const [countdownIsRunning, setCountdownIsRunning] = useState(false);
    const [currentRound, setCurrentRound] = useState();
    const { pathname } = useLocation();

    const {
        isGameStarted, countdown, round, rounds, createdById,
    } = currentBattleInfo;

    const handleBattleRoundTick = () => {
        setCountdownTime(prevTime => prevTime - 1);
    };

    const { startInterval, stopInterval } = useTimeInterval(handleBattleRoundTick);

    useEffect(() => {
        if (round && rounds.length) {
            setCurrentRound(rounds[round - 1]);
        }
    }, [round, rounds]);

    // stop countdown when it finishes or all players make a guess
    useEffect(() => {
        const playersWithFinishedRoundGuess = currentBattlePlayers.filter(player => player[`round${round}`]);
        if (
            countdownIsRunning
            && (countdownTime < 1 || playersWithFinishedRoundGuess.length === currentBattlePlayers.length)
        ) {
            dispatch(
                setIsRoundActive({
                    roundId: currentBattleRoundId,
                    active: false,
                }),
            );
            stopInterval();
            setCountdownIsRunning(false);
        }
    }, [countdownIsRunning, countdownTime, currentBattlePlayers, round, currentBattleRoundId, stopInterval, dispatch]);

    // clean countdown after a pathname is changed
    useEffect(() => {
        return () => {
            stopInterval();
            setCountdownTime(0);
            setCountdownIsRunning(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const startCountdown = guessedTime => {
        const guessedTimeDate = getDateFromUnixTimestamp(guessedTime);
        setCountdownTime(countdown - differenceInSeconds(new Date(), guessedTimeDate));
        startInterval();
        setCountdownIsRunning(true);
    };

    const battleInfo = useMemo(() => {
        if (currentRound) {
            const {
                isGuessed, guessedTime, firstGuess, isRoundActive,
            } = currentRound;
            const battleUserCreator = findUserFromBattleByRandomTokenId(currentBattlePlayers, createdById);
            if (isGuessed && !isRoundActive) {
                if (round >= TOTAL_ROUNDS_MAX) {
                    return <Alert message={<b>Hra skončila.</b>} type="info" />;
                }

                return (
                    <Alert
                        message={(
                            <b>
                                Konec kola.
                                {' '}
                                {battleUserCreator.name}
                                {' '}
                                odstartuje
                                {' '}
                                {round + 1}
                                . kolo
                            </b>
                        )}
                        type="info"
                    />
                );
            }

            if (isGuessed && !countdownIsRunning) {
                startCountdown(guessedTime);
            }

            if (firstGuess) {
                const { name, guessedById } = firstGuess;
                return (
                    <Alert
                        message={
                            guessedById === randomUserToken
                                ? getAlertMessageFastestPlayer(round, countdownTime)
                                : getAlertMessageOtherPlayers(round, name, countdownTime)
                        }
                        type="info"
                    />
                );
            }
        }

        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRound, countdownTime, countdownIsRunning, createdById, currentBattlePlayers, randomUserToken, round]);

    if (!isGameStarted) {
        return (
            <Alert
                message={(
                    <>
                        Po nejrychlejším tipu daného kola začne odpočet
                        {' '}
                        <b>
                            {countdown}
                            {' '}
                            sekund
                        </b>
                        .
                    </>
                )}
            />
        );
    }

    return <div className="battle-info">{battleInfo}</div>;
};

export default BattleCountDown;
