const CONFIG = {
    URL_BASE: 'http://51.142.225.193:7081/api',
    TEL_FIJO: '4831164567'
};

async function cargarAgenda() {
    const container = document.getElementById('agenda-container');
    
    try {
        // USAMOS HTTP SIN S (ya que vimos que con S falla por SSL)
        const response = await fetch(`${CONFIG.URL_BASE}/Agenda/ConsultarAgendasCCE`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: "", Identificador: "0", Data: {} })
        });

        const res = await response.json();
        console.log("Respuesta completa del servidor:", res); // Esto nos dirá qué llega exactamente

        // Adaptamos la lectura: si res.Status existe lo usamos, si no, intentamos leer res.Data o res directamente
        let items = [];
        if (res.Status && res.Status.Exito === 1) {
            items = res.Data;
        } else if (Array.isArray(res)) {
            items = res; // Por si la API manda el array directo
        } else if (res.Data && Array.isArray(res.Data)) {
            items = res.Data; // Por si viene Data pero sin Status
        }
        
        if (items.length > 0) {
            container.innerHTML = '';
            // Tomamos los primeros 3
            const itemsAMostrar = items.slice(0, 3);
            
            for (const item of itemsAMostrar) {
                const card = document.createElement('div');
                card.className = 'card-evento';
                
                // Mapeo seguro de campos
                const titulo = item.Titulo || "Sin título";
                const texto = item.Texto || "Sin descripción";
                const lugar = item.Lugar || "N/A";
                const fecha = item.FechaPublicacion || item.Fecha || new Date();

                // Buscamos la imagen
                const foto = item.ArchivosAgenda?.find(a => a.Principal) || item.ArchivosAgenda?.[0];
                const guidImagen = foto ? foto.Ruta : null;

                card.innerHTML = `
                    <div class="image-box skeleton" id="container-${item.IdAgenda}">
                        <img src="" id="img-${item.IdAgenda}" alt="${titulo}">
                    </div>
                    <div class="content-box">
                        <h2 class="event-title">${titulo}</h2>
                        <div class="event-date">${formatearFecha(fecha)}</div>
                        <p class="event-desc">${texto}</p>
                        <div class="event-footer">
                            <div>Ubicación: <strong>${lugar}</strong></div>
                        </div>
                    </div>
                `;
                
                container.appendChild(card);

                if (guidImagen && guidImagen !== "NA") {
                    descargarYMostrarImagen(guidImagen, item.IdAgenda);
                } else {
                    // Si no hay imagen, quitamos el skeleton
                    document.getElementById(`container-${item.IdAgenda}`).classList.remove('skeleton');
                }
            }
        } else {
            container.innerHTML = '<div class="status-message">No hay eventos para mostrar.</div>';
        }

    } catch (error) {
        console.error("Detalle del fallo:", error);
        container.innerHTML = `<div class="status-message">Fallo de conexión: ${error.message}</div>`;
    }
}

async function descargarYMostrarImagen(guid, id) {
    try {
        const response = await fetch(`${CONFIG.URL_BASE}/ArchivoAgenda/DescargarArchivoAgenda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: "", Data: guid, Identificador: "0" })
        });
        const res = await response.json();
        if (res.Status.Exito === 1) {
            const imgElement = document.getElementById(`img-${id}`);
            const containerImg = document.getElementById(`container-${id}`);
            imgElement.src = `data:image/png;base64,${res.Data}`;
            imgElement.onload = () => {
                containerImg.classList.remove('skeleton');
                imgElement.classList.add('loaded');
            };
        }
    } catch (err) { console.error("Error imagen:", err); }
}

function formatearFecha(fechaStr) {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fechaStr).toLocaleDateString('es-MX', opciones);
}

document.addEventListener('DOMContentLoaded', cargarAgenda);