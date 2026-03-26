document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
});

async function fetchEvents() {
    const grid = document.getElementById('events-grid');
    const loader = document.getElementById('events-loader');
    const telefonoEstatico = "4831163470";

    try {
        const response = await fetch('http://51.142.225.193:7081/EventosCCEH');
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        const rows = doc.querySelectorAll('table tbody tr');
        
        if (rows.length === 0) {
            loader.innerHTML = "No se encontraron eventos activos.";
            return;
        }

        loader.style.display = 'none'; 

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            
            
            const evento = {
                nombre: cells[0]?.innerText || 'Evento sin nombre',
                fecha: cells[1]?.innerText || 'Fecha pendiente',
                hora: cells[2]?.innerText || '',
                ubicacion: cells[3]?.innerText || 'Ubicación por confirmar',
                imagenUrl: cells[4]?.querySelector('img')?.src || 'https://via.placeholder.com/400x600?text=CCEH+Evento',
                descripcion: cells[5]?.innerText || 'Sin descripción disponible'
            };

            // HTML de la tarjeta dinámicamente
            const cardHTML = `
                <article class="event-card">
                    <div class="card-image-container">
                        <img src="${evento.imagenUrl}" alt="${evento.nombre}" onerror="this.src='https://via.placeholder.com/400x600?text=Imagen+No+Disponible'">
                    </div>
                    
                    <div class="card-content">
                        <h2 class="event-title">${evento.nombre}</h2>
                        <p class="event-date-time">${evento.fecha} • ${evento.hora}</p>
                        
                        <p class="event-description">${evento.descripcion}</p>
                        
                        <ul class="event-details-list">
                            <li><strong>📍 Ubicación:</strong> ${evento.ubicacion}</li>
                            <li><strong>📞 Teléfono:</strong> ${telefonoEstatico}</li>
                        </ul>

                        <a href="#" class="btn btn-primary">Ver Detalles</a>
                    </div>
                </article>
            `;
            
            grid.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error('Error al obtener los eventos:', error);
        loader.innerHTML = "Error al conectar con el servidor de eventos.";
    }
}