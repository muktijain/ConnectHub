import React from 'react';
import withAuth from '../utils/withAuth';

function Home() {
    return (
        <div>
            <h1>Welcome to ConnectHub</h1>
        </div>
    );
}

export default withAuth(Home);