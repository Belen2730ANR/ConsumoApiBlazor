/**
 * Lógica principal de la aplicación
 * Maneja la interfaz de usuario y las interacciones
 */

class EventosApp {
    constructor() {
        this.agendas = [];
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.setupEventListeners();
        this.cargarEventos();
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshBtn');
        const retryBtn = document.getElementById('retryBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.cargarEventos());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.cargarEventos());
        }

        // Cargar eventos cuando la página esté lista
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.cargarEventos());
        }
    }

    /**
     * Carga los eventos desde la API
     */
    async cargarEventos() {
        this.mostrarCargando(true);
        this.ocultarError();

        try {
            console.log('📥 Iniciando carga de eventos...');
            
            // Obtener agendas
            this.agendas = await agendaAPI.obtenerAgendas();

            if (this.agendas.length === 0) {
                this.mostrarSinEventos();
                this.mostrarCargando(false);
                return;
            }

            // Cargar imágenes de forma concurrente
            await this.cargarImagenes();

            // Renderizar eventos
            this.renderizarEventos();

            // Actualizar timestamp
            this.actualizarTimestamp();

            console.log('✅ Eventos cargados exitosamente');

        } catch (error) {
            console.error('❌ Error en cargarEventos:', error);
            this.mostrarError(error);
        } finally {
            this.mostrarCargando(false);
        }
    }

    /**
     * Carga las imágenes de todas las agendas
     */
    async cargarImagenes() {
        const promesas = this.agendas.map(async (agenda) => {
            if (agenda.archivoId) {
                try {
                    const imageUrl = await agendaAPI.obtenerImagen(agenda.archivoId);
                    agenda.imagenUrl = imageUrl;
                } catch (error) {
                    console.warn(`No se pudo cargar imagen para ${agenda.id}:`, error);
                    agenda.imagenUrl = null;
                }
            }
        });

        await Promise.allSettled(promesas);
    }

    /**
     * Renderiza los eventos en el DOM
     */
    renderizarEventos() {
        const container = document.getElementById('eventosContainer');
        container.innerHTML = '';

        // Tomar solo los primeros 3 eventos
        const eventosAMostrar = this.agendas.slice(0, 3);

        eventosAMostrar.forEach((agenda, index) => {
            const card = this.crearCard(agenda, index);
            container.appendChild(card);
        });

        // Mostrar contenedor de eventos
        container.style.display = 'grid';
        document.getElementById('noEventosContainer').style.display = 'none';
    }

    /**
     * Crea una tarjeta de evento
     * @param {Object} agenda - Datos del evento
     * @param {number} index - Índice para animación
     * @returns {HTMLElement} Elemento de la tarjeta
     */
    crearCard(agenda, index) {
        const card = document.createElement('div');
        card.className = 'evento-card';
        card.style.animationDelay = `${index * 0.1}s`;

        // Formatear fechas
        const fechaInicio = new Date(agenda.fechaInicio);
        const dia = fechaInicio.getDate();
        const mes = fechaInicio.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
        const hora = agenda.hora || 'Por confirmar';

        // Crear HTML de la tarjeta
        card.innerHTML = `
            <!-- Contenedor de imagen -->
            <div class="evento-imagen-container">
                ${this.generarImagen(agenda)}
                
                <!-- Badge de fecha -->
                <div class="evento-fecha-badge">
                    <span class="fecha-dia">${dia}</span>
                    <span class="fecha-mes">${mes}</span>
                </div>
            </div>

            <!-- Contenido de la tarjeta -->
            <div class="evento-contenido">
                <h3 class="evento-titulo">${this.sanitizar(agenda.titulo)}</h3>

                <!-- Meta información -->
                <div class="evento-meta">
                    <div class="meta-item">
                        <span class="meta-icon">🕐</span>
                        <span class="meta-texto">${this.sanitizar(hora)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span class="meta-texto">${this.sanitizar(agenda.ubicacion || 'No especificada')}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📞</span>
                        <span class="meta-texto">${this.sanitizar(agenda.telefono || 'No disponible')}</span>
                    </div>
                </div>

                <!-- Descripción -->
                <p class="evento-descripcion">
                    ${this.sanitizar(agenda.descripcion)}
                </p>

                <!-- Footer -->
                <div class="evento-footer">
                    <button class="btn-primario" onclick="eventosApp.verDetalles(${agenda.id})">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Genera el HTML de la imagen
     * @param {Object} agenda - Datos del evento
     * @returns {string} HTML de la imagen
     */
    generarImagen(agenda) {
        if (agenda.imagenUrl) {
            return `
                <img 
                    src="${agenda.imagenUrl}" 
                    alt="${this.sanitizar(agenda.titulo)}" 
                    class="evento-imagen"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div class="evento-imagen-placeholder" style="display: none;">
                    <span>Imagen no disponible</span>
                </div>
            `;
        }

        return `
            <div class="evento-imagen-placeholder">
                <span>Sin Imagen</span>
            </div>
        `;
    }

    /**
     * Sanitiza strings para evitar XSS
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizado
     */
    sanitizar(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Muestra/oculta el indicador de carga
     * @param {boolean} mostrar - Mostrar u ocultar
     */
    mostrarCargando(mostrar) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = mostrar ? 'flex' : 'none';
        }
    }

    /**
     * Muestra el mensaje de error
     * @param {string} error - Mensaje de error
     */
    mostrarError(error) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');

        if (errorContainer && errorMessage) {
            errorMessage.textContent = error || CONFIG.MESSAGES.ERROR_GENERAL;
            errorContainer.style.display = 'flex';
        }

        document.getElementById('eventosContainer').style.display = 'none';
        document.getElementById('noEventosContainer').style.display = 'none';
    }

    /**
     * Oculta el mensaje de error
     */
    ocultarError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    /**
     * Muestra el mensaje de sin eventos
     */
    mostrarSinEventos() {
        document.getElementById('noEventosContainer').style.display = 'flex';
        document.getElementById('eventosContainer').style.display = 'none';
    }

    /**
     * Actualiza el timestamp de última actualización
     */
    actualizarTimestamp() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            const ahora = new Date();
            lastUpdate.textContent = ahora.toLocaleString('es-ES');
        }
    }

    /**
     * Ver detalles de un evento (placeholder)
     * @param {number} id - ID del evento
     */
    verDetalles(id) {
        const agenda = this.agendas.find(a => a.id === id);
        if (agenda) {
            console.log('Detalles del evento:', agenda);
            alert(`Evento: ${agenda.titulo}\n\nDetalles:\n${agenda.descripcion}`);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
const eventosApp = new EventosApp();