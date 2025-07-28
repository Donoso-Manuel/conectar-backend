const pool = require('../db/index');

exports.getAllODS =  async (req, res)=>{
    try{
        const result = await pool.query('SELECT * FROM ods ORDER BY id');
        res.json(result.rows)
    }catch(error){
        console.error('error al obtener las ODS:', error);
        res.status(500).json({error: 'Error del servidor'})
    }
}

exports.updateODS = async (req,res)=>{
    const {id} = req.params;
    const {title, color, description, details} = req.body;

    if (isNaN(parseInt(id))) {
     return res.status(400).json({ error: 'ID inválido' });
    }

    if (!title || !color || !description || !details) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try{
        const result = await pool.query(`UPDATE ods SET title = $1, color = $2, description = $3, details = $4 WHERE id = $5`, 
            [title, color, description,details, id])
        
            if(result.rowCount === 0){
                return res.status(404).json({ error: 'ODS no encontrada' });
            }
        res.status(200).json({message: 'ODS actualizada correctamente'})
    }catch(error){
        console.error('Error al acualizar la ODS:', error)
        res.status(500).json({error: 'Error del servidor'})
    }
}