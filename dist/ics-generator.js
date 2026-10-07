export function downloadICS(eventId, eventsData) {
  const event = eventsData.find(e => e.id === eventId);
  if (!event) return;
  
  const formatDate = (date, endOfDay) => {
    const d = new Date(date);
    if (endOfDay) d.setHours(23, 59, 59, 999);
    // converte para UTC para o formato ICS
    const pad = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  
  const start = new Date(event.dataInicio + 'T00:00:00-04:00');
  const end = new Date((event.dataFim || event.dataInicio) + 'T00:00:00-04:00');
  
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Parque Novo MT//Agenda//PT\r\nBEGIN:VEVENT\r\nUID:${event.id}@parquenovomt.com\r\nDTSTAMP:${formatDate(new Date())}\r\nDTSTART:${formatDate(start)}\r\nDTEND:${formatDate(end, true)}\r\nSUMMARY:${event.nome}\r\nLOCATION:${event.espaco} - Parque Novo Mato Grosso\r\nDESCRIPTION:Categoria: ${event.categoria}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
