/**
 * Servicio para consumir la API REST
 * Maneja todas las solicitudes HTTP
 */

class AgendaAPI {
    constructor() {
        this.cache = new Map();
        this.requestCount = 0;
    }

    /**
     * Obtiene las agendas desde la API
     * @returns {Promise<Array>} Lista de agendas
     */
    async obtenerAgendas() {
        const cacheKey = 'agendas_list';
        
        // Verificar caché
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                console.log('📦 Usando datos en caché');
                return cached.data;
            }
        }

        try {
            const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AGENDAS}`;
            console.log('🔍 Obteniendo agendas desde:', url);

            const response = await this._fetchConTimeout(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validar que sea un array
            const agendas = Array.isArray(data) ? data : (data.data || []);
            
            // Almacenar en caché
            this.cache.set(cacheKey, {
                data: agendas,
                timestamp: Date.now()
            });

            console.log('✅ Agendas cargadas:', agendas.length);
            return agendas;

        } catch (error) {
            console.error('❌ Error al obtener agendas:', error);
            throw this._manejarError(error);
        }
    }

    /**
     * Obtiene la imagen de un archivo
     * @param {string} archivoId - ID del archivo
     * @returns {Promise<string>} URL base64 de la imagen
     */
    async obtenerImagen(archivoId) {
        if (!archivoId) {
            console.warn('⚠️ ID de archivo vacío');
            return null;
        }

        const cacheKey = `imagen_${archivoId}`;
        
        // Verificar caché
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                console.log('📦 Imagen en caché:', archivoId);
                return cached.data;
            }
        }

        try {
            const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.DESCARGAR_IMAGEN}?id=${encodeURIComponent(archivoId)}`;
            console.log('🖼️ Obteniendo imagen:', archivoId);

            const response = await this._fetchConTimeout(url, {
                method: 'GET'
            });

            if (!response.ok) {
                console.warn(`⚠️ No se pudo obtener la imagen ${archivoId}`);
                return null;
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Convertir a base64 para persistencia
            const base64 = await this._blobToBase64(blob);
            
            // Almacenar en caché
            this.cache.set(cacheKey, {
                data: base64,
                timestamp: Date.now()
            });

            return base64;

        } catch (error) {
            console.warn('⚠️ Error al obtener imagen:', error);
            return null;
        }
    }

    /**
     * Fetch con timeout
     * @param {string} url - URL a solicitar
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Response>}
     */
    async _fetchConTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Convierte Blob a Base64
     * @param {Blob} blob - Blob a convertir
     * @returns {Promise<string>} String en base64
     */
    _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Maneja errores de forma consistente
     * @param {Error} error - Error a manejar
     * @returns {string} Mensaje de error amigable
     */
    _manejarError(error) {
        console.error('Error detalles:', {
            nombre: error.name,
            mensaje: error.message,
            stack: error.stack
        });

        if (error.name === 'AbortError') {
            return CONFIG.MESSAGES.ERROR_TIMEOUT;
        }

        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return CONFIG.MESSAGES.ERROR_CONEXION;
        }

        if (error.message.includes('HTTP')) {
            return CONFIG.MESSAGES.ERROR_SERVIDOR;
        }

        return CONFIG.MESSAGES.ERROR_GENERAL;
    }

    /**
     * Limpia el caché
     */
    limpiarCache() {
        this.cache.clear();
        console.log('🗑️ Caché limpiado');
    }
}

// Instancia global del servicio
const agendaAPI = new AgendaAPI();