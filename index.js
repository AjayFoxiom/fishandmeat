const app=require('./app')


const PORT = 3001 || process.env.PORT
const HOST = "0.0.0.0"; // Allows connections from any network device

app.listen(PORT, HOST, () => {
    console.log(`server running at port ${PORT}`);
})


