import React, { useEffect } from 'react';
import { Card } from 'antd';
import cryptoRandomString from 'crypto-random-string';
import { writeStorage, useLocalStorage } from '@rehooks/local-storage';
import Custom from '../modes/Custom';
import RegionCity from '../modes/RegionCity';
import RandomCity from '../modes/RandomCity';
import Geolocation from '../modes/Geolocation';
import pragueCover from '../../assets/images/city/prague.jpg';
import randomCover from '../../assets/images/city/random.jpg';
import suggestedCover from '../../assets/images/city/suggested.jpg';
import geolocationCover from '../../assets/images/city/geolocation.jpg';

const Configuration = function() {
    const [randomUserResultToken] = useLocalStorage('randomUserResultToken'); // send the key to be tracked.

    useEffect(() => {
        if (!randomUserResultToken) {
            writeStorage('randomUserResultToken', cryptoRandomString({ length: 15 }));
        }
    }, [randomUserResultToken]);

    return (
        <>
            <Card cover={<img alt="Herní mód - Krajská města ČR" src={pragueCover} />}>
                <h1>Krajská města ČR</h1>
                <p>
                    Bydlíš v některém z krajských sídel a znáš ho jako své boty? No tak se ukaž. Nebo se prostě jen tak
                    projdi po místech, která zase až tak dobře neznáš. Třeba objevíš zákoutí, kam tě to potáhne i
                    naživo.
                </p>
                <RegionCity />
            </Card>
            <Card cover={<img alt="Herní mód - Náhodné místo v Česku" src={randomCover} />}>
                <h1>Náhodné místo v Česku</h1>
                <p>
                    Známá města a místa pro tebe nejsou dostatečnou výzvou? Přenes se tedy do některé z
                    {' '}
                    <a href="https://github.com/33bcdd/souradnice-mest">6259 obcí ČR</a>
                    {' '}
                    a jejího bezprostředního okolí.
                    V každém kole na tebe čeká úplně jiné náhodné místo v naší republice. Tahle výzva je (nejen) pro
                    experty, co mají ČR projetou křížem krážem.
                </p>
                <RandomCity />
            </Card>
            <Card cover={<img alt="Herní mód - Podle mojí geolokace" src={geolocationCover} />}>
                <h1>Podle mojí geolokace</h1>
                <p>Zaměř svou polohu a ukaž, kdo je tady pánem a znalcem svého bezprostředního okolí!</p>
                <Geolocation />
            </Card>
            <Card cover={<img alt="Herní mód - Zadat vlastní místo" src={suggestedCover} />}>
                <h1>Zadat vlastní místo</h1>
                <p>
                    Chceš si zahrát a nebydlíš přitom v krajském městě? Nevadí, přesně tohle je výzva pro tebe. Svou
                    obec či jiné zajímavé místo, které chceš více poznat, vyhledej ve formuláři níže. Šťastnou cestu!
                </p>
                <Custom />
            </Card>
        </>
    );
};

export default Configuration;
