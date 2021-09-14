const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


const ObjectId = require('mongodb').ObjectId;

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'report';


(async function () {
    const client = await MongoClient.connect(url, { useUnifiedTopology: true });
    const db = client.db(dbName);
    const scriptsCollection = db.collection('scripts');
    const usersCollection = db.collection('users');


    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: __dirname })
    });


    // POST into script collection
    app.post('/scripts', (req, res) => {
        scriptsCollection.insertOne(req.body)
            .then(result => {
                res.status(200).send('Successfuly Added')
            })
            .catch(error => console.error("Error during POST Call", error))
    })

    // GET from script collection
    app.get('/scripts', (req, res) => {
        scriptsCollection.find({}).toArray()
            .then(result => {
                // console.log(result);
                res.send(result);
            })
            .catch(error => console.error("Error during GET Call", error))
    })

    // PUT into script collection
    app.put('/scripts/:scriptId', (req, res) => {
        const {
            body: { script, quantity, date, buyingPrice, sellingPrice, totalPandL },
            params: { scriptId } } = req;

        // send id and besed on id update the entry
        scriptsCollection.updateOne(
            { "_id": ObjectId(scriptId) },
            {
                $set: {
                    "script": script, "quantity": quantity,
                    "date": date, "buyingPrice": buyingPrice,
                    "sellingPrice": sellingPrice,
                    "totalPandL": (quantity * (sellingPrice - buyingPrice))
                }
            },
            { upsert: true } // create one if doesn't exist, doesn't req in this case
        )
            .then(result => {
                console.log(result);
                res.status(200).send('One Script Updated');
            })
            .catch(error => console.error("Error during PUT Call", error))
    })

    // To DELETE One Script From Collection
    app.delete('/scripts/:scriptId', (req, res) => {
        const { params: { scriptId } } = req;

        // send id and besed on id delete the entry 
        scriptsCollection.deleteOne({ "_id": ObjectId(scriptId) })
            .then(result => {
                console.log(result);
                // res.json(`One Script Deleted`);
                res.status(200).send('One Script Deleted');
            })
            .catch(error => console.error("Error during DELETE Call", error))
    })

    // Login, Using Users Collection
    app.post('/login', (req, res) => {
        const { email, password } = req.body;
        usersCollection.findOne({ email: email })
            .then(user => {
                if (user) {
                    if (password === user.password) {
                        res.send({ message: "Login Successfull", user: user });
                    } else {
                        res.send({ message: "Password Not Matching" })
                    }
                } else {
                    res.send({ message: "User Not Registered, Please Register" })
                }
            })
            .catch(error => console.error("Error during Login", error))
    })

    // Register, Using Users Collection
    app.post('/register', (req, res) => {
        const { name, email, password } = req.body;
        usersCollection.findOne({ email: email })
            .then(user => {
                if (user) {
                    res.send({ message: "User Already Registered" });
                } else {
                    console.log("IN ELSE OF REGISTER");
                    usersCollection.insertOne({ name: name, email: email, password: password })
                        .then(result => {
                            console.log("RESULT IN ELSE OF REGISTER", result);
                            res.status(200).send({ message: 'Successfully Registered' })
                        })
                        .catch(error => console.error("Error during Registeration", error))
                }
            })
            .catch(error => console.error("Error during Registeration", error))
    })

})();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}....`));