const pool = require('../db/index')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async(req, res) =>{
    const {email, password} = req.body;
    
    if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }
    try{
        const result = await pool.query('SELECT id, name, email, role FROM admins WHERE email = $1', [email])
        if(result.rows.length===0){
            return res.status(401).json({success: false, message: 'Credenciales invalidas'})
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!passwordMatch){
            return res.status(401).json({success: false, message: 'Credenciales invalidas'})
        }
        const token = jwt.sign(
            {id: user.id, email: user.email, role: user.role, name: user.name},
            JWT_SECRET,
            {expiresIn: '4h'}
        );

        return res.json({
            success: true,
            token,
            user:{
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    }catch(error){
        console.error('Error al intentar iniciar sesión:', error.message);
        res.status(500).json({success: false, message: 'Error en el servidor'})
    }
};