import { signToken, verifyAuth } from './_auth.js';
import { getOne, execute } from './db.js';
import bcrypt from 'bcryptjs';

const ENV_ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ENV_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'shine2026!';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const { method, query } = req;
  const action = query.action || 'login';

  if (method === 'POST' && action === 'login') {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
      }

      let isAuthenticated = false;
      let userData = { username, name: 'Administrador SHINE' };

      // 1. Validar contra variables de entorno seguras (producción Vercel)
      if (username.trim() === ENV_ADMIN_USER && password === ENV_ADMIN_PASS) {
        isAuthenticated = true;
      } else {
        // 2. Validar contra tabla admin_users en base de datos
        try {
          const dbUser = await getOne('SELECT * FROM admin_users WHERE username = ?', [username.trim()]);
          if (dbUser) {
            const match = await bcrypt.compare(password, dbUser.password_hash);
            if (match) {
              isAuthenticated = true;
              userData = { username: dbUser.username, name: dbUser.name || 'Administrador SHINE' };
              await execute('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [dbUser.id]);
            }
          }
        } catch (dbErr) {
          console.warn('Fallback a validación de variables de entorno:', dbErr.message);
        }
      }

      if (!isAuthenticated) {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' });
      }

      const token = signToken({
        uid: 1,
        username: userData.username,
        name: userData.name
      });

      return res.status(200).json({
        success: true,
        token,
        user: userData
      });
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(500).json({ success: false, error: 'Error interno en autenticación' });
    }
  }

  if (method === 'GET' && action === 'check') {
    const admin = verifyAuth(req);
    if (!admin) {
      return res.status(401).json({ success: false, valid: false, error: 'Sesión no válida o expirada' });
    }
    return res.status(200).json({ success: true, valid: true, user: admin });
  }

  return res.status(405).json({ success: false, error: `Método ${method} no permitido` });
}

