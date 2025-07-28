const pool = require('../db/index');
const cloudinary = require('../config/cloudinary')
const streamifier = require('streamifier');
const uploadToCloudinary = require('../utils/uploadToCloudinary')

exports.getAllActiveNews =  async(req, res) =>{
    try{
        const result =  await pool.query('SELECT * FROM news WHERE active = TRUE ORDER BY date DESC');
        res.json(result.rows)
    }catch(error){
        res.status(500).json({success: false, message: 'Error al obtener las noticias activas'});
    }
}

exports.getAllNews =  async(req, res)=>{
    try{
        const result =  await pool.query('SELECT *  FROM news ORDER BY date DESC')
        res.json(result.rows)
    }catch(error){
        res.status(500).json({success: false, message:'Error al obtener las noticias'})
    }
}

exports.createNews = async(req, res)=>{
  const {title, description, date} = req.body;

  if (!title || !description || !date) {
  return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }

  try{
    let imageUrl =  req.body.image;

    if(req.file){
      try{
        const result = await uploadToCloudinary(req.file.buffer, 'news');
        imageUrl = result.secure_url;
      }catch(err){
        return res.status(500).json({success:false, message:'Error al cargar la imagen'})
      }
    }
    if(imageUrl){
    const query =  'INSERT INTO news (title, description, date, image, active, created_at, updated_at) VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())';
    const params = [title, description, date, imageUrl];
    await pool.query(query, params);
    res.json({success: true, message: 'Noticia creada correctamente'});
  }else{
    res.status(500).json({success: false, message: 'Error al cargar la imagen'})
  }
  }catch(error){
    console.error('Error al crear la noticia', error);
    res.status(500).json({success: false, message: 'Error al cargar la noticia'})
  }
}
exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, date, description } = req.body;
  let imageUrl = req.body.image;

  if (!title || !description || !date) {
  return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }

  try {
    if (req.file) {
      try{
        const result = await uploadToCloudinary(req.file.buffer, 'news');
        imageUrl = result.secure_url;
      }catch(err){
        return res.status(500).json({success:false, message:'Error al cargar la imagen'})
      }
    }

    const query = imageUrl
      ? 'UPDATE news SET title=$1, date=$2, description=$3, image=$4, updated_at=NOW() WHERE id=$5'
      : 'UPDATE news SET title=$1, date=$2, description=$3, updated_at=NOW() WHERE id=$4';

    const params = imageUrl
      ? [title, date, description, imageUrl, id]
      : [title, date, description, id];

    await pool.query(query, params);

    res.json({ success: true, message: 'Noticia actualizada' });

  } catch (error) {
    console.error('Error en updateNews:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar noticia' });
  }
};

exports.changeNewsStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== 'boolean') {
    return res.status(400).json({ success: false, message: 'El estado "active" debe ser booleano' });
  }

  try {
    await pool.query('UPDATE news SET active = $1, updated_at = NOW() WHERE id = $2', [active, id]);
    res.json({ success: true, message: `Noticia ${active ? 'activada' : 'desactivada'}` });
  } catch (error) {
    console.error('Error al cambiar estado de la noticia:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar el estado de la noticia' });
  }
};