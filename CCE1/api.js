/**
 * Servicio para consumir la API REST
 * Maneja todas las solicitudes HTTP con reintentos automáticos
 */

class AgendaAPI {
    constructor() {
        this.cache = new Map();
        this.requestCount = 0;
    }

    /**
     * Obtiene las agendas desde la API con reintentos automáticos
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

        // Reintentos automáticos
        for (let intento = 1; intento <= CONFIG.MAX_RETRIES; intento++) {
            try {
                console.log(`🔍 Intento ${intento}/${CONFIG.MAX_RETRIES}: Obteniendo agendas...`);
                
                const url = `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AGENDAS}`;
                console.log('🌐 URL completa:', url);

                const response = await this._fetchConTimeout(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📊 Status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Error HTTP ${response.status}:`, errorText.substring(0, 500));
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const text = await response.text();
                console.log('📄 Respuesta cruda (primeros 500 caracteres):', text.substring(0, 500));

                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    console.error('❌ Error al parsear JSON');
                    throw new Error('Respuesta no es JSON válido');
                }

                // Manejo flexible de estructura de respuesta
                const agendas = Array.isArray(data) 
                    ? data 
                    : (data.data || data.Data || []);
                
                if (!Array.isArray(agendas) || agendas.length === 0) {
                    console.warn('⚠️ Respuesta vacía o inválida');
                    if (intento < CONFIG.MAX_RETRIES) {
                        await this._esperar(CONFIG.RETRY_DELAY);
                        continue;
                    }
                }

                console.log('✅ Agendas cargadas:', agendas.length);
                
                // Almacenar en caché
                this.cache.set(cacheKey, {
                    data: agendas,
                    timestamp: Date.now()
                });

                return agendas;

            } catch (error) {
                console.error(`❌ Error en intento ${intento}:`, error.message);
                
                if (intento < CONFIG.MAX_RETRIES) {
                    const delayMs = CONFIG.RETRY_DELAY * intento;
                    console.log(`⏳ Esperando ${delayMs}ms antes de reintentar...`);
                    await this._esperar(delayMs);
                } else {
                    throw this._manejarError(error);
                }
            }
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
        console.log('📍 URL:', url);

        const response = await this._fetchConTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'image/jpeg, image/png, image/gif, image/webp, */*'
            }
        });

        if (!response.ok) {
            console.warn(`⚠️ No se pudo obtener imagen ${archivoId} - Status: ${response.status}`);
            return null;
        }

        // Convertir a data URL directamente
        const blob = await response.blob();
        const base64 = await this._blobToBase64(blob);
        
        console.log(`✅ Imagen descargada: ${archivoId}`);
        
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
     * Espera un tiempo determinado
     */
    _esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Maneja errores de forma consistente
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

const agendaAPI = new AgendaAPI();