window.downloadICS = function(evento) {
  const safe = (s) => (s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const start = evento.dataInicio.replaceAll('-', '');
  let end = start;
  if (evento.dataFim) {
    const next = new Date(evento.dataFim + 'T12:00:00-04:00');
    next.setDate(next.getDate() + 1);
    end = next.toISOString().slice(0, 10).replaceAll('-', '');
  } else {
    const next = new Date(evento.dataInicio + 'T12:00:00-04:00');
    next.setDate(next.getDate() + 1);
    end = next.toISOString().slice(0, 10).replaceAll('-', '');
  }

  const ics = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//PNMT//Agenda//PT\r
BEGIN:VEVENT\r
UID:${evento.id}@pnmt.local\r
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\\d{3}/, '')}\r
DTSTART;VALUE=DATE:${start}\r
DTEND;VALUE=DATE:${end}\r
SUMMARY:${safe(evento.nome)}\r
LOCATION:${safe(evento.espaco + ' - Parque Novo Mato Grosso')}\r
URL:https://parquenovomt.com/#agenda\r
END:VEVENT\r
END:VCALENDAR\r
`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `evento-${evento.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
