import React, { useEffect, useRef, useState } from 'react';
import {
    Button, Spin, Progress, Tooltip, Input
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { addRoundBatchToBattleRounds, updateBattle, updateBattlePlayer } from '../../services/firebase';
import {
    generatePlaceInRadius,
    generateRandomRadius,
    getRandomCzechPlace,
    getUnixTimestamp,
    sortPlayersByHighestScore,
} from '../../util';
import useGetRandomUserToken from '../../hooks/useGetRandomUserToken';
import { TOTAL_ROUNDS_MAX } from '../../constants/game';
import gameModes from '../../enums/modes';
import { setLastResult } from '../../redux/actions/result';
import { setMyUserInfoNicknameToCurrentBattle } from '../../redux/actions/battle';

export const generateRounds = async currentBattleInfo => {
    const generatedRounds = [];
    const {
        mode, battleId, radius, selectedCity,
    } = currentBattleInfo;

    for (let i = 0; i < TOTAL_ROUNDS_MAX; i++) {
        switch (mode) {
            case gameModes.random: {
                const roundCity = getRandomCzechPlace();
                const roundRadius = generateRandomRadius();
                const panoramaPlace = generatePlaceInRadius(roundRadius, roundCity);
                generatedRounds.push({
                    roundId: i + 1,
                    panoramaPlace,
                    isGuessed: false,
                    guessedTime: 0,
                    city: roundCity,
                });
                break;
            }
            case gameModes.city: {
                const panoramaPlace = generatePlaceInRadius(radius, selectedCity);
                generatedRounds.push({
                    roundId: i + 1,
                    panoramaPlace,
                    isGuessed: false,
                    guessedTime: 0,
                    city: selectedCity,
                });
                break;
            }
            case gameModes.custom: {
                const panoramaPlace = generatePlaceInRadius(radius, selectedCity);
                generatedRounds.push({
                    roundId: i + 1,
                    panoramaPlace,
                    isGuessed: false,
                    guessedTime: 0,
                    city: selectedCity,
                });
                break;
            }
            default:
        }
    }

    if (generatedRounds.length) {
        return addRoundBatchToBattleRounds(battleId, generatedRounds);
    }

    return null;
};

const BattlePlayersList = ({ myPlayer, battleCanBeStarted }) => {
    const dispatch = useDispatch();
    const randomUserToken = useGetRandomUserToken();
    const { battleId } = useParams();
    const inputEl = useRef(null);
    const currentBattlePlayers = useSelector(state => state.battle.currentBattle.players);
    const currentBattleInfo = useSelector(state => state.battle.currentBattle);

    const [generatedName, setGeneratedName] = useState();

    const isBattleCreator = currentBattleInfo.createdById !== null && currentBattleInfo.createdById === randomUserToken;

    const gameCreatorStartButtonDisabled = !battleCanBeStarted || !currentBattleInfo.myNickname || currentBattleInfo.myNickname.length < 2;

    useEffect(() => {
        if (inputEl.current !== null) {
            setGeneratedName(currentBattleInfo.myNickname);
            inputEl.current.focus();
        }
    }, [inputEl.current]);

    const startNextBattleRound = async (updatedBattleId, nextRoundNumber) => {
        return updateBattle(updatedBattleId, {
            currentRoundStart: getUnixTimestamp(new Date()),
            round: nextRoundNumber,
        })
            .then(docRef => {})
            .catch(err => {
                console.error(('startNextBattleRound: ', err));
            });
    };

    const getOngoingPlayersOrder = round => {
        const players = currentBattlePlayers ?? [];
        const playersRoundResults = players.map(player => {
            const currentPlayerRound = player[`round${round}`];
            return {
                name: player.name,
                score: currentPlayerRound?.score ? Math.round(currentPlayerRound.score) : 0,
            };
        });
        const playersRoundResultsSorted = sortPlayersByHighestScore(playersRoundResults);
        return playersRoundResultsSorted.map((player, i) => {
            return (
                <>
                    <div key={`ongoing-battle-players-detail-${i}`} className="battle-players-detail-result">
                        <div className="battle-players-detail-player-result">
                            <div
                                className={`battle-players-detail-player-result--name ${
                                    myPlayer?.userId === player.userId ? 'highlighted' : ''
                                }`}
                            >
                                {player.name}
                            </div>
                        </div>
                        <div className="battle-players-detail--status">
                            <Progress percent={player.score} />
                        </div>
                    </div>
                </>
            );
        });
    };

    const getGuessingBattlePlayers = round => {
        const players = currentBattlePlayers ?? [];
        return players.map((player, i) => {
            const { name, userId } = player;
            const currentPlayerRound = player[`round${round}`];
            return (
                <>
                    <div key={`guessing-battle-players-detail-${i}`} className="battle-players-detail">
                        <div
                            className={`battle-players-detail--name ${
                                myPlayer?.userId === userId ? 'highlighted' : ''
                            }`}
                        >
                            {name}
                        </div>
                        <div className="battle-players-detail--status">
                            {typeof currentPlayerRound?.score !== 'undefined' ? (
                                <Tooltip title="Hráč umístil tip">
                                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                                </Tooltip>
                            ) : (
                                <Tooltip title="Hráč hádá místo">
                                    <Spin size="small" />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </>
            );
        });
    };

    const getManagedRoundButton = round => {
        if (round >= TOTAL_ROUNDS_MAX) {
            return (
                <Button
                    type="primary"
                    onClick={() => {
                        dispatch(
                            setLastResult({
                                players: currentBattleInfo.players,
                                round: currentBattleInfo.round,
                                rounds: currentBattleInfo.rounds,
                                totalScore: currentBattleInfo.myTotalScore,
                                mode: currentBattleInfo.mode,
                                city: currentBattleInfo.selectedCity,
                                radius: currentBattleInfo.radius,
                                isBattle: true,
                            }),
                        );
                    }}
                >
                    <Link
                        to={{
                            pathname: '/vysledek',
                        }}
                    >
                        Zobrazit výsledky hry
                    </Link>
                </Button>
            );
        }

        if (isBattleCreator) {
            return (
                <>
                    <Button
                        type="primary"
                        onClick={async () => {
                            if (generatedName !== currentBattleInfo.myNickname) {
                                await updateBattlePlayer(battleId, randomUserToken, {
                                    name: currentBattleInfo.myNickname,
                                })
                                    .then(docRef => {})
                                    .catch(err => {
                                        console.error('Battle creator starts a new round: ', err);
                                    });
                            }
                            await startNextBattleRound(battleId, round + 1);
                        }}
                    >
                        Spustit
                        {' '}
                        {currentBattleInfo.round + 1}
                        . kolo
                    </Button>
                    <p style={{ marginTop: '10px' }}>Odstartuj další kolo.</p>
                </>
            );
        }

        return null;
    };

    const getPlayersInActiveGame = () => {
        const { round, rounds } = currentBattleInfo;
        const currentRound = rounds[round - 1];
        const { isGuessed, isRoundActive } = currentRound;

        if (isGuessed && !isRoundActive) {
            return (
                <>
                    <h3>Pořadí kola</h3>
                    <div className="battle-players">{battleId && getOngoingPlayersOrder(round)}</div>
                    {getManagedRoundButton(round)}
                </>
            );
        }

        return (
            <>
                <h3>Hráči hádají</h3>
                <div className="battle-players">{battleId && getGuessingBattlePlayers(round)}</div>
            </>
        );
    };

    const getPlayersBeforeGameStarted = () => {
        const players = currentBattlePlayers ?? [];
        return players.map((player, i) => {
            const { name, isReady, userId } = player;
            return (
                <>
                    <div key={`waiting-battle-players-detail-${i}`} className="battle-players-detail">
                        {myPlayer?.userId === userId ? (
                            <>
                                <Input
                                    bordered={false}
                                    size="small"
                                    maxLength={20}
                                    defaultValue={name}
                                    disabled={isBattleCreator ? false : isReady}
                                    ref={inputEl}
                                    onChange={e => {
                                        dispatch(setMyUserInfoNicknameToCurrentBattle(e.target.value));
                                    }}
                                />
                            </>
                        ) : (
                            <div className="battle-players-detail--name">{name}</div>
                        )}
                        {currentBattleInfo.createdById === userId ? (
                            <div className="battle-players-detail--status">
                                {currentBattleInfo.isGameStarted ? (
                                    <Tooltip title="Hráč připraven ke hře">
                                        <CheckCircleTwoTone twoToneColor="#52c41a" />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Hráč se připravuje">
                                        <Spin size="small" />
                                    </Tooltip>
                                )}
                            </div>
                        ) : (
                            <div className="battle-players-detail--status">
                                {isReady ? (
                                    <Tooltip title="Hráč připraven ke hře">
                                        <CheckCircleTwoTone twoToneColor="#52c41a" />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Hráč se připravuje">
                                        <Spin size="small" />
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                </>
            );
        });
    };

    return (
        <>
            {' '}
            {currentBattleInfo.isGameStarted && currentBattleInfo.rounds.length ? (
                <>{getPlayersInActiveGame()}</>
            ) : (
                <>
                    <h3>Hráči</h3>
                    <div className="battle-players">{battleId && getPlayersBeforeGameStarted()}</div>
                    {isBattleCreator ? (
                        <Button
                            disabled={gameCreatorStartButtonDisabled}
                            type="primary"
                            onClick={async () => {
                                // if the user is a battle creator, he will generate rounds here
                                await updateBattlePlayer(battleId, randomUserToken, {
                                    name: currentBattleInfo.myNickname,
                                })
                                    .then(docRef => {
                                        // if the user is a battle creator, he will generate rounds here
                                        return generateRounds(currentBattleInfo);
                                    })
                                    .then(generatedRounds => {
                                        return updateBattle(battleId, {
                                            currentRoundStart: getUnixTimestamp(new Date()),
                                            isGameStarted: true,
                                            round: 1,
                                        });
                                    })
                                    .then(battle => {})
                                    .catch(err => {
                                        console.error('Battle creator started game error: ', err);
                                    });
                            }}
                        >
                            Začít hru
                        </Button>
                    ) : (
                        <Button
                            disabled={
                                myPlayer?.isReady
                                || !currentBattleInfo.myNickname
                                || currentBattleInfo.myNickname.length < 2
                            }
                            type="primary"
                            onClick={async () => {
                                await updateBattlePlayer(battleId, randomUserToken, {
                                    name: currentBattleInfo.myNickname,
                                    isReady: true,
                                })
                                    .then(docRef => {})
                                    .catch(err => {
                                        console.error('Player is prepared error: ', err);
                                    });
                            }}
                        >
                            Připraven
                        </Button>
                    )}
                    <p style={{ marginTop: '10px' }}>
                        {isBattleCreator ? (
                            <>
                                {gameCreatorStartButtonDisabled
                                    ? 'Hru můžeš začít, až budou všichni ostatní hráči připraveni.'
                                    : ''}
                            </>
                        ) : (
                            <>
                                Hra začíná, až všichni hráči zvolí možnost
                                {' '}
                                <b>Připraven</b>
                                .
                            </>
                        )}
                    </p>
                </>
            )}
        </>
    );
};

export default BattlePlayersList;
