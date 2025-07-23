// Middleware para validar datos de inscripción
export const validateRegistrationData = (req, res, next) => {
    const { firstName, lastName, email, dni, phone, education, utnRelation, knewTED, previousParticipation, howFoundOut } = req.body;

    // Campos obligatorios
    const requiredFields = {
        firstName: 'Nombre',
        lastName: 'Apellido', 
        email: 'Email',
        dni: 'DNI',
        phone: 'Teléfono',
        education: 'Nivel educativo',
        utnRelation: 'Relación con UTN',
        knewTED: 'Conocimiento previo de TED',
        previousParticipation: 'Participación anterior',
        howFoundOut: 'Cómo se enteró del evento'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
        if (!req.body[field]) {
            missingFields.push(label);
        }
    }

    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Faltan campos obligatorios: ${missingFields.join(', ')}`
        });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'El formato del email no es válido'
        });
    }

    // Validación de DNI
    const dniRegex = /^\d{7,8}$/;
    if (!dniRegex.test(dni)) {
        return res.status(400).json({
            success: false,
            message: 'El DNI debe tener entre 7 y 8 dígitos'
        });
    }

    // Validación de teléfono
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
            success: false,
            message: 'El formato del teléfono no es válido'
        });
    }

    // Validación específica para estudiantes UTN
    if (utnRelation === 'estudiante') {
        if (!req.body.utnCareer) {
            return res.status(400).json({
                success: false,
                message: 'Los estudiantes deben seleccionar una carrera'
            });
        }
        if (!req.body.legajo) {
            return res.status(400).json({
                success: false,
                message: 'Los estudiantes deben ingresar su legajo'
            });
        }
        if (!req.body.currentYear) {
            return res.status(400).json({
                success: false,
                message: 'Los estudiantes deben seleccionar el año que están cursando'
            });
        }
    }

    // Validación para graduados UTN
    if (utnRelation === 'graduado') {
        if (!req.body.utnCareer) {
            return res.status(400).json({
                success: false,
                message: 'Los graduados deben seleccionar su carrera'
            });
        }
    }

    // Validación para docentes
    if (utnRelation === 'docente') {
        if (!req.body.subject) {
            return res.status(400).json({
                success: false,
                message: 'Los docentes deben especificar la materia que enseñan'
            });
        }
    }

    next();
};

// Middleware para registrar requests
export const logRequest = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${ip}`);
    
    // Guardar datos para uso posterior
    req.requestLog = {
        timestamp,
        ip,
        userAgent,
        method: req.method,
        url: req.originalUrl
    };
    
    next();
};

// Middleware para manejar errores
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Error de validación de Joi o similar
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: err.details
        });
    }

    // Error de base de datos
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
            success: false,
            message: 'Conflicto de datos - posible duplicado'
        });
    }

    // Error genérico
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
};

export default {
    validateRegistrationData,
    logRequest,
    errorHandler
};
