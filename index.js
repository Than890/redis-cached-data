const axios = require('axios');
const redis = require('redis');
const express = require('express');
const app = express();

const port = 3000;

// make a connection to the local instance of redis
let client;

(async () => {
    client = redis.createClient();

    client.on("error", (error) => console.error(`Error : ${error}`));

    await client.connect();
})();

app.get('/withoutredis/:routes', async (req, res) => {
    try {
        const routes = req.params.routes;
        const data = await axios.get(`http://localhost:5000/${routes}`);
        return res.status(200).send({
            error: false,
            data: data.data
        });

    } catch (error) {
        console.log(error)
    }
});

app.get('/withredis/:routes', getUsers);

async function getUsers( req, res) {
    const routes = req.params.routes;
    try {
        const results = await client.get(routes);
        if (results) {
            return res.status(200).send({
                error: false,
                cachedMemory: true,
                data: JSON.parse(results)
            })
        } else {
            const data = await axios.get(`http://localhost:5000/${routes}`);
            console.log(data)
            client.set(routes, JSON.stringify(data.data));
            return res.status(200).send({
                error: false,
                cachedMemory: false,
                data: data.data
            });
        }
    } catch (error) {
        console.error(error);
        res.status(404).send("Data unavailable");
    }
}
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


module.exports = app;