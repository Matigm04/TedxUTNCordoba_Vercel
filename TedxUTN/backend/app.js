import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas y middleware
import registrationRoutes from './routes/registrations.js';
import { logRequest, errorHandler } from './middleware/validation.js';

// Configuración de rutas de archivos ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE DE SEGURIDAD ==========

// Helmet para seguridad de headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configurado para el frontend
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting - máximo 100 requests por hora por IP
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 100,
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en una hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting específico para inscripciones - máximo 5 inscripciones por hora por IP
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: {
        success: false,
        message: 'Has superado el límite de inscripciones por hora. Intenta nuevamente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// ========== MIDDLEWARE DE PARSING ==========

// Body parser para JSON y formularios
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para obtener IP real
app.use((req, res, next) => {
    req.realIP = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null);
    next();
});

// Logging de requests
app.use(logRequest);

// ========== SERVIR ARCHIVOS ESTÁTICOS ==========

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ========== RUTAS DE LA API ==========

// Aplicar rate limiting específico a las rutas de inscripción
app.use('/api/registrations', registrationLimiter);

// Rutas de la API
app.use('/api', registrationRoutes);

// ========== RUTAS DEL FRONTEND ==========

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Ruta para el formulario de inscripciones
app.get('/inscripciones', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'inscripciones.html'));
});

// Ruta para ediciones
app.get('/ediciones', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'ediciones.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html'));
});

// ========== MANEJO DE ERRORES ==========

// Catch-all para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Middleware de manejo de errores
app.use(errorHandler);

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log(`
🚀 Servidor TEDxUTN iniciado exitosamente!

📍 Servidor: http://localhost:${PORT}
🌐 Frontend: http://localhost:${PORT}
📝 Inscripciones: http://localhost:${PORT}/inscripciones
📊 API Health: http://localhost:${PORT}/api/health
📈 Estadísticas: http://localhost:${PORT}/api/statistics

🎯 Listo para recibir inscripciones!
    `);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada no manejada:', err);
    process.exit(1);
});

export default app;
