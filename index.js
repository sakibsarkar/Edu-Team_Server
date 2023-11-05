require('dotenv').config()
const express = require("express")
const cors = require("cors")
const port = process.env.PORT || 5000
const cookieParser = require('cookie-parser')
const app = express()
const jwt = require("jsonwebtoken")



// mid were
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))
app.use(express.json())

app.use(cookieParser())





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.xbiw867.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });


        const assignmentCollection = client.db("AssignmentDB").collection("AssignmentCollection")


        // adding a new assignment
        app.post("/api/user/assignment/post", async (req, res) => {
            const body = req.body
            const result = await assignmentCollection.insertOne(body)
            res.send(result)
        })


        // adding cookie
        app.post("/api/user/token", async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.SECRET, { expiresIn: "1h" })
            res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' }).send({ "messege": "success" })
        })


        // removing cookie after logout
        app.post("/api/logout", async (req, res) => {

            res.clearCookie("token", { maxAge: 0 }).send({ "messege": "successfuly removed cookite" })
        })


        // all created Assignments
        app.get("/api/assignments", async (req, res) => {
            const cursor = assignmentCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })


        // app.post("api/user/create/assignment",req)


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get("/", (req, res) => {
    res.send("server is running ")
})

app.listen(port, () => {
    console.log(`port is ${port}`)
})