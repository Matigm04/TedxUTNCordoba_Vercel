import { runQuery, getQuery, allQuery } from '../config/database.js';

export class Registration {
    constructor(data) {
        this.nombre = data.firstName;
        this.apellido = data.lastName;
        this.dni = data.dni;
        this.edad = data.age;
        this.email = data.email;
        this.telefono = data.phone;
        this.genero = data.gender;
        this.ocupacion = data.occupation;
        this.empresa = data.company;
        this.nivel_educativo = data.education;
        this.es_comunidad_utn = data.utnRelation;
        this.carrera = data.utnCareer;
        this.legajo = data.legajo;
        this.anio_cursando = Array.isArray(data.currentYear) ? data.currentYear.join(',') : data.currentYear;
        this.materia_docente = data.subject;
        this.areas_interes = Array.isArray(data.interests) ? JSON.stringify(data.interests) : data.interests;
        this.alergias_alimentarias = data.allergies;
        this.conocia_ted = data.knewTED;
        this.participo_anteriormente = data.previousParticipation;
        this.como_se_entero = data.howFoundOut;
        this.por_que_participar = data.whyParticipate;
        this.acepta_newsletter = data.newsletter ? 1 : 0;
    }

    // Calcular edad a partir de fecha de nacimiento
    static calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // Guardar nueva inscripción
    async save(ipAddress = null, userAgent = null) {
        const sql = `
            INSERT INTO registrations (
                nombre, apellido, dni, edad, email, telefono, genero,
                ocupacion, empresa, nivel_educativo, es_comunidad_utn,
                carrera, legajo, anio_cursando, materia_docente,
                areas_interes, alergias_alimentarias, conocia_ted,
                participo_anteriormente, como_se_entero, por_que_participar,
                acepta_newsletter, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.nombre, this.apellido, this.dni, this.edad, this.email,
            this.telefono, this.genero, this.ocupacion, this.empresa,
            this.nivel_educativo, this.es_comunidad_utn, this.carrera,
            this.legajo, this.anio_cursando, this.materia_docente,
            this.areas_interes, this.alergias_alimentarias, this.conocia_ted,
            this.participo_anteriormente, this.como_se_entero,
            this.por_que_participar, this.acepta_newsletter, ipAddress, userAgent
        ];

        try {
            const result = await runQuery(sql, params);
            
            // Log de auditoría
            await this.logAction('INSERT', null, this, result.id, ipAddress, userAgent);
            
            return { success: true, id: result.id };
        } catch (error) {
            console.error('Error al guardar inscripción:', error);
            
            // Verificar si es error de duplicado
            if (error.message.includes('UNIQUE constraint failed')) {
                if (error.message.includes('dni')) {
                    throw new Error('Ya existe una inscripción con este DNI');
                }
                if (error.message.includes('email')) {
                    throw new Error('Ya existe una inscripción con este email');
                }
            }
            
            throw new Error('Error interno del servidor');
        }
    }

    // Obtener inscripción por ID
    static async findById(id) {
        const sql = 'SELECT * FROM registrations WHERE id = ?';
        return await getQuery(sql, [id]);
    }

    // Obtener inscripción por email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM registrations WHERE email = ?';
        return await getQuery(sql, [email]);
    }

    // Obtener inscripción por DNI
    static async findByDNI(dni) {
        const sql = 'SELECT * FROM registrations WHERE dni = ?';
        return await getQuery(sql, [dni]);
    }

    // Obtener todas las inscripciones
    static async findAll(limit = 100, offset = 0) {
        const sql = `
            SELECT * FROM registrations 
            ORDER BY fecha_hora DESC 
            LIMIT ? OFFSET ?
        `;
        return await allQuery(sql, [limit, offset]);
    }

    // Obtener estadísticas
    static async getStatistics() {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM registrations',
            utnStudents: 'SELECT COUNT(*) as count FROM registrations WHERE es_comunidad_utn = "estudiante"',
            utnGraduates: 'SELECT COUNT(*) as count FROM registrations WHERE es_comunidad_utn = "graduado"',
            utnTeachers: 'SELECT COUNT(*) as count FROM registrations WHERE es_comunidad_utn = "docente"',
            others: 'SELECT COUNT(*) as count FROM registrations WHERE es_comunidad_utn = "otra"',
            byCareer: `
                SELECT carrera, COUNT(*) as count 
                FROM registrations 
                WHERE carrera IS NOT NULL 
                GROUP BY carrera 
                ORDER BY count DESC
            `,
            recentRegistrations: `
                SELECT COUNT(*) as count 
                FROM registrations 
                WHERE fecha_hora >= datetime('now', '-24 hours')
            `
        };

        const stats = {};
        
        for (const [key, query] of Object.entries(queries)) {
            try {
                if (key === 'byCareer') {
                    stats[key] = await allQuery(query);
                } else {
                    const result = await getQuery(query);
                    stats[key] = result.count;
                }
            } catch (error) {
                console.error(`Error en consulta ${key}:`, error);
                stats[key] = 0;
            }
        }

        return stats;
    }

    // Log de auditoría
    static async logAction(action, oldData, newData, registrationId, ipAddress, userAgent) {
        const sql = `
            INSERT INTO audit_logs (registration_id, action, old_data, new_data, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            registrationId,
            action,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            ipAddress,
            userAgent
        ];

        try {
            await runQuery(sql, params);
        } catch (error) {
            console.error('Error al crear log de auditoría:', error);
        }
    }

    // Verificar si existe duplicado
    static async checkDuplicate(email, dni) {
        const emailExists = await Registration.findByEmail(email);
        const dniExists = await Registration.findByDNI(dni);

        return {
            emailExists: !!emailExists,
            dniExists: !!dniExists,
            duplicate: !!(emailExists || dniExists)
        };
    }
}

export default Registration;
