require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




// Firebase Admin
const admin = require("firebase-admin");
const decodedKey = Buffer.from(process.env.FB_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decodedKey);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Environment / Database
const port = process.env.PORT || 3000;
const uri = process.env.DB_URI;

// Middleware
app.use(cors());
app.use(express.json());






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
const taskCollection = db.collection("tasks");

async function run() {
    try {

        const verifyUser = async (req, res, next) => {

            const authHeader = req.headers.authorization;



            if (!authHeader) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = authHeader.split(' ')[1];


            if (!token) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            // verify the token
            try {
                const decoded = await admin.auth().verifyIdToken(token);
                req.decoded = decoded;
                next();
            }
            catch (error) {
                return res.status(403).send({ message: 'forbidden access' })
            }
        }




        app.get("/classes", verifyUser, async (req, res) => {
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
        app.post("/classes", verifyUser, async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass);
            res.send(result);
        });

        // Delete class
        app.delete("/classes/:id", verifyUser, async (req, res) => {
            const id = req.params.id;
            const result = await classCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Update class
        app.put("/classes/:id", verifyUser, async (req, res) => {
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
        app.get("/transactions", verifyUser, async (req, res) => {
            try {
                const { email } = req.query;
                const query = { email };
                if (!email) {
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
        app.post("/transactions", verifyUser, async (req, res) => {
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
        app.put("/transactions/:id", verifyUser, async (req, res) => {
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
        app.delete("/transactions/:id", verifyUser, async (req, res) => {
            try {
                const id = req.params.id;
                const result = await transactionCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });





        // ===== TASKS CRUD =====

        // Create a new task
        app.post("/tasks", verifyUser, async (req, res) => {
            try {
                const {
                    title,
                    subject,
                    topic = "",
                    priority = "medium",
                    status = "todo",
                    deadline,
                    scheduledAt,
                    durationMinutes = 60,
                    email,
                } = req.body;

                if (!email) return res.status(400).send({ message: "Email is required" });

                const task = {
                    title,
                    subject,
                    topic,
                    priority,
                    status,
                    deadline: deadline ? new Date(deadline) : null,
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                    durationMinutes,
                    email,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const result = await taskCollection.insertOne(task);
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Get all tasks (optionally filter by email)
        app.get("/tasks", verifyUser, async (req, res) => {
            try {
                const { email } = req.query;
                const query = email ? { email } : {};
                const tasks = await taskCollection.find(query).sort({ createdAt: -1 }).toArray();
                res.send(tasks);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Get single task
        app.get("/tasks/:id", verifyUser, async (req, res) => {
            try {
                const task = await taskCollection.findOne({ _id: new ObjectId(req.params.id) });
                if (!task) return res.status(404).send({ message: "Task not found" });
                res.send(task);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Update task (any field)
        app.put("/tasks/:id", verifyUser, async (req, res) => {
            try {
                const updated = { ...req.body, updatedAt: new Date() };
                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: updated }
                );
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Update only task status
        app.patch("/tasks/:id/status", verifyUser, async (req, res) => {
            try {
                const { status } = req.body;
                if (!status) return res.status(400).send({ message: "Status is required" });

                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: { status, updatedAt: new Date() } }
                );
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Delete task
        app.delete("/tasks/:id", verifyUser, async (req, res) => {
            try {
                const result = await taskCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // ===== STATS =====

        // Weekly progress by user
        // GET /stats/weekly?start=YYYY-MM-DD&email=user@example.com
        // Weekly progress by user
        // ===== STATS =====


        app.get("/stats/weekly", verifyUser, async (req, res) => {
            try {
                const { start, email } = req.query;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const startDate = start ? new Date(start) : new Date();
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 7);
                endDate.setHours(23, 59, 59, 999);

                // Aggregation: include all tasks for this user that are either:
                // 1. Have deadline in the week
                // 2. OR are inprogress/todo (even without deadline)
                const aggregation = [
                    {
                        $match: {
                            email,
                            $or: [
                                { deadline: { $gte: startDate, $lte: endDate } },
                                { status: { $in: ["inprogress", "todo", "done"] } }
                            ]
                        },
                    },
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                        },
                    },
                ];

                const result = await taskCollection.aggregate(aggregation).toArray();

                // Initialize counts
                let done = 0,
                    inProgress = 0,
                    todo = 0;

                result.forEach((r) => {
                    if (r._id === "done") done = r.count;
                    else if (r._id === "inprogress") inProgress = r.count;
                    else if (r._id === "todo") todo = r.count;
                });

                const total = done + inProgress + todo;
                const percent = total ? Math.round((done / total) * 100) : 0;

                res.send({ total, done, inProgress, todo, percent });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });








        app.get("/stats/tasks/priority", verifyUser, async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const aggregation = [
                    { $match: { email } },
                    { $group: { _id: "$priority", count: { $sum: 1 } } }
                ];

                const result = await taskCollection.aggregate(aggregation).toArray();
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // 3. Daily Completed Tasks Trend
        app.get("/stats/tasks/daily", verifyUser, async (req, res) => {
            try {
                const { email, days = 7 } = req.query;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const startDate = new Date();
                startDate.setDate(startDate.getDate() - Number(days));

                const aggregation = [
                    { $match: { email, status: "done", updatedAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ];

                const result = await taskCollection.aggregate(aggregation).toArray();
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // 4. Transaction Summary
        app.get("/stats/transactions", verifyUser, async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const aggregation = [
                    { $match: { email } },
                    { $group: { _id: "$type", total: { $sum: "$amount" } } }
                ];

                const result = await transactionCollection.aggregate(aggregation).toArray();

                let income = 0, expense = 0;
                result.forEach(r => {
                    if (r._id === "income") income = r.total;
                    if (r._id === "expense") expense = r.total;
                });

                res.send({ income, expense, balance: income - expense });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });

        // 5. Class Count by Subject
        app.get("/stats/classes", verifyUser, async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) return res.status(400).send({ message: "Email is required" });

                const aggregation = [
                    { $match: { email } },
                    { $group: { _id: "$subject", total: { $sum: 1 } } }
                ];

                const result = await classCollection.aggregate(aggregation).toArray();
                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });





        // ================== STATISTICS APIs ==================

        // Overview (total counts + income/expense sums)
        app.get("/stats/overview", verifyUser, async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) return res.status(400).send({ message: "Email required" });

                const [transactionsCount, classesCount, tasksCount] = await Promise.all([
                    transactionCollection.countDocuments({ email }),
                    classCollection.countDocuments({ email }),
                    taskCollection.countDocuments({ email }),
                ]);

                const incomeAgg = await transactionCollection.aggregate([
                    { $match: { email, type: "Income" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]).toArray();

                const expenseAgg = await transactionCollection.aggregate([
                    { $match: { email, type: "Expense" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]).toArray();

                res.send({
                    totalTransactions: transactionsCount,
                    totalClasses: classesCount,
                    totalTasks: tasksCount,
                    income: incomeAgg[0]?.total || 0,
                    expense: expenseAgg[0]?.total || 0,
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });

        // Expense breakdown by category
        app.get("/stats/expense-by-category", verifyUser, async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) return res.status(400).send({ message: "Email required" });

                const result = await transactionCollection.aggregate([
                    { $match: { email, type: "Expense" } },
                    { $group: { _id: "$category", total: { $sum: "$amount" } } },
                    { $sort: { total: -1 } },
                ]).toArray();

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Server error" });
            }
        });

     

        // Income vs Expense trend over time (optional, good for line chart)
        app.get("/stats/transactions-trend", verifyUser, async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) return res.status(400).send({ message: "Email required" });

                const result = await transactionCollection.aggregate([
                    { $match: { email } },
                    {
                        $group: {
                            _id: { month: { $substr: ["$date", 0, 7] }, type: "$type" }, // YYYY-MM
                            total: { $sum: "$amount" },
                        },
                    },
                    {
                        $group: {
                            _id: "$_id.month",
                            income: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.type", "Income"] }, "$total", 0],
                                },
                            },
                            expense: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.type", "Expense"] }, "$total", 0],
                                },
                            },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]).toArray();

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