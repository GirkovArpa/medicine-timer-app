'use strict';

globalThis.$ = document.querySelector.bind(document);

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  globalThis.calendar = new FullCalendar.Calendar(calendarEl, {
    height: '400px',
    initialView: 'dayGridMonth',
    dateClick: function (info) {
      console.log('clicked on ' + info.dateStr);
      calendar.changeView('timeGridDay', info.dateStr);
    }
  });
  calendar.render();

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $('[type=datetime-local]').value = now.toISOString().slice(0, -8);
});

document.addEventListener('click', async ({ target: el }) => {
  calendar.changeView('dayGridMonth');

  if (el.classList.contains('dropdown-item')) {
    $('#dropdownMenuButton1').textContent = el.textContent;
  }

  if (el.id === 'updateDosage') {
    const drug = $('#dropdownMenuButton1').textContent;
    const hr = +$('#hr').value;
    const mg = +$('#mg').value;
    const date = new Date($('[type=datetime-local]').value);
    for (let i = 0; i < 10; i++) {
      i && date.setHours(date.getHours() + hr);
      calendar.addEvent({
        title: `${drug} ${mg}mg`,
        start: date,
        allDay: false,
        color: 'yellow',
        textColor: 'black'
      });
    }
  }

  if (el.id === 'generateSeed') {
    const events = calendar.getEvents().map(({ title, start, color, textColor }) => ({ title: title.trim(), start, color, textColor }));
    shuffle(events);
    const json = JSON.stringify(events);
    const buffer = await compress(json);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    $('#seed').value = b64;
  }

  if (el.id === 'applySeed') {
    const b64 = $('#seed').value;
    const buffer = await b64_to_buffer(b64);
    const json = await decompress(buffer);
    const events = JSON.parse(json);
    events.forEach((event) => {
      calendar.addEvent(event);
    });
  }
});

function compress(string, encoding = 'deflate') {
  const byteArray = new TextEncoder().encode(string);
  const cs = new CompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  return new Response(cs.readable).arrayBuffer();
}

function decompress(byteArray, encoding = 'deflate') {
  const cs = new DecompressionStream(encoding);
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
    return new TextDecoder().decode(arrayBuffer);
  });
}

async function b64_to_buffer(b64) {
  return new Promise((resolve) => {
    var req = new XMLHttpRequest;
    req.open('GET', "data:application/octet;base64," + b64);
    req.responseType = 'arraybuffer';
    req.onload = function fileLoaded(e) {
      var byteArray = new Uint8Array(e.target.response);
      resolve(e.target.response);
    }
    req.send();
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = ~~(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}