/* risco.js */

// Chave para armazenar os dados de risco/histórico (a mesma usada no protocolo.js)
const STORAGE_KEY = 'presosHistoricoPMMG';
// LIMITE DE ALERTA: 6 presos de Alto Risco
const LIMITE_ALTO_RISCO = 6; 

// Constantes de Elementos
const aReceberContainer = document.getElementById('prisonersAReceber');
const historicoContainer = document.getElementById('prisonersHistorico');
// Novo elemento a ser manipulado para piscar
const alertaRiscoContainer = document.getElementById('alertaRiscoContainer');


// --- FUNÇÕES DE UTENSÍLIOS ---

/**
 * Função utilitária para buscar os dados de presos no localStorage.
 * @returns {Array} Lista de objetos de presos.
 */
function getPresosData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        // Retorna o array parseado, ou um array vazio se não houver dados
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
        return [];
    }
}

/**
 * Função para formatar a data/hora para exibição (ex: "10:37:49").
 * @param {string} dateString - String de data ISO.
 * @returns {string} Hora formatada.
 */
function formatTime(dateString) {
    if (!dateString) return '--:--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Calcula o tempo de espera decorrido ou total em horas:minutos:segundos.
 * @param {string} arrivalTimeISO - Timestamp ISO de chegada.
 * @param {string | null} exitTimeISO - Timestamp ISO de saída, ou null se ainda não saiu.
 * @returns {string} Tempo formatado (ex: "01h 25m 30s").
 */
function calculateWaitTime(arrivalTimeISO, exitTimeISO) {
    const start = new Date(arrivalTimeISO).getTime();
    const end = exitTimeISO ? new Date(exitTimeISO).getTime() : new Date().getTime();

    const diffMs = end - start;
    if (diffMs < 0) return 'Tempo Inválido';

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = num => num.toString().padStart(2, '0');

    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Obtém a classe CSS para o risco.
 * @param {string} risco - Nível de risco (ALTO, MÉDIO, BAIXO).
 * @returns {string} Classe CSS formatada (ex: risk-tag-MEDIO).
 */
function getRiskClass(risco) {
    if (!risco) return 'risk-tag-BAIXO';
    // Remove espaços e converte para maiúsculas para corresponder ao CSS
    return `risk-tag-${risco.toUpperCase().replace(' ', '')}`; 
}


// --- FUNÇÃO DE RENDERIZAÇÃO DE CARTÃO (Mantida) ---

/**
 * Cria o HTML para o cartão de preso.
 * @param {object} preso - Objeto do preso.
 * @param {boolean} isHistorico - Se deve ser renderizado como item de histórico ou "A RECEBER".
 * @returns {string} O HTML do cartão/item de lista.
 */
function createPrisonerHTML(preso, isHistorico) {
    const horaChegada = formatTime(preso.chegada);
    const horaSaida = preso.saida ? formatTime(preso.saida) : '--:--:--';
    const riscoTagClass = getRiskClass(preso.risco);
    
    // Calcula o tempo de espera.
    const tempoCalculado = calculateWaitTime(preso.chegada, preso.saida);
    
    // Define a label de tempo
    const tempoLabel = isHistorico ? 'Tempo Total' : 'Tempo de Espera';
    
    // O tempo de espera em andamento fica em destaque
    const tempoStyle = isHistorico ? 'color: #666;' : `font-size: 1.1em; color: ${preso.risco === 'ALTO' ? '#dc3545' : 'var(--cor-azul)'};`;

    // Estrutura o item
    return `
        <div class="prisoner-card ${isHistorico ? 'history-item' : 'awaiting-item'}">
            <div class="card-header">
                <div class="header-details">
                    <strong style="color: var(--cor-azul);">REDS ${preso.reds}</strong> 
                    <span style="font-size: 0.9em; color: #666; margin-left: 5px;">| ${preso.batalhao} (${preso.cia || 'N/A'})</span>
                </div>
                <div style="text-align: right;">
                    <span class="risk-tag ${riscoTagClass}">${preso.risco} RISCO</span>
                    <p style="font-size: 0.8em; color: #333; margin: 3px 0 0 0;">${horaChegada}</p>
                </div>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 8px 0;">

            <div class="prisoner-details">
                <h3>PRESOS ENVOLVIDOS: ${preso.nome} ${preso.documento ? `(DOC: ${preso.documento})` : ''}</h3>
            </div>
            
            <div class="status-line">
                <div style="flex-grow: 1;">
                    <p style="margin: 0;">Chegada: <span style="font-weight: bold;">${horaChegada}</span></p>
                    <p style="margin: 3px 0 0 0;">Entrega: <span style="font-weight: bold; color: ${preso.saida ? 'var(--cor-verde)' : 'var(--cor-vermelho)'};">${horaSaida}</span></p>
                </div>
                
                <div style="text-align: right; ${tempoStyle}">
                    ${tempoLabel}: <strong>${tempoCalculado}</strong>
                </div>
            </div>
        </div>
    `;
}


// --- FUNÇÃO DE CÁLCULO DE RISCO DE MOMENTO E ALERTA (ALTERADA) ---

/**
 * Calcula o número de presos por nível de risco na lista A RECEBER e aciona o alerta.
 * @param {Array} aReceberList - Lista de presos aguardando recebimento.
 */
function calculateCurrentRisk(aReceberList) {
    let altoRiscoCount = 0;
    
    aReceberList.forEach(preso => {
        if (preso.risco.toUpperCase() === 'ALTO') {
            altoRiscoCount++;
        }
    });

    // 1. Lógica do Alerta Piscante
    if (alertaRiscoContainer) {
        if (altoRiscoCount >= LIMITE_ALTO_RISCO) {
            // Se o limite for atingido, adiciona a classe de alerta
            alertaRiscoContainer.classList.add('alerta-risco-ativo');
            console.warn(`ALERTA: ${altoRiscoCount} presos de ALTO RISCO aguardando recebimento!`);
        } else {
            // Caso contrário, remove a classe
            alertaRiscoContainer.classList.remove('alerta-risco-ativo');
        }
    }
    
    // Você pode continuar a exibir a contagem completa no console para fins de monitoramento
    const riskCounts = {
        ALTO: altoRiscoCount,
        MÉDIO: aReceberList.filter(p => p.risco.toUpperCase() === 'MÉDIO').length,
        BAIXO: aReceberList.filter(p => p.risco.toUpperCase() === 'BAIXO').length
    };
    
    console.log("--- RISCO DE MOMENTO (PRESOS A RECEBER) ---");
    console.log(`TOTAL: ${aReceberList.length} presos`);
    console.log(`ALTO RISCO: ${riskCounts.ALTO} presos (LIMITE: ${LIMITE_ALTO_RISCO})`);
    console.log(`MÉDIO RISCO: ${riskCounts.MÉDIO} presos`);
    console.log(`BAIXO RISCO: ${riskCounts.BAIXO} presos`);
    console.log("------------------------------------------");
}


// --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO (Mantida) ---

/**
 * Função principal para renderizar as duas listas (A Receber e Histórico).
 */
function renderHistorico() {
    // 1. Carrega e separa os dados
    const todosPresos = getPresosData();
    
    const aReceber = todosPresos.filter(p => !p.saida);
    const historico = todosPresos.filter(p => p.saida);

    // 2. Ordena as listas
    aReceber.sort((a, b) => new Date(a.chegada) - new Date(b.chegada)); 
    historico.sort((a, b) => new Date(b.saida) - new Date(a.saida)); 

    // 3. Renderiza a lista "A RECEBER"
    aReceberContainer.innerHTML = ''; 
    if (aReceber.length === 0) {
        aReceberContainer.innerHTML = '<p class="empty-list">Nenhum preso aguardando recebimento.</p>';
    } else {
        aReceber.forEach(preso => {
            aReceberContainer.innerHTML += createPrisonerHTML(preso, false);
        });
        
        // RECALCULA O TEMPO DE ESPERA A CADA SEGUNDO
        setTimeout(renderHistorico, 1000);
    }

    // 4. Renderiza o "HISTÓRICO"
    historicoContainer.innerHTML = '';
    if (historico.length === 0) {
        historicoContainer.innerHTML = '<p class="empty-list">Nenhum preso no histórico de recebimento.</p>';
    } else {
        historico.forEach(preso => {
            historicoContainer.innerHTML += createPrisonerHTML(preso, true);
        });
    }
    
    // 5. Calcula o Risco de Momento e ACIONA O ALERTA
    calculateCurrentRisk(aReceber);
}


// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // A renderização é iniciada no carregamento da página
    renderHistorico();
});