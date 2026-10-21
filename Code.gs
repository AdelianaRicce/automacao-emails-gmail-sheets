/**
 * Automação de registro e monitoramento de e-mails
 * Gmail → Google Sheets (Google Apps Script)
 *
 * Lê as conversas mais recentes da caixa de entrada e registra na planilha
 * apenas as que ainda não foram integradas (controle por Thread ID).
 */

// ===== Configuração =====
var NOME_ABA = 'Emails';          // aba de destino
var QTD_THREADS = 100;            // conversas mais recentes verificadas por execução
var INTERVALO_MINUTOS = 30;       // frequência do gatilho
var CABECALHO = ['Thread ID', 'Data', 'Remetente', 'Assunto', 'Labels'];

/**
 * Busca novas conversas no Gmail e grava na planilha.
 */
function buscarEmails() {
  // Evita execuções simultâneas (gatilho + execução manual)
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;

  try {
    var aba = obterAba_();
    var threadsExistentes = carregarThreadsExistentes_(aba);

    var threads = GmailApp.getInboxThreads(0, QTD_THREADS);
    var fuso = Session.getScriptTimeZone();
    var novasLinhas = [];

    threads.forEach(function (thread) {
      var threadId = thread.getId();
      if (threadsExistentes.has(threadId)) return; // já integrado

      var primeiraMensagem = thread.getMessages()[0];

      novasLinhas.push([
        threadId,
        Utilities.formatDate(primeiraMensagem.getDate(), fuso, 'dd/MM/yyyy'),
        primeiraMensagem.getFrom(),
        primeiraMensagem.getSubject(),
        thread.getLabels().map(function (l) { return l.getName(); }).join(', ')
      ]);

      threadsExistentes.add(threadId);
    });

    // Escrita em lote: uma única chamada à planilha
    if (novasLinhas.length > 0) {
      aba.getRange(aba.getLastRow() + 1, 1, novasLinhas.length, CABECALHO.length)
        .setValues(novasLinhas);
    }

    console.log('Novas conversas registradas: ' + novasLinhas.length);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Cria o gatilho de tempo (executar uma vez).
 * Remove gatilhos antigos da mesma função para não duplicar.
 */
function configurarGatilho() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buscarEmails') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('buscarEmails')
    .timeBased()
    .everyMinutes(INTERVALO_MINUTOS)
    .create();
}

// ===== Funções auxiliares =====

function obterAba_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(NOME_ABA) || planilha.insertSheet(NOME_ABA);

  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
  }
  return aba;
}

function carregarThreadsExistentes_(aba) {
  var ids = new Set();
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return ids;

  // Lê só a coluna A (Thread ID), em vez da planilha inteira
  aba.getRange(2, 1, ultimaLinha - 1, 1).getValues().forEach(function (linha) {
    var id = String(linha[0] || '').trim();
    if (id) ids.add(id);
  });
  return ids;
}
