import express from 'express';

const server = express();

server.all('/', (req, res) => {
    try {
        res.status(200).send('Your bot is alive!');
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

function keepAlive() {
    return new Promise<void>((resolve, reject) => {
        server.listen(3000, () => {
            console.log("Server is Ready!");
            resolve();
        }).on('error', (error) => {
            console.error('Error starting server:', error);
            reject(error);
        });
    });
}

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default keepAlive;