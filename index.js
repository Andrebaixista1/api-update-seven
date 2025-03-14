const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const moment = require('moment-timezone'); // Importando a biblioteca moment-timezone

const app = express();

const serverStartTime = new Date();

const tokens = [
  { token: "676165323a2e54db790d797c", name: "Planejamento" },
  { token: "677fc18faf2160e50235daf0", name: "Vieiratech" },
  { token: "67894f2cd854900182d2c8f6", name: "Magnatas" },
  { token: "67b3715f5a7defb1b6cdf40f", name: "RH/DP" },
  { token: "67b782e52655ae9abdf9614c", name: "Recrutamento" },
  { token: "67644357277827c719b52ee6", name: "Qualidade" },
  { token: "677bff905b1b95b1b9b7ff76", name: "Versatil" },
  { token: "6762ec463a2e54db79556a7e", name: "La Mafia" },
  { token: "674ef473ea6ba51d3552a00e", name: "Garra" },
  { token: "6762ecc1d70317435a7606ce", name: "Elite" },
  { token: "67866ed5c151083c78549e7a", name: "Marketing" },
  { token: "676187c785245cf76bb88880", name: "Arsenal" },
  { token: "6786ac72d0574cea64fe4984", name: "Dollar" },
  { token: "67993e36001528934217f5de", name: "Espartanos" },
  { token: "677d3f6ad854900182ced4e8", name: "Aceite/Adapta" },
  { token: "6762eb940e7bb7f767632db0", name: "Shark" },
  { token: "677c31a9cf5bbbca4bbbfa4a", name: "Alpha" },
  { token: "", name: "Aceite" },
  { token: "", name: "Mesa de Digitação" },
  { token: "", name: "Christian" },
  { token: "67d177e335748f10d224af1e", name: "Kimberly" },
];

let lastRunStatus = {};
let lastCronRunTime = null;

function formatDateTime(date) {
  // Usando moment-timezone para ajustar a data para o fuso horário de São Paulo (GMT-3)
  return moment(date).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'); // Formato 24 horas
}

function autoRebootChannels() {
  const now = new Date();
  lastCronRunTime = now;
  
  console.log(`Cron executado em: ${formatDateTime(now)}`);  // Log de depuração
  
  tokens.forEach(async ({ token, name }) => {
    try {
      await axios.post(
        'https://api.seven7chat.com/core/v2/api/channel/reboot',
        { syncContacts: true },
        { headers: { 'access-token': token, 'Content-Type': 'application/json' } }
      );
      lastRunStatus[token] = { timestamp: now, name, status: 'Sucesso' };
    } catch (error) {
      lastRunStatus[token] = { timestamp: now, name, status: 'Erro', error: error.message };
    }
  });
}

cron.schedule('0 */3 * * *', autoRebootChannels);

app.listen(process.env.PORT || 5000, () => {
  console.log("Servidor rodando na porta " + (process.env.PORT || 5000));
  autoRebootChannels(); // Executa assim que o servidor for iniciado
});

app.get('/reboot-channels', async (req, res) => {
  const now = new Date();
  
  console.log(`Reboot manual solicitado em: ${formatDateTime(now)}`); // Log de depuração
  
  const results = [];
  for (const { token, name } of tokens) {
    try {
      const response = await axios.post(
        'https://api.seven7chat.com/core/v2/api/channel/reboot',
        { syncContacts: true },
        { headers: { 'access-token': token, 'Content-Type': 'application/json' } }
      );
      lastRunStatus[token] = { timestamp: now, name, status: 'Sucesso' };
      results.push({ name, status: 'Sucesso', data: response.data });
    } catch (error) {
      lastRunStatus[token] = { timestamp: now, name, status: 'Erro', error: error.message };
      results.push({ name, status: 'Erro', error: error.message });
    }
  }
  lastCronRunTime = now;
  res.json({ message: "Reboot finalizado", date: formatDateTime(now), results });
});

app.get('/health', (req, res) => {
  const formattedStartTime = formatDateTime(serverStartTime);
  
  console.log(`Última execução do cron: ${lastCronRunTime ? formatDateTime(lastCronRunTime) : "Ainda não executado"}`); // Log de depuração
  
  res.json({ 
    status: "API está funcionando", 
    serverStartTime: formattedStartTime,
    uptimeInSeconds: process.uptime(),
    lastRun: lastCronRunTime ? formatDateTime(lastCronRunTime) : "Ainda não executado"
  });
});

app.get('/', (req, res) => {
  let html = `
    <html>
      <head>
        <title>Status da Execução da API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin-bottom: 15px; }
          .status-success { color: green; }
          .status-error { color: red; }
        </style>
      </head>
      <body>
        <h1>Status da Última Execução da API</h1>
        <p>Última execução do cron: ${lastCronRunTime ? formatDateTime(lastCronRunTime) : "Ainda não executado"}</p>
  `;
  if (Object.keys(lastRunStatus).length === 0) {
    html += "<p>Nenhuma execução registrada ainda.</p>";
  } else {
    html += "<ul>";
    for (const token in lastRunStatus) {
      const status = lastRunStatus[token];
      const statusClass = status.status === 'Sucesso' ? 'status-success' : 'status-error';
      html += `<li>
        <strong>${status.name}</strong><br>
        Última execução: ${formatDateTime(status.timestamp)}<br>
        Status: <span class="${statusClass}">${status.status}</span>
        ${status.error ? `<br>Erro: ${status.error}` : ''}
      </li>`;
    }
    html += "</ul>";
  }
  html += `
      </body>
    </html>
  `;
  res.send(html);
});

module.exports = app;
