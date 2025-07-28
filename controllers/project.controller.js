const pool =  require('../db/index');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

exports.getActiveProjects = async(req, res) =>{
    try {
        const result = await pool.query('SELECT * FROM projects WHERE is_active = true ORDER BY created_at DESC');
        res.json(result.rows);
    }catch(err){
        res.status(500).json({ success: false, message: 'Error al obtener proyectos'});
    }
}

exports.getProjectDetails = async(req, res) =>{
    try{
        const {id} = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'ID de proyecto inválido' });
        }

        const project =  await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
        if(project.rowCount === 0 ){return res.status(404).json({message:'Projecto no encontrado'})}
        const observation = await pool.query('SELECT * FROM project_observations WHERE project_id = $1', [id]);
        const gallery =  await pool.query('SELECT * FROM project_gallery WHERE project_id = $1',[id]);

        res.json({
            project: project.rows[0],
            observation: observation.rows[0] || null,
            gallery: gallery.rows
        });
    }catch(err){
        res.status(500).json({success: false, message: 'Error al obtener el Proyecto'})
    }
};

exports.getAllProjects =  async(req, res) =>{
    try{
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    }catch(err){
        res.status(500).json({success: false, message: 'Error al obtener los proyectos'});
    }
};

exports.createProject = async(req, res) =>{

    try{
        const {title, description, registration_start, registration_end} = req.body;
        let imageUrl = null;

        if (!title || !description || !registration_start || !registration_end || !req.file) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }
        const start = new Date(registration_start);
        const end = new Date(registration_end);
        
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Fechas inválidas' });
        }
        if (start > end) {
            return res.status(400).json({ message: 'La fecha de inicio no puede ser posterior a la de fin' });
        }
        if(req.file){
            const result = await uploadToCloudinary(req.file.buffer,'projects');
            imageUrl = result.secure_url;
        }
        const query = 'INSERT INTO projects (title, description, image, registration_start, registration_end) VALUES($1, $2, $3, $4, $5) RETURNING *';
        const result = await pool.query(query,[title,description,imageUrl,registration_start,registration_end]);
        res.status(201).json({success: true, project: result.rows[0]})
    }catch(err){
        console.error(err)
        res.status(500).json({success: false, message:'Error al crear el proyecto'})
    }
};

exports.updateProject = async(req, res)=>{
    try{
        const {id} = req.params;
        const {title, description, registration_start, registration_end} = req.body;
        let imageUrl = null;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'ID de proyecto inválido' });
        }
        if (!title || !description || !registration_start || !registration_end) {
            return res.status(400).json({ message: 'No se pueden dejar campos en blanco' });
        }
        const start = new Date(registration_start);
        const end = new Date(registration_end);
        
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Fechas inválidas' });
        }
        if (start > end) {
            return res.status(400).json({ message: 'La fecha de inicio no puede ser posterior a la de fin' });
        }

        if(req.file){
            const result = await uploadToCloudinary(req.file.buffer,'projects');
            imageUrl = result.secure_url;
        }
        const query = imageUrl
        ? 'UPDATE projects SET title = $1, description = $2, image = $3, registration_start = $4, registration_end = $5, updated_at = NOW() WHERE id = $6 RETURNING *'
        : 'UPDATE projects SET title = $1, description = $2, registration_start = $3, registration_end = $4, updated_at = NOW() WHERE id = $5 RETURNING *' 

        const params = imageUrl
        ? [title, description, imageUrl, registration_start, registration_end, id]
        : [title, description, registration_start, registration_end, id];

        const result = await pool.query(query, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        res.json({success: true, project: result.rows[0] });
    }catch(err){
        res.status(500).json({success:false, message:'No se pudo actualizar el proyecto'});
    }
};

exports.toggleProjectStatus = async(req, res)=>{
    try{
        const {id} = req.params;
        const query = 'UPDATE projects SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING is_active';
        const result = await pool.query(query,[id]);
        res.json({success: true, newStatus: result.rows[0].is_active})
    }catch(err){
        res.status(500).json({success: false, message:'No se pudo actualizar el estado del proyecto'})
    }
};

exports.closeRegistration = async(req, res)=>{
    try{
        const {id} = req.params;
        const today = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        await pool.query('UPDATE projects SET registration_end = $1, updated_at = NOW() WHERE id = $2',[today,id]);
        res.json({success:true, message:'Inscripcion cerrada'})
    }catch(err){
        res.status(500).json({success:false, message:'Error al cerrar las inscripciones del proyecto '})
    }
};

exports.deleteProject = async(req, res) =>{
    try{
        const {id} = req.params;
        await pool.query('DELETE FROM projects WHERE id = $1',[id]);
        res.json({success: true, message:'Proyecto eliminado'});
    }catch(err){
        res.status(500).json({success:false, message:'Error al eliminar el proyecto'});
    }
};

exports.addObservation = async(req, res) =>{
    try{
        const {id} = req.params;
        const {observation} = req.body;
        const createdBy = req.user?.email || 'admin';

        if(!observation){
            return res.status(400).json({success: false, message:'La observacion no puede estar vacia'});
        }

        const insert = `INSERT INTO project_observations (project_id, observation, created_by) VALUES($1, $2, $3)
                        ON CONFLICT (project_id) DO UPDATE SET observation = EXCLUDED.observation, created_by = EXCLUDED.created_by`;
        await pool.query(insert,[id, observation, createdBy]);
        res.json({success: true, message:'Observacion Ingresada o Actualizada'});
        }catch(err){
            res.status(500).json({success:false, message:'Error al guardar o actualizar la observacion'});
        }
};

exports.addGalleryImages = async(req, res)=>{
    try{
        const {id} = req.params;

        if(!req.files || req.files.length === 0){
            console.log(req.files)
            console.log(' no hay imagenes')
            return res.status(400).json({message:'No se recibieron imagenes'});
        }

        const countResult = await pool.query('SELECT COUNT(*) FROM project_gallery WHERE project_id = $1',[id]);
        const currentCount = parseInt(countResult.rows[0].count, 10);
        const incomingCount = req.files.length;

        if (currentCount + incomingCount > 20) {
            return res.status(400).json({success: false, message: `Este proyecto ya tiene ${currentCount} imágenes. No puedes subir ${incomingCount} más. El máximo es 20.`,});
        }

        const urls = [];
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.buffer,'project_gallery');
            urls.push(result.secure_url);
        }
        const insert = urls.map(url => pool.query('INSERT INTO project_gallery (project_id, image_url) VALUES($1, $2)',[id, url]));

        await Promise.all(insert);

        res.json({success: true, message:'Imagenes cargadas'});
    }catch(err){
        res.status(500).json({success:false, message:'Error al subir las imagenes'})
    }
};

exports.getGalleryImages = async(req, res)=>{
    try{
        const {id} = req.params;
        const result =  await pool.query('SELECT * FROM p´roject_gallery WHERE project_id = $1', [id]);
        res.json(result.rows);
    }catch(err){
        res.status(500).json({success:false, message:'Error al obtener la galeria de imagenes'})
    }
};

exports.deleteProjectImage = async (req, res) => {
  const { projectId, imageId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM project_gallery WHERE id = $1 AND project_id = $2 RETURNING *',
      [imageId, projectId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada o no pertenece al proyecto' });
    }

    res.json({ success: true, message: 'Imagen eliminada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al eliminar la imagen' });
  }
};

