require('dotenv').config()
const app = require('../backend/server')
const mongo = require('../backend/config/db')
const {PORT} = require('../backend/server')
const authRoutes = require('../backend/routes/auth.routes')

async function bootstrap() {
    await mongo. connect ()
    app-get('/', (reg, res) => res. status (200) -json({ message: "Hello World!" }))
    app-get ('/healthz', (req, res) => res.status (200) - send())
    app-use('/auth', authRoutes)
    app.listen(PORT, () => {
        console.log(`✅ Server is listening on port: ${PORT}`)
    })


}




bootstrap()