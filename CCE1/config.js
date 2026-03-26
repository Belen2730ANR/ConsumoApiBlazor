/**
 * Configuración centralizada de la API
 */

const CONFIG = {
    // URLs de la API
    API_BASE_URL: 'http://51.142.225.193:7081/api',
    
    ENDPOINTS: {
        AGENDAS: '/Agendas/ConsultarAgendasCCE',
        DESCARGAR_IMAGEN: '/ArchivoAgenda/DescargarArchivoAgenda' 
    },
    
    // Timeouts (en ms)
    TIMEOUT: 30000,
    
    // Configuración de reintentos
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    
    // Configuración de caché
    CACHE_DURATION: 300000, // 5 minutos
    
    // Mensajes
    MESSAGES: {
        ERROR_CONEXION: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        ERROR_TIMEOUT: 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',
        ERROR_SERVIDOR: 'El servidor no respondió correctamente. Por favor, intenta más tarde.',
        ERROR_GENERAL: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}