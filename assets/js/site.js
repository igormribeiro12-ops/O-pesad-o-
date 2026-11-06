/* O Pesadão – Peças São José
   Sem cookies, sem rastreamento, sem envio de dados para servidor.
   Nada aqui usa innerHTML: todo texto é colocado com textContent. */
(function () {
  'use strict';

  var WHATSAPP = '5555997144661';

  /* Menu no celular */
  var botaoMenu = document.querySelector('.abrir-menu');
  var menu = document.getElementById('menu');
  function fecharMenu() {
    if (!menu || !botaoMenu) return;
    menu.classList.remove('aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
  }
  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fecharMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) {
        fecharMenu();
        botaoMenu.focus();
      }
    });
  }

  /* Aberto ou fechado agora (horário de Brasília, onde fica a loja) */
  var HORARIOS = {
    0: [],
    1: [[480, 720], [810, 1080]],
    2: [[480, 720], [810, 1080]],
    3: [[480, 720], [810, 1080]],
    4: [[480, 720], [810, 1080]],
    5: [[480, 720], [810, 1080]],
    6: [[480, 660]]
  };
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function hora(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? (m < 10 ? '0' : '') + m : '');
  }

  function agoraNaLoja() {
    var partes = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (p) { partes[p.type] = p.value; });
    var dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[partes.weekday];
    return { dia: dia, min: (parseInt(partes.hour, 10) % 24) * 60 + parseInt(partes.minute, 10) };
  }

  function situacao(agora) {
    var hoje = HORARIOS[agora.dia] || [];
    for (var i = 0; i < hoje.length; i++) {
      if (agora.min >= hoje[i][0] && agora.min < hoje[i][1]) {
        return { aberto: true, texto: 'Aberto agora, fecha às ' + hora(hoje[i][1]) };
      }
    }
    for (var k = 0; k < 8; k++) {
      var d = (agora.dia + k) % 7, turnos = HORARIOS[d] || [];
      for (var j = 0; j < turnos.length; j++) {
        if (k === 0 && turnos[j][0] <= agora.min) continue;
        var quando = k === 0 ? '' : k === 1 ? 'amanhã ' : DIAS[d] + ' ';
        return { aberto: false, texto: 'Fechado agora, abre ' + quando + 'às ' + hora(turnos[j][0]) };
      }
    }
    return { aberto: false, texto: 'Fechado agora' };
  }

  try {
    var agora = agoraNaLoja();
    if (typeof agora.dia === 'number' && !isNaN(agora.min)) {
      var s = situacao(agora);
      var el = document.getElementById('situacao');
      if (el) {
        el.textContent = s.texto;
        el.classList.add(s.aberto ? 'aberto' : 'fechado');
      }
      document.querySelectorAll('.horario li[data-dias]').forEach(function (li) {
        if (li.getAttribute('data-dias').split(',').indexOf(String(agora.dia)) !== -1) li.classList.add('hoje');
      });
    }
  } catch (erro) { /* sem Intl: fica o horário fixo escrito na página */ }

  /* "Tem a peça?" monta a mensagem e abre o WhatsApp da loja.
     O texto não é enviado a nenhum servidor deste site. */
  var form = document.getElementById('consulta');
  if (!form) return;
  var campoPeca = document.getElementById('peca');
  var oculto = document.getElementById('mensagem');
  var erroPeca = document.getElementById('peca-erro');
  var pronto = document.getElementById('pronto');
  var link = document.getElementById('abrir-whats');

  function limpar(texto, max) {
    return String(texto || '')
      .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function emMoldura() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  campoPeca.addEventListener('input', function () {
    if (campoPeca.value.trim()) {
      erroPeca.hidden = true;
      campoPeca.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', function (e) {
    var peca = limpar(campoPeca.value, 120);

    if (!peca) {
      e.preventDefault();
      erroPeca.hidden = false;
      campoPeca.setAttribute('aria-invalid', 'true');
      campoPeca.focus();
      return;
    }

    var mensagem = 'Olá! Vim pelo site. Vocês têm ' + peca + '?';
    oculto.value = mensagem;

    /* Dentro de uma pré-visualização (moldura), formulários podem ser bloqueados:
       mostra um link pronto em vez de enviar. */
    if (emMoldura()) {
      e.preventDefault();
      link.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem);
      pronto.hidden = false;
      link.focus();
    }
  });
})();
