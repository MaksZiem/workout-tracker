const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth-routes')
const HttpError = require('./models/http-error')

const port = 8000;

const app = express();

const MONGODB_URI =
'mongodb+srv://maximilian:Johen2001@cluster0.pyphlw1.mongodb.net/plant-tracker?retryWrites=true&w=majority'


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT')
  next()
})


app.get('/', (req, res) => {
  res.send('Hello World!');
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.use('/auth', authRoutes)

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404)
  throw error;
})


mongoose
.connect(MONGODB_URI)
.then(()=> {
      app.listen(port);
})
.catch(err => {
    console.log(err)
}) 
