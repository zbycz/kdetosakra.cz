import { isBefore } from 'date-fns';
import { crCities } from '../data/cr';
import randomNicknames from '../constants/nicknames';
import gameModes from '../enums/modes';
import { TOTAL_ROUNDS_MAX } from '../constants/game';

const EARTH_RADIUS = 6371000; /* meters  */
const DEG_TO_RAD = Math.PI / 180.0;
const THREE_PI = Math.PI * 3;
const TWO_PI = Math.PI * 2;

const isFloat = n => {
    return !isNaN(parseFloat(n)) && isFinite(n);
};

const recursiveConvert = (input, callback) => {
    if (input instanceof Array) {
        return input.map(el => recursiveConvert(el, callback));
    }
    if (input instanceof Object) {
        input = JSON.parse(JSON.stringify(input));
        for (const key in input) {
            if (input?.[key]) {
                input[key] = recursiveConvert(input[key], callback);
            }
        }
        return input;
    }
    if (isFloat(input)) {
        return callback(input);
    }

    return null;
};

const toRadians = input => {
    return recursiveConvert(input, val => val * DEG_TO_RAD);
};

const toDegrees = input => {
    return recursiveConvert(input, val => val / DEG_TO_RAD);
};

/*
coords is an object: {latitude: y, longitude: x}
toRadians() and toDegrees() convert all values of the object
*/
const pointAtDistance = (inputCoords, distance) => {
    const result = {};
    const coords = toRadians(inputCoords);
    const sinLat = Math.sin(coords.latitude);
    const cosLat = Math.cos(coords.latitude);

    /* go fixed distance in random direction*/
    const bearing = Math.random() * TWO_PI;
    const theta = distance / EARTH_RADIUS;
    const sinBearing = Math.sin(bearing);
    const cosBearing = Math.cos(bearing);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    result.latitude = Math.asin(sinLat * cosTheta + cosLat * sinTheta * cosBearing);
    result.longitude = coords.longitude + Math.atan2(sinBearing * sinTheta * cosLat, cosTheta - sinLat * Math.sin(result.latitude));
    /* normalize -PI -> +PI radians */
    result.longitude = ((result.longitude + THREE_PI) % TWO_PI) - Math.PI;

    return toDegrees(result);
};

export const roundToTwoDecimal = value => {
    return Math.round(value * 100) / 100;
};

export const pointInCircle = (coord, distance) => {
    const rnd = Math.random();
    // use square root of random number to avoid high density at the center
    const randomDist = Math.sqrt(rnd) * distance;
    return pointAtDistance(coord, randomDist);
};

export const decryptEmail = encoded => {
    const address = atob(encoded);
    return `mailto:${address}`;
};

export const generateRandomRadius = () => {
    const RANDOM_RADIUS_ARRAY = [0.05, 0.1, 0.3, 0.5, 1.0];
    return RANDOM_RADIUS_ARRAY[Math.floor(Math.random() * (0, RANDOM_RADIUS_ARRAY.length - 1))];
};

export const getRandomCzechPlace = () => {
    let randomCity = crCities[Math.floor(Math.random() * crCities.length)];
    randomCity = {
        ...randomCity,
        coordinates: {
            latitude: randomCity.latitude,
            longitude: randomCity.longitude,
        },
    };
    return randomCity;
};

/**
 * https://www.kirupa.com/html5/picking_random_item_from_array.htm
 * @returns {string}
 */
export const getRandomNickname = () => {
    return randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
};

export const generatePlaceInRadius = (radius, locationCity) => {
    radius *= 1000; // to meters
    const generatedPlace = pointInCircle(
        {
            longitude: locationCity.coordinates.longitude,
            latitude: locationCity.coordinates.latitude,
        },
        radius,
    );
    return generatedPlace;
};

export const sortBattleRoundsById = roundsArray => {
    return roundsArray.sort((a, b) => {
        if (a.roundId < b.roundId) {
            return -1;
        }
        if (a.roundId > b.roundId) {
            return 1;
        }
        return 0;
    });
};

export const sortPlayersByHighestScore = playersArray => {
    return playersArray.sort((a, b) => {
        if (a.score > b.score) {
            return -1;
        }
        if (a.score < b.score) {
            return 1;
        }
        return 0;
    });
};

export const findLastGuessedRound = roundsArray => {
    const sortedRounds = sortBattleRoundsById(roundsArray);
    for (let i = 0; i < sortedRounds.length; i++) {
        const { isGuessed, roundId } = sortedRounds[i];
        if (isGuessed) {
            return roundId;
        }
    }
    return 1;
};

export const findUserFromBattleByRandomTokenId = (battlePlayers, randomUserToken) => {
    for (let i = 0; i < battlePlayers.length; i++) {
        if (battlePlayers[i].userId === randomUserToken) {
            return battlePlayers[i];
        }
    }
    return null;
};

export const RADIUS_DESCRIPTION = 'Poloměr kružnice, ve které se náhodně vygeneruje panorama (středem je dle zvoleného módu buď centrum obce nebo vaše poloha).';

export const mapGameModeName = mode => {
    switch (mode) {
        case gameModes.random:
            return 'náhodné místo';
        case gameModes.custom:
            return 'vlastní místo';
        case gameModes.geolocation:
            return 'moje poloha';
        case gameModes.city:
            return 'krajské město';
        default:
    }
    return '';
};

export const getUnixTimestamp = date => {
    // eslint-disable-next-line no-bitwise
    return (date.getTime() / 1000) | 0;
};

export const getDateFromUnixTimestamp = unixTimestamp => {
    return new Date(unixTimestamp * 1000);
};

export const countTotalPlayerScoreFromRounds = firebaseUser => {
    let total = 0;
    for (let i = 0; i < TOTAL_ROUNDS_MAX; i++) {
        total += firebaseUser && firebaseUser[`round${i + 1}`] ? firebaseUser[`round${i + 1}`].score : 0;
    }
    return Math.round(total);
};

export const getIsRoundActive = (guessedTime, countdown) => {
    if (guessedTime && countdown) {
        const roundExpirationTime = guessedTime + countdown;
        return isBefore(new Date(), getDateFromUnixTimestamp(roundExpirationTime));
    }
    return true;
};
