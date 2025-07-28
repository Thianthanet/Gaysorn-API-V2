require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { readdirSync } = require('fs')
const path = require('path')
const app = express()
require('./controllers/cronjob')

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
readdirSync('./routes').map((item) => app.use('/api', require('./routes/' + item)))

const PORT = process.env.PORT || 5005

app.get('/', (req, res) => {
    try {
        res.json({ message: "API Create by Thianthanet" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
})

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`)
})