import express from 'express';
import RegistrationController from '../controllers/RegistrationController.js';

const router = express.Router();

// Rutas públicas
router.post('/registrations', RegistrationController.createRegistration);
router.get('/health', RegistrationController.healthCheck);

// Rutas para verificar duplicados (útil para validación en tiempo real)
router.get('/check-email/:email', RegistrationController.checkEmail);
router.get('/check-dni/:dni', RegistrationController.checkDNI);

// Rutas de administración (en el futuro se puede agregar autenticación)
router.get('/registrations', RegistrationController.getAllRegistrations);
router.get('/registrations/:id', RegistrationController.getRegistrationById);
router.get('/statistics', RegistrationController.getStatistics);

export default router;
