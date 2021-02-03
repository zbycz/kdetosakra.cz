import React from 'react';
import SMap from './SMap';

export const ResultSMapWrapper = ({ guessedPoints }) => {
    return <SMap type="result" guessedPoints={guessedPoints} />;
};