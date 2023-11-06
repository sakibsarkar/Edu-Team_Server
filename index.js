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


const varifyToekn = (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        res.status(401).send({ messege: "unAuthorized Access" })
        return
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ messege: "Access Forbidden" })
        }
        req.user = decoded
        next()
    })

}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const submissionColltection = client.db("AssignmentDB").collection("submissionColltection")


        // adding a new assignment
        app.post("/api/user/assignment/post", varifyToekn, async (req, res) => {
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
        // app.get("/api/assignments", async (req, res) => {
        //     const cursor = assignmentCollection.find()
        //     const result = await cursor.toArray()
        //     res.send(result)

        // })

        // // difficulty assignment data based data
        // app.get("/api/assignments/:difficulty", async (req, res) => {
        //     const difficultyLevel = req.params.difficulty
        //     const find = { difficulty: difficultyLevel }
        //     const result = await assignmentCollection.find(find).toArray()
        //     const total = await assignmentCollection.countDocuments(find)
        //     res.send({ result, total })
        // })




        app.get("/api/assignments", async (req, res) => {
            const difficultyLevel = req.query.level
            const limit = parseInt(req.query.limit)
            const page = parseInt(req.query.page)


            // conditions
            let findQuery = {}
            const skip = page * limit


            if (difficultyLevel) {
                findQuery = { difficulty: difficultyLevel }
                const result = await assignmentCollection.find(findQuery).skip(skip).limit(limit).toArray()
                const total = (await assignmentCollection.find(findQuery).toArray()).length

                res.send({ result, total })
                return
            }

            const result = await assignmentCollection.find(findQuery).skip(skip).limit(limit).toArray()
            const total = await assignmentCollection.countDocuments()
            res.send({ result, total })




        })


        // Assignmnet id based assignments
        app.get("/api/assignment/:id", varifyToekn, async (req, res) => {
            const id = req.params.id
            const find = { _id: new ObjectId(id) }
            const result = await assignmentCollection.find(find).toArray()
            res.send(result)
        })


        // user email based created assignments
        app.get("/api/myAssignments/:email", varifyToekn, async (req, res) => {
            const email = req.params.email
            const userIdentity = req.user
            if (email !== userIdentity.email) {
                res.status(403).send({ messege: "unAuthoaized Access" })
                return
            }

            const filter = { uploadedBy: email }
            const result = await assignmentCollection.find(filter).toArray()
            res.send(result)

        })


        // user all submitted assignment
        app.get("/api/mySubmission/:email", varifyToekn, async (req, res) => {
            const user = req.params.email
            const userIdentity = req.user.email
            if (user !== userIdentity) {
                res.status(403).send({ messege: "unAuthoaized Access" })
                return
            }
            const find = { submitedBy: user }

            const result = await submissionColltection.find(find).toArray()
            res.send(result)
        })


        // individual assignment submission
        app.post("/api/assignment/submit", async (req, res) => {
            const body = req.body
            const result = await submissionColltection.insertOne(body)
            res.send(result)
        })




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