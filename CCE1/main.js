/**
 * Lógica principal de la aplicación
 */

class EventosApp {
    constructor() {
        this.agendas = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Cargar eventos al inicializar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.cargarEventos());
        } else {
            this.cargarEventos();
        }
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshBtn');
        const retryBtn = document.getElementById('retryBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.cargarEventos());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.cargarEventos());
        }
    }

    async cargarEventos() {
        this.mostrarCargando(true);
        this.ocultarError();

        try {
            console.log('📥 Iniciando carga de eventos...');
            
            this.agendas = await agendaAPI.obtenerAgendas();

            if (!Array.isArray(this.agendas) || this.agendas.length === 0) {
                console.warn('⚠️ No hay agendas disponibles');
                this.mostrarSinEventos();
                this.mostrarCargando(false);
                return;
            }

            console.log('📋 Total de agendas:', this.agendas.length);
            console.log('Primera agenda:', this.agendas[0]);

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

    renderizarEventos() {
        const container = document.getElementById('eventosContainer');
        container.innerHTML = '';

        const eventosAMostrar = this.agendas.slice(0, 3);

        eventosAMostrar.forEach((agenda, index) => {
            const card = this.crearCard(agenda, index);
            container.appendChild(card);
        });

        container.style.display = 'grid';
        document.getElementById('noEventosContainer').style.display = 'none';
    }

    crearCard(agenda, index) {
        const card = document.createElement('div');
        card.className = 'evento-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const fechaInicio = new Date(agenda.fechaInicio);
        const dia = fechaInicio.getDate();
        const mes = fechaInicio.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
        const hora = agenda.hora || 'Por confirmar';

        card.innerHTML = `
            <div class="evento-imagen-container">
                ${this.generarImagen(agenda)}
                
                <div class="evento-fecha-badge">
                    <span class="fecha-dia">${dia}</span>
                    <span class="fecha-mes">${mes}</span>
                </div>
            </div>

            <div class="evento-contenido">
                <h3 class="evento-titulo">${this.sanitizar(agenda.titulo)}</h3>

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
                        <span class="meta-texto">4831164567</span>
                    </div>
                </div>

                <p class="evento-descripcion">
                    ${this.sanitizar(agenda.descripcion)}
                </p>

                <div class="evento-footer">
                    <button class="btn-primario" onclick="eventosApp.verDetalles(${agenda.id})">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;

        return card;
    }

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

    sanitizar(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    mostrarCargando(mostrar) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = mostrar ? 'flex' : 'none';
        }
    }

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

    ocultarError() {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    mostrarSinEventos() {
        document.getElementById('noEventosContainer').style.display = 'flex';
        document.getElementById('eventosContainer').style.display = 'none';
    }

    actualizarTimestamp() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            const ahora = new Date();
            lastUpdate.textContent = ahora.toLocaleString('es-ES');
        }
    }

    verDetalles(id) {
        const agenda = this.agendas.find(a => a.id === id);
        if (agenda) {
            console.log('Detalles del evento:', agenda);
            alert(`Evento: ${agenda.titulo}\n\nDetalles:\n${agenda.descripcion}`);
        }
    }
}

const eventosApp = new EventosApp();