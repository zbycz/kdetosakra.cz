import React from 'react';
import { Layout } from 'antd';
import { Redirect, useLocation } from 'react-router-dom';
import Game from '../Game';
import useGameMenuResize from '../../hooks/useGameMenuResize';

const { Content } = Layout;

export const CustomPlace = () => {
    const location = useLocation();
    useGameMenuResize();

    if (location?.state?.city) {
        return (
            <Content>
                <Game location={location} />
            </Content>
        );
    }
    return (
        <Redirect
            to={{
                pathname: '/',
            }}
        />
    );
};