require("dotenv").config();
const express = require("express");
const pool = require("./config/db");
const validarUsuario = require("./validacao/usuarios");
const validarPost = require("./validacao/post");
const jwt = require("jsonwebtoken");
const auth = require("./auth/authLogin");
const bcrypt = require("bcrypt");
const cors = require("cors")

const app = express();
app.use(express.json());
app.use(cors())

function formataData(data){
    return new Date(data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

app.post("/usuarios", validarUsuario, async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await pool.query(
    `INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *`,
            [nome, email, senhaHash],
        );
        res.status(201).json({
            mensagem: "Usuário criado com sucesso",
            usuario: resultado.rows[0],
        });
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao criar usuário",
        });
    }
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await pool.query(
        `SELECT * FROM usuarios WHERE email = $1`,
        [email]
    )
    if (usuario.rows.length === 0) {
        return res.status(400).json({ mensagem: "Usuário ou senha incorretos" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
        return res.status(400).json({ mensagem: "Usuário ou senha incorretos" });
    }

    const token = jwt.sign({ id: usuario.rows[0].id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });
    

    res.json({ token });
})

app.get("/", (req, res) => {
    res.send("<h1>Rede Social</h1>");
});

app.get("/usuarios", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT nome, email FROM usuarios");
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

app.get("/posts", async (req, res) => {
    try {
        // const resultado = await pool.query(`
        //     SELECT
        //     usuarios.id,
        //     usuarios.nome,
        //     post.titulo,
        //     post.conteudo,
        //     post.criado_em,
        //     post.id AS post_id
        //     FROM post
        //     JOIN usuarios
        //     ON post.usuario_id = usuarios.id
        //     ORDER BY post.criado_em DESC
        // `);
        const resultado = await pool.query(`
    SELECT
        post.id, 
        usuarios.nome,
        post.titulo,
        post.conteudo,
        post.criado_em
    FROM post
    JOIN usuarios
    ON post.usuario_id = usuarios.id
    ORDER BY post.criado_em DESC
`);

        const dados = resultado.rows.map((post) => ({
    ...post,
    criado_em: formataData(post.criado_em),
}));

        res.json(dados);

    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar postagens" });
    }
});

app.post("/posts", auth, validarPost, async (req, res) => {
    try {
        const { titulo, conteudo } = req.body;

        const resultado = await pool.query(`
            INSERT INTO post (titulo, conteudo, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [titulo, conteudo, req.usuario.id]);

        res.status(201).json({
            mensagem: "Post atualizado com sucesso",
            post: resultado.rows[0],
        });

    } catch (erro) {
        res.status(500).json({
            error: "Erro ao criar postagem",
        });
    }
});

app.put("/posts/:id", auth, validarPost, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, conteudo } = req.body;

        const post = await pool.query(`SELECT * FROM post WHERE id=$1`, [id]);

        if (post.rows.length === 0) {
            return res.status(404).json({ mensagem: "Postagem nao encontrada" });
        }

        if (post.rows[0].usuario_id !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Usuário nao autorizado" });
        }

        const resultado = await pool.query(
            `UPDATE post SET titulo = $1, conteudo = $2 WHERE id = $3 RETURNING *`,
            [titulo, conteudo, id],
        );

        res.json(resultado.rows[0]);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao atualizar postagem",
        });
    }    
});

app.delete("/posts/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const post = await pool.query(`SELECT * FROM post WHERE id=$1`, [id]);

        if (post.rows.length === 0) {
            return res.status(404).json({ mensagem: "Postagem nao encontrada" });
        }

        if (post.rows[0].usuario_id !== req.usuario.id) {
            return res.status(403).json({ mensagem: "Usuário nao autorizado" });
        }

        const resultado = await pool.query(`DELETE FROM post WHERE id = $1 RETURNING *`, [id],);
        res.json({
            mensagem: "Postagem deletada com sucesso",
            post: resultado.rows[0],
        });
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao deletar postagem",
        });
    }
});

module.exports = app;