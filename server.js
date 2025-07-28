const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const odsRoutes = require('./routes/ods.routes')
const authRoutes = require('./routes/authRoutes')
const newsRoutes = require('./routes/news.Routes')
const partnerRoutes = require('./routes/partner.Routes')
const projectRoutes = require('./routes/project.Routes')

app.use(cors({
    origin: "https://conectar-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
}));
app.use(express.json());

app.use('/api/ods', odsRoutes);
app.use('/api/login', authRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/projects', projectRoutes)

const PORT = process.env.PORT;

app.listen(PORT, () =>{
    console.log(`Servidor corriendo en el puerto ${PORT}`)
})