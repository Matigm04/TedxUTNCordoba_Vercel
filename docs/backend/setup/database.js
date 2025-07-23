import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'database', 'tedxutn.db');

console.log('🚀 Configurando base de datos TEDxUTN...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al crear la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Base de datos creada/conectada exitosamente.');
    }
});

// Crear tabla de inscripciones
const createRegistrationsTable = `
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        dni TEXT NOT NULL UNIQUE,
        edad INTEGER,
        email TEXT NOT NULL UNIQUE,
        telefono TEXT NOT NULL,
        genero TEXT,
        ocupacion TEXT,
        empresa TEXT,
        nivel_educativo TEXT NOT NULL,
        es_comunidad_utn TEXT NOT NULL, -- 'estudiante', 'graduado', 'docente', 'otra'
        carrera TEXT, -- Solo si es estudiante o graduado
        legajo TEXT, -- Solo si es estudiante
        anio_cursando TEXT, -- Solo si es estudiante (puede ser múltiple)
        materia_docente TEXT, -- Solo si es docente
        areas_interes TEXT, -- JSON string con las áreas de interés
        alergias_alimentarias TEXT,
        conocia_ted TEXT NOT NULL, -- 'si' o 'no'
        participo_anteriormente TEXT NOT NULL, -- 'si' o 'no'
        como_se_entero TEXT NOT NULL, -- 'amigo', 'flyers', 'redes', 'otra'
        por_que_participar TEXT,
        acepta_newsletter BOOLEAN DEFAULT FALSE,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Crear tabla de logs para auditoría
const createLogsTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER,
        action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
        old_data TEXT, -- JSON string
        new_data TEXT, -- JSON string
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registration_id) REFERENCES registrations (id)
    )
`;

// Crear índices para mejorar performance
const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_email ON registrations(email)',
    'CREATE INDEX IF NOT EXISTS idx_dni ON registrations(dni)',
    'CREATE INDEX IF NOT EXISTS idx_fecha_hora ON registrations(fecha_hora)',
    'CREATE INDEX IF NOT EXISTS idx_es_comunidad_utn ON registrations(es_comunidad_utn)',
    'CREATE INDEX IF NOT EXISTS idx_carrera ON registrations(carrera)'
];

// Ejecutar las consultas
db.serialize(() => {
    console.log('📝 Creando tabla de inscripciones...');
    db.run(createRegistrationsTable, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla registrations:', err.message);
        } else {
            console.log('✅ Tabla registrations creada exitosamente.');
        }
    });

    console.log('📝 Creando tabla de logs de auditoría...');
    db.run(createLogsTable, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla audit_logs:', err.message);
        } else {
            console.log('✅ Tabla audit_logs creada exitosamente.');
        }
    });

    console.log('📝 Creando índices...');
    createIndexes.forEach((indexSQL, i) => {
        db.run(indexSQL, (err) => {
            if (err) {
                console.error(`❌ Error al crear índice ${i + 1}:`, err.message);
            } else {
                console.log(`✅ Índice ${i + 1} creado exitosamente.`);
            }
        });
    });
});

// Cerrar la conexión cuando termine
db.close((err) => {
    if (err) {
        console.error('❌ Error al cerrar la base de datos:', err.message);
    } else {
        console.log('🎉 Base de datos configurada exitosamente. ¡Listo para usar!');
        console.log('📍 Ubicación de la base de datos:', dbPath);
    }
    process.exit(0);
});
