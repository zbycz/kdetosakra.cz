import React, { useState, useContext, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLocalStorage } from '@rehooks/local-storage';
import { Button } from 'antd';
import KdetosakraContext from '../../context/KdetosakraContext';
import { MAX_SCORE_PERCENT, MIN_DISTANCE_FOR_POINTS_RANDOM, TOTAL_ROUNDS_MAX } from '../../constants/game';
import { storeResult } from '../../util/result';
import { MARKER_PLACE_ICON_KDETOSAKRA, DEFAUL_MARKER_ICON } from '../../constants/icons';
import { RoundSMapWrapper } from '../SMap/RoundSMapWrapper';
import { ResultSMapWrapper } from '../SMap/ResultSMapWrapper';
import gameModes from '../../enums/modes';

const GuessingMap = ({
    makeCountScore,
    makeRefreshPanorama,
    totalRoundScore,
    totalRounds,
    guessedPoints,
    makeRoundResult,
    panoramaScene,
    makeGuessedPlace,
    panoramaLoading,
}) => {
    const mapyContext = useContext(KdetosakraContext);
    const location = useLocation();
    const [randomUserResultToken] = useLocalStorage('randomUserResultToken'); // send the key to be tracked.

    const [roundGuessed, setRoundGuessed] = useState(false);

    const refLayerValue = useRef();
    const refVectorLayerSMapValue = useRef();
    const refLayeredMapValue = useRef();

    const [guessButtonDisabled, setGuessButtonDisabled] = useState(true);
    const [nextRoundButtonVisible, setNextRoundButtonVisible] = useState(false);
    const [guessedCoordinates, setGuessedCoordinates] = useState({
        mapLon: 0,
        mapLat: 0,
    });

    /**
     * Refresh map for a new guessing!
     */
    const refreshMap = () => {
        makeRefreshPanorama();
        refLayerValue.current.removeAll();
        refVectorLayerSMapValue.current.removeAll();
        setNextRoundButtonVisible(false);
        setGuessButtonDisabled(true);
        setRoundGuessed(false);
        window.scrollTo(0, 0);
    };

    const clickMapPoint = (e, elm) => {
        // Došlo ke kliknutí, spočítáme kde
        const options = {
            url: DEFAUL_MARKER_ICON,
            anchor: { left: 10, bottom: 1 } /* Ukotvení značky za bod uprostřed dole */,
        };
        // state is not working in event handling
        // if (guessButtonDisabled && refLayerValue.current && !nextRoundButtonVisible) {
        refLayerValue.current.removeAll();
        const coords = mapyContext.SMap.Coords.fromEvent(e.data.event, refLayeredMapValue.current);
        // alert("Kliknuto na " + coords.toWGS84(2).reverse().join(" "));
        const marker = new mapyContext.SMap.Marker(
            mapyContext.SMap.Coords.fromWGS84(coords.x, coords.y),
            'Můj odhad',
            options,
        );
        refLayerValue.current.addMarker(marker);
        setGuessedCoordinates({
            mapLat: coords.y,
            mapLon: coords.x,
        });
        setGuessButtonDisabled(false);
        // }
    };

    const drawGuessedDistance = (currentPanoramaPositionPoint, selectedPointOnMap, panoramaCoordinates) => {
        const markerPanoramaOptions = {
            url: MARKER_PLACE_ICON_KDETOSAKRA,
            anchor: { left: 10, bottom: 15 },
        };

        const guessedVectorPathCoordinates = [currentPanoramaPositionPoint, selectedPointOnMap];
        const vectorPathOptions = {
            color: '#f00',
            width: 3,
        };
        const path = new mapyContext.SMap.Geometry(
            mapyContext.SMap.GEOMETRY_POLYLINE,
            null,
            guessedVectorPathCoordinates,
            vectorPathOptions,
        );
        refVectorLayerSMapValue.current.addGeometry(path);
        // panorama place marker
        const markerPanorama = new mapyContext.SMap.Marker(
            mapyContext.SMap.Coords.fromWGS84(panoramaCoordinates.lon, panoramaCoordinates.lat),
            'Panorama point',
            markerPanoramaOptions,
        );
        refLayerValue.current.addMarker(markerPanorama);
    };

    const calculateScore = distance => {
        const { radius, mode } = location.state;
        let minDistanceForPoints;
        if (mode === gameModes.random) {
            minDistanceForPoints = MIN_DISTANCE_FOR_POINTS_RANDOM;
        } else {
            minDistanceForPoints = radius + 2;
        }
        let score;
        // distance less than 20 meters
        if (distance < 0.2) {
            score = 100;
        } else {
            score = (minDistanceForPoints - distance) / (minDistanceForPoints / MAX_SCORE_PERCENT);
            if (score < 0) {
                score = 0;
            } else {
                score = score ** 2 / MAX_SCORE_PERCENT + distance / minDistanceForPoints;
                score = Math.max(0, score);
                score = Math.min(MAX_SCORE_PERCENT, score);
            }
        }
        makeRoundResult(score, distance);
    };

    const calculateDistance = () => {
        const locationObject = location.state;
        // eslint-disable-next-line no-underscore-dangle
        const panoramaCoordinates = panoramaScene._place._data.mark;
        let distance;
        if (
            panoramaCoordinates.lat === guessedCoordinates.mapLat
            && panoramaCoordinates.lon === guessedCoordinates.mapLon
        ) {
            distance = 0;
        } else {
            const radlat1 = (Math.PI * panoramaCoordinates.lat) / 180;
            const radlat2 = (Math.PI * guessedCoordinates.mapLat) / 180;
            const theta = panoramaCoordinates.lon - guessedCoordinates.mapLon;
            const radtheta = (Math.PI * theta) / 180;
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = (dist * 180) / Math.PI;
            dist = dist * 60 * 1.1515;
            dist *= 1.609344; // convert to kilometers
            distance = dist;
        }
        if (locationObject.mode === gameModes.random) {
            makeGuessedPlace();
        }
        calculateScore(distance);
        return panoramaCoordinates;
    };

    const calculateCoordsAndDrawGuess = () => {
        setGuessButtonDisabled(true);
        setNextRoundButtonVisible(true);
        setRoundGuessed(true);

        const panoramaCoordinates = calculateDistance();

        const currentPanoramaPositionPoint = mapyContext.SMap.Coords.fromWGS84(
            panoramaCoordinates.lon,
            panoramaCoordinates.lat,
        );
        const selectedPointOnMap = mapyContext.SMap.Coords.fromWGS84(
            guessedCoordinates.mapLon,
            guessedCoordinates.mapLat,
        );
        drawGuessedDistance(currentPanoramaPositionPoint, selectedPointOnMap, panoramaCoordinates);
        makeCountScore({ pointPanorama: currentPanoramaPositionPoint, pointMap: selectedPointOnMap });
    };

    return (
        <>
            {!roundGuessed ? (
                <RoundSMapWrapper
                    onMapClick={clickMapPoint}
                    refLayeredMapValue={refLayeredMapValue}
                    refLayerValue={refLayerValue}
                    refVectorLayerSMapValue={refVectorLayerSMapValue}
                />
            ) : (
                <ResultSMapWrapper guessedPoints={[guessedPoints[guessedPoints.length - 1]]} />
            )}
            {totalRounds >= TOTAL_ROUNDS_MAX ? (
                <Button
                    type="primary"
                    onClick={() => storeResult(
                            location?.state?.mode,
                            location?.state?.city?.name,
                            totalRoundScore,
                            randomUserResultToken,
                    )}
                >
                    <Link
                        to={{
                            pathname: '/vysledek',
                            state: {
                                totalRoundScore,
                                guessedPoints,
                            },
                        }}
                    >
                        Vyhodnotit hru
                    </Link>
                </Button>
            ) : (
                <>
                    {!nextRoundButtonVisible ? (
                        <Button
                            disabled={guessButtonDisabled || panoramaLoading}
                            onClick={() => {
                                calculateCoordsAndDrawGuess();
                            }}
                            type="primary"
                        >
                            Hádej!
                        </Button>
                    ) : null}
                    {nextRoundButtonVisible ? (
                        <Button onClick={() => refreshMap()} type="primary">
                            Další kolo
                        </Button>
                    ) : null}
                </>
            )}
        </>
    );
};

export default GuessingMap;
