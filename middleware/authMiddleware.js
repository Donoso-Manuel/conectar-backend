const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) =>{
    const authHeader =  req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({success: false, message: 'No existe token'})
    }
    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).json({success: false, message: 'token Invalido o expirado'})
    }
}

exports.requireRole = (...allowedRoles) =>{
    return (req, res, next) =>{
        if(!req.user || !allowedRoles.includes(req.user.role)){
            return res.status(401).json({success: false, message: 'Acceso denegado: Rol no autorizado'})
        }
        next();
    }
}