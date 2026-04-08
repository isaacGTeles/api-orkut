const joi = require('joi');

const postSchema = joi.object({
    titulo: joi.string().min(3).required().messages({
        "string.empty": "O campo titulo deve ser preenchido",
        "string.min": "O campo titulo deve ter no mínimo 3 caracteres",
        "any.required": "O campo titulo é obrigatório",
    }),
    conteudo: joi.string().min(3).required().messages({
        "string.empty": "O campo conteudo deve ser preenchido",
        "string.min": "O campo conteudo deve ter no mínimo 3 caracteres",
        "any.required": "O campo conteudo é obrigatório",
    }),
    
});

function validarPost(req, res, next) {
    const { error } = postSchema.validate(req.body, { abortEarly: false });
    if (error) {
        console.log(error);
        return res.status(400).json({ error: error.details.map(e => e.message) });
    }
    next();
}

module.exports = validarPost;