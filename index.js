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
const transactionCollection = db.collection("transactions");


async function run() {
    try {
        app.get("/classes", async (req, res) => {
            try {
                const { email } = req.query;

                if (email) {
                    const query = { email: email };
                    const result = await classCollection.find(query).toArray();

                    if (result.length > 0) {
                        res.send(result);
                    } else {
                        res.send({ message: "No class found for this email" });
                    }
                } else {

                    res.send({ message: "No classes found" });

                }
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
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






        // server.js (add to your existing Express app)

        // Transactions collection


        // Get all transactions
        app.get("/transactions", async (req, res) => {
            try {
                const { email } = req.query;
                const query = { email };
                if(!email){
                    res.send({ message: "No transactions found" });
                    return;
                }
                const transactions = await transactionCollection.find(query).toArray();
                res.send(transactions);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Add new transaction
        app.post("/transactions", async (req, res) => {
            try {
                const newTransaction = req.body; // { email, type, amount, category, date, notes }
                const result = await transactionCollection.insertOne(newTransaction);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Update transaction
        app.put("/transactions/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updated = req.body;
                const result = await transactionCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updated }
                );
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Delete transaction
        app.delete("/transactions/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await transactionCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
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