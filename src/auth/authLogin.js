const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ mensagem: "sem token"})
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.usuario = decoded;
        console.log(req.usuario)
        next();
    } catch (erro) {
        return res.status(401).json({ mensagem: "token inválido"})
    }
}

module.exports = auth