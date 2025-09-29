console.log('Prisma Client version:', require('@prisma/client/package.json').version);
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { readdirSync } = require('fs')
const path = require('path')
const app = express()
require('./controllers/cronjob')

//app.use(express.json())
app.use(express.json({ limit: '60mb' }))
app.use(express.urlencoded({ limit: '60mb', extended: true }))

app.use(cors())
//app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))
//app.use(express.json({ limit: '20mb' }))
//app.use(express.urlencoded({ limit: '20mb', extended: true }))
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
