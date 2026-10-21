# 📬 Gmail → Google Sheets: monitoramento automático de e-mails

Automação em **Google Apps Script** que transforma a caixa de entrada do Gmail em uma base estruturada no Google Sheets, atualizada automaticamente a cada 30 minutos.

## O problema

Em operações de atendimento, e-mails chegam dispersos na caixa de entrada e não há uma visão consolidada de *o que chegou, quando, de quem e como foi classificado*. Levantar isso manualmente consome tempo e gera falhas de controle.

## A solução

Um script que roda periodicamente, lê as conversas mais recentes e registra cada **nova** conversa em uma planilha:

| Thread ID | Data | Remetente | Assunto | Labels |
|---|---|---|---|---|
| 18f3a… | 21/10/2026 | cliente@empresa.com | Solicitação de acesso | Suporte, Prioridade |

**Destaques técnicos**

- **Sem duplicidade:** cada conversa é identificada pelo Thread ID; as já registradas são ignoradas (lookup em `Set`, O(1)).
- **Escrita em lote:** todas as novas linhas são gravadas em uma única chamada `setValues`, respeitando as cotas do Apps Script.
- **Execução segura:** `LockService` impede execuções simultâneas; o gatilho é recriado sem duplicar.
- **Autoconfigurável:** cria a aba e o cabeçalho se não existirem.

## Resultados

- Em uso em um fluxo de **~90 e-mails/mês**.
- Elimina o levantamento manual e cria um histórico rastreável, pronto para filtros, indicadores e dashboards.

## Como usar

1. Crie uma planilha no Google Sheets → **Extensões → Apps Script**.
2. Cole o conteúdo de [`Code.gs`](Code.gs).
3. Ajuste as constantes no topo (`NOME_ABA`, `QTD_THREADS`, `INTERVALO_MINUTOS`), se quiser.
4. Execute `buscarEmails` uma vez manualmente e autorize as permissões.
5. Execute `configurarGatilho` uma vez para ativar a execução a cada 30 min.

## Tecnologias

Google Apps Script (JavaScript) · Gmail API (GmailApp) · Google Sheets · Time-driven triggers

## Possíveis evoluções

- Registrar status de resposta e tempo até a primeira resposta (indicador de SLA).
- Dashboard no Looker Studio a partir da planilha.
- Notificação para e-mails sem resposta após X horas.
