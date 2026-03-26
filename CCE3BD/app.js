const CONFIG = {
    // Eliminamos el /api del final para evitar duplicados
    URL_BASE: "http://51.142.225.193:7081", 
    // Mantenemos la ruta completa desde la raíz
    ENDPOINT_AGENDAS: "/api/Agenda/ConsultarAgendasExternas",
    // Ruta corregida para descargar archivos
    ENDPOINT_IMAGEN: "/api/ArchivoAgenda/DescargarArchivoAgenda" 
};

async function cargarAgendas() {
    const container = document.getElementById('agenda-container');
    
    try {
        const urlFinal = `${CONFIG.URL_BASE}${CONFIG.ENDPOINT_AGENDAS}`;
        console.log("Consultando a:", urlFinal);

        const response = await fetch(urlFinal, {
            method: 'POST', // Tu controlador C# tiene [HttpPost]
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Cuerpo vacío ya que ConsultarAgendasExternas no usa Peticion<T>
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const res = await response.json();
        console.log("Datos recibidos:", res);

        const exito = res.status?.exito ?? res.Status?.Exito ?? 0;
        const lista = res.data ?? res.Data;

        if (exito === 1 && Array.isArray(lista)) {
            container.innerHTML = ''; 
            lista.forEach(item => {
                container.appendChild(crearTarjetaAgenda(item));
            });
        } else {
            container.innerHTML = `<div class="error">Aviso: ${res.status?.mensaje || "No hay datos"}</div>`;
        }

    } catch (error) {
        console.error("Fallo crítico:", error);
        container.innerHTML = `<div class="error">Error de conexión. Revisa la consola.</div>`;
    }
}

function crearTarjetaAgenda(item) {
    const div = document.createElement('div');
    div.className = 'card-evento'; // Usando tu clase de CSS original

    // En C#, tu método ConsultarAgendasExternas carga 'ArchivosAgenda'
    const archivos = item.archivosAgenda || item.ArchivosAgenda || [];
    const fotoPrincipal = archivos[0]; 
    const guidImagen = fotoPrincipal?.ruta || fotoPrincipal?.Ruta;
    const idAgenda = item.idAgenda || item.IdAgenda;

    // Si hay imagen, mostramos el contenedor con skeleton
    let imagenHtml = `<div class="image-box skeleton" id="img-cont-${idAgenda}">
                        <img src="" id="img-tag-${idAgenda}" alt="Evento">
                      </div>`;

    div.innerHTML = `
        ${imagenHtml}
        <div class="content-box">
            <h2 class="event-title">${item.titulo || item.Titulo || 'Sin título'}</h2>
            <p class="event-desc">${item.texto || item.Texto || ''}</p>
        </div>
    `;

    // Si existe el GUID, disparamos la descarga de la imagen por separado
    if (guidImagen && guidImagen !== "NA") {
        descargarImagenBase64(guidImagen, idAgenda);
    }

    return div;
}

async function descargarImagenBase64(guid, id) {
    try {
        const res = await fetch(`${CONFIG.URL_BASE}${CONFIG.ENDPOINT_IMAGEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Según tu lógica: Data es el GUID e Identificador es el ID de la agenda
            body: JSON.stringify({ Token: "", Data: guid, Identificador: id.toString() })
        });
        
        const json = await res.json();
        const base64 = json.data || json.Data;

        if (base64) {
            const imgElement = document.getElementById(`img-tag-${id}`);
            const container = document.getElementById(`img-cont-${id}`);
            imgElement.src = `data:image/png;base64,${base64}`;
            imgElement.onload = () => {
                container.classList.remove('skeleton');
                imgElement.style.opacity = "1";
            };
        }
    } catch (e) {
        console.error("Error descargando imagen:", e);
    }
}

document.addEventListener('DOMContentLoaded', cargarAgendas);