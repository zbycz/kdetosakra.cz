import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router';

const { Content } = Layout;

const NotFound = ({ processHeaderContainerVisible }) => {
    const location = useLocation();

    useEffect(() => {
        processHeaderContainerVisible(true);
    }, []);

    return (
        <Content>
            <h1>Not found {location.pathname}</h1>
        </Content>
    );
};

export default NotFound;
