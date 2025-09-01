const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 3000
const uri = process.env.URI;


app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("student_tooltip");
const classCollection = db.collection("classes");


async function run() {
    try {
        app.get("/classes", async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        });

        // Add new class
        app.post("/classes", async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        });

        // Delete class
        app.delete("/classes/:id", async (req, res) => {
            const id = req.params.id;
            const result = await classCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Update class
        app.put("/classes/:id", async (req, res) => {
            const id = req.params.id;
            const updated = req.body;
            const result = await classCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updated }
            );
            res.send(result);
        });
    } finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Students are focusin on their studies');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});