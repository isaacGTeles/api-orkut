const joi = require('joi');

const usuarioSchema = joi.object({
    nome: joi.string().min(3).required().messages({
        "string.empty": "O campo nome deve ser preenchido",
        "string.min": "O campo nome deve ter no mínimo 3 caracteres",
        "any.required": "O campo nome é obrigatório",
    }),
    email: joi.string().email().required().messages({
        "string.empty": "O campo email deve ser preenchido",
        "string.email": "O campo email deve ser um email válido",
        "any.required": "O campo email é obrigatório",
    }),
    senha: joi.string().min(6).required().messages({
        "string.base": "O campo senha deve ser uma string",
        "string.empty": "O campo senha deve ser preenchido",
        "string.min": "O campo senha deve ter no mínimo 6 caracteres",
        "any.required": "O campo senha é obrigatório",
    }),  
    
});

function validarUsuario(req, res, next) {
    const { error } = usuarioSchema.validate(req.body, { abortEarly: false });
    if (error) {
        console.log(error);
        return res.status(400).json({ error: error.details.map( e => e.message) });
    }
    next();
}

module.exports = validarUsuario;