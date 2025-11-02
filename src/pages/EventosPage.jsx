// src/pages/EventosPage.jsx
//Importaciones necesarias de React y componentes--------------------------------
import React, { useState } from "react";
import FormEvento from "../components/FormEventos";
import ListaEventosUsuario from "../components/ListaEventos";
//------------------------------------------------------------------------
// Componente principal de la página de gestión de eventos
export default function EventosPage() {
  const [eventoEditando, setEventoEditando] = useState(null);

  const handleEventoAgregado = () => {
    setEventoEditando(null);
    window.location.reload(); // refresca la lista
  };
//-----------------------------------------------------------------------
// Renderizado del componente
return (
    <div className="p-6 text-gray-100">
      <FormEvento
        onEventoAgregado={handleEventoAgregado}
        eventoEditando={eventoEditando}
        onEditCancel={() => setEventoEditando(null)}
      />
      <ListaEventosUsuario onEditar={setEventoEditando} />
    </div>
  );
}
//-----------------------------------------------------------------------

