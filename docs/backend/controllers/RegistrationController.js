import Registration from '../models/Registration.js';

export class RegistrationController {
    
    // Crear nueva inscripción
    static async createRegistration(req, res) {
        try {
            const formData = req.body;
            
            // Validaciones básicas
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.dni) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios'
                });
            }

            // Verificar duplicados
            const duplicate = await Registration.checkDuplicate(formData.email, formData.dni);
            if (duplicate.duplicate) {
                let message = 'Ya existe una inscripción con ';
                if (duplicate.emailExists) message += 'este email';
                if (duplicate.emailExists && duplicate.dniExists) message += ' y ';
                if (duplicate.dniExists) message += 'este DNI';
                
                return res.status(409).json({
                    success: false,
                    message
                });
            }

            // Calcular edad si se proporciona fecha de nacimiento
            if (formData.birthDate) {
                formData.age = Registration.calculateAge(formData.birthDate);
            }

            // Obtener IP y User Agent
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            // Crear instancia de Registration
            const registration = new Registration(formData);
            
            // Guardar en la base de datos
            const result = await registration.save(ipAddress, userAgent);

            res.status(201).json({
                success: true,
                message: '¡Inscripción realizada exitosamente!',
                data: {
                    id: result.id,
                    nombre: registration.nombre,
                    apellido: registration.apellido,
                    email: registration.email
                }
            });

        } catch (error) {
            console.error('Error en createRegistration:', error);
            
            if (error.message.includes('Ya existe una inscripción')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor. Por favor, intenta nuevamente.'
            });
        }
    }

    // Obtener todas las inscripciones (para administradores)
    static async getAllRegistrations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const registrations = await Registration.findAll(limit, offset);

            res.json({
                success: true,
                data: registrations,
                pagination: {
                    page,
                    limit,
                    total: registrations.length
                }
            });

        } catch (error) {
            console.error('Error en getAllRegistrations:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener inscripciones'
            });
        }
    }

    // Obtener estadísticas
    static async getStatistics(req, res) {
        try {
            const stats = await Registration.getStatistics();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }

    // Obtener inscripción por ID
    static async getRegistrationById(req, res) {
        try {
            const { id } = req.params;
            const registration = await Registration.findById(id);

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Inscripción no encontrada'
                });
            }

            res.json({
                success: true,
                data: registration
            });

        } catch (error) {
            console.error('Error en getRegistrationById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener inscripción'
            });
        }
    }

    // Verificar si un email ya está registrado
    static async checkEmail(req, res) {
        try {
            const { email } = req.params;
            const registration = await Registration.findByEmail(email);

            res.json({
                success: true,
                exists: !!registration
            });

        } catch (error) {
            console.error('Error en checkEmail:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar email'
            });
        }
    }

    // Verificar si un DNI ya está registrado
    static async checkDNI(req, res) {
        try {
            const { dni } = req.params;
            const registration = await Registration.findByDNI(dni);

            res.json({
                success: true,
                exists: !!registration
            });

        } catch (error) {
            console.error('Error en checkDNI:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar DNI'
            });
        }
    }

    // Endpoint de salud para verificar que la API funciona
    static async healthCheck(req, res) {
        res.json({
            success: true,
            message: 'API TEDxUTN funcionando correctamente',
            timestamp: new Date().toISOString()
        });
    }
}

export default RegistrationController;
