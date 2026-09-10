let lang = 'pt';

function toggleLang() {
  lang = lang === 'pt' ? 'en' : 'pt';
  updateText();
}

function updateText() {
  document.getElementById('title').textContent = lang === 'pt' ? 'Monitor de Aurora' : 'Aurora Monitor';
  document.querySelector('button').textContent = lang === 'pt' ? 'Atualizar Agora' : 'Update Now';
  document.getElementById('bzLegend').textContent = lang === 'pt' ? 'Últimas 6 horas de Bz' : 'Last 6 hours of Bz';
  if (window.bz !== undefined) updateDisplay();
}

async function fetchLiveData() {
  document.getElementById('alert-status').textContent = lang === 'pt' ? 'Atualizando...' : 'Updating...';

  try {
    // 1. Busca dados do Bz (Magnetômetro DSCOVR)
    const bzRes = await fetch('https://proxy-noaa.russosec.workers.dev/?url=https://services.swpc.noaa.gov/json/dscovr/dscovr_mag_1m.json');
    const bzData = await bzRes.json();
    
    // Filtra e pega os últimos 72 registros válidos (chave 'bz_gsm')
    const validBzEntries = bzData.filter(entry => entry.bz_gsm !== null && entry.bz_gsm !== undefined);
    const bzValues = validBzEntries.slice(-72).map(entry => parseFloat(entry.bz_gsm));

    // 2. Busca dados do Vento Solar (Plasma DSCOVR)
    const plasmaRes = await fetch('https://proxy-noaa.russosec.workers.dev/?url=https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json');
    const plasmaData = await plasmaRes.json();
    // Pega a última linha com leitura válida de velocidade
    const lastPlasma = plasmaData.slice().reverse().find(row => row[2] !== null && !isNaN(parseFloat(row[2])));
    const speed = parseFloat(lastPlasma[2]);

    // 3. Busca dados do Kp
    const kpRes = await fetch('https://proxy-noaa.russosec.workers.dev/?url=https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    const kpData = await kpRes.json();
    // A última linha contém o registro mais recente
    const lastKp = kpData[kpData.length - 1];
    const kp = parseFloat(lastKp[1]);

    // Armazena nas variáveis globais
    window.bz = bzValues[bzValues.length - 1];
    window.speed = speed;
    window.kp = kp;
    window.bzHistory = bzValues;

    updateDisplay();
    drawBzChart();
  } catch (e) {
    console.error("Erro na requisição:", e);
    document.getElementById('alert-status').textContent = lang === 'pt' ? 'Erro ao obter dados' : 'Error fetching data';
  }
}

function updateDisplay() {
  document.getElementById('bz').textContent = 'IMF Bz: ' + window.bz.toFixed(1) + ' nT';
  document.getElementById('speed').textContent = (lang === 'pt' ? 'Vento Solar: ' : 'Solar Wind Speed: ') + Math.round(window.speed) + ' km/s';
  document.getElementById('kp').textContent = (lang === 'pt' ? 'Índice Kp: ' : 'Kp Index: ') + window.kp.toFixed(1);

  if (window.bz < -2 && window.speed > 400 && window.kp >= 4) {
    document.getElementById('alert-status').textContent = lang === 'pt' ? 'Alerta: Subtempestade possível!' : 'Alert: Possible substorm!';
  } else {
    document.getElementById('alert-status').textContent = lang === 'pt' ? 'Condições normais.' : 'Normal conditions.';
  }
}

function drawBzChart() {
  const canvas = document.getElementById('bzChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;
  const maxAbs = 10;
  const scaleY = centerY / maxAbs;
  const scaleX = width / window.bzHistory.length;

  // Grade de fundo
  ctx.strokeStyle = "#333";
  for (let i = -10; i <= 10; i += 2) {
    const y = centerY - i * scaleY;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Linha zero
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // Linha Bz
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY - window.bzHistory[0] * scaleY);
  for (let i = 1; i < window.bzHistory.length; i++) {
    const x = i * scaleX;
    const y = centerY - window.bzHistory[i] * scaleY;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

fetchLiveData();
