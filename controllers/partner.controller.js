const pool = require('../db/index');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const parseOds = (ods) => (typeof ods === 'string' ? JSON.parse(ods) : ods)

exports.getActivePartners = async (_, res) => {
  try{
    const { rows } = await pool.query(
    'SELECT * FROM partners WHERE is_active = TRUE ORDER BY id'
  );
  res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener partners activos' });
  }
};

exports.getAllPartners = async (_, res) => {
  try{
      const { rows } = await pool.query('SELECT * FROM partners ORDER BY id');
      res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener partners' });
  }
};

exports.getOdsColors = async (_, res) => {

  try{  
    const { rows } = await pool.query('SELECT ods_number, color_hex FROM odscolor ORDER BY ods_number');
    res.json(rows);
  }catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener los colores de ODS' });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const { name, website, ods } = req.body;
    const odsArray = parseOds(ods || '[]');

    if (!name || !website) {
      return res.status(400).json({ success: false, message: 'Nombre y sitio web son obligatorios' });
    }
    if (!Array.isArray(odsArray)) {
      return res.status(400).json({ success: false, message: 'ODS inválido' });
    }

    let logoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'partners');
      logoUrl = result.secure_url;
    }

    await pool.query(
      'INSERT INTO partners (name, website, logo, ods, is_active) VALUES ($1,$2,$3,$4,TRUE)',
      [name, website, logoUrl, odsArray]
    );

    res.json({ success: true, message: 'Partner creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al crear partner' });
  }
};

exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, ods } = req.body;
    const odsArray = parseOds(ods || '[]');

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    if (!name || !website) {
      return res.status(400).json({ success: false, message: 'Nombre y sitio web son obligatorios' });
    }

    if (!Array.isArray(odsArray)) {
      return res.status(400).json({ success: false, message: 'ODS inválido' });
    }

    let logoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'partners');
      logoUrl = result.secure_url;
    }

    if (logoUrl) {
      const {rows} = await pool.query(`UPDATE partners SET name=$1, website=$2, ods=$3, logo=$4, updated_at=NOW() WHERE id=$5`,
        [name, website, odsArray, logoUrl, id]);
    } else {
      const {rows} = await pool.query(`UPDATE partners SET name=$1, website=$2, ods=$3, updated_at=NOW() WHERE id=$4`,
        [name, website, odsArray, id]);
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner no encontrado' });
    }

    res.json({ success: true, message: 'Partner actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al actualizar partner' });
  }
};

exports.togglePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const {rows} = await pool.query(
'UPDATE partners SET is_active = NOT is_active, updated_at = NOW() WHERE id=$1 RETURNING id, is_active',[id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner no encontrado' });
    }
  res.json({ success: true, message: 'Estado actualizado', partner: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al cambiar estado' });
  }
};