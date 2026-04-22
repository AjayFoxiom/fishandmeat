const app = require('./app')
const axios = require('axios')

const PORT = process.env.PORT || 3001
const HOST = '0.0.0.0' // Allows connections from any network device

app.listen(PORT, HOST, () => {
    console.log(`server running at port ${PORT}`)

    // Self-ping every 5 minutes to prevent Render free-tier from sleeping
    setInterval(() => {
        axios.get('https://fishandmeat.onrender.com/api/health')
            .then(() => console.log('Keep-alive ping successful'))
            .catch((err) => console.error('Keep-alive ping failed:', err.message))
    }, 300000) // Testing: 1 min — change back to 300000 (5 min) for production
})


