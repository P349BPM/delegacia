document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos Gerais ---
    const numeroREDSInput = document.getElementById('numeroREDS');
    const batalhaoResponsavelSelect = document.getElementById('batalhaoResponsavel');
    const buscaRedsInput = document.getElementById('buscaRedsInput');
    const listaProtocolosDiv = document.getElementById('listaProtocolos'); 

    // --- Elementos de Entrada de Dados (Militarem e Preso) ---
    const incluirGuarnicaoBtn = document.getElementById('incluirGuarnicaoBtn');
    const incluirPresoBtn = document.getElementById('incluirPresoBtn'); 
    const graduacaoGuarnicaoInput = document.getElementById('graduacaoGuarnicao');
    const numeroPMInputGuarnicao = document.getElementById('numeroPMGuarnicao');
    const telefoneInputGuarnicao = document.getElementById('telefoneGuarnicao');
    const nomeMilitarInputGuarnicao = document.getElementById('nomeMilitarGuarnicao');
    const nomePresoInput = document.getElementById('nomePreso');
    const docPresoInput = document.getElementById('docPreso');
    const riscoDisplaySpan = document.getElementById('riskLevel');
    const q1Input = document.getElementById('q1');
    const q2Input = document.getElementById('q2');
    const q3Input = document.getElementById('q3');
    const q4Input = document.getElementById('q4');
    const q5Input = document.getElementById('q5');

    // Dados e Variáveis de Controle
    let currentREDS = '';
    
    const pmPattern = /^\d{3}\.\d{3}-\d{1}$/;
    const STORAGE_KEY = 'protocolosHistorico';
    const RISCO_STORAGE_KEY = 'presosHistoricoPMMG';

    // --- MÁSCARAS E RISCO ---
    
    // Máscara REDS (AAAA-BBBBBBBBB-CCC)
    numeroREDSInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        // Limita a 16 dígitos (4 + 9 + 3)
        value = value.substring(0, 16); 

        let formattedValue = '';
        if (value.length > 0) formattedValue = value.substring(0, 4);
        if (value.length > 4) formattedValue += '-' + value.substring(4, 13);
        if (value.length > 13) formattedValue += '-' + value.substring(13, 16);

        e.target.value = formattedValue;
    });

    numeroPMInputGuarnicao.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 7);

        let formattedValue = '';
        if (value.length > 0) formattedValue = value.substring(0, 3);
        if (value.length > 3) formattedValue += '.' + value.substring(3, 6);
        if (value.length > 6) formattedValue += '-' + value.substring(6, 7);
        e.target.value = formattedValue;
    });

    telefoneInputGuarnicao.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11);

        let formattedValue = '';
        if (value.length > 0) formattedValue = '(' + value.substring(0, 2);
        if (value.length > 2) formattedValue += ') ' + value.substring(2, 7);
        if (value.length > 7) formattedValue += '-' + value.substring(7, 11);
        e.target.value = formattedValue;
    });
    
    function calcularRisco() {
        let pontuacao = 0;
        if (q1Input.value === 'S') pontuacao += 2;
        if (q2Input.value === 'S') pontuacao += 2;
        if (q3Input.value === 'S') pontuacao += 2;
        if (q4Input.value === 'S') pontuacao += 2;
        if (q5Input.value === 'S') pontuacao += 1;

        let nivelRisco = (pontuacao >= 5) ? 'ALTO' : (pontuacao >= 2) ? 'MÉDIO' : 'BAIXO';
        let nivelClasse = (pontuacao >= 5) ? 'risk-high' : (pontuacao >= 2) ? 'risk-medium' : 'risk-low';

        riscoDisplaySpan.textContent = nivelRisco;
        riscoDisplaySpan.className = nivelClasse;
        return nivelRisco;
    }

    q1Input.addEventListener('change', calcularRisco);
    q2Input.addEventListener('change', calcularRisco);
    q3Input.addEventListener('change', calcularRisco);
    q4Input.addEventListener('change', calcularRisco);
    q5Input.addEventListener('change', calcularRisco);
    calcularRisco();

    // --- FUNÇÃO CENTRAL DE CRIAÇÃO/ATUALIZAÇÃO DE PROTOCOLO ---
    
    function getHistorico() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function salvarProtocolo(protocolo) {
        let protocolos = getHistorico();
        const index = protocolos.findIndex(p => p.reds === protocolo.reds);

        if (index !== -1) {
            protocolos[index] = protocolo;
        } else {
            protocolos.push(protocolo);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(protocolos));
        renderizarListaProtocolos();
    }
    
    function limparFormulario() {
        currentREDS = '';
        numeroREDSInput.value = '';
        batalhaoResponsavelSelect.value = '';
        numeroPMInputGuarnicao.value = '';
        telefoneInputGuarnicao.value = '';
        nomeMilitarInputGuarnicao.value = '';
        nomePresoInput.value = '';
        docPresoInput.value = '';
        q1Input.value = q2Input.value = q3Input.value = q4Input.value = q5Input.value = 'N';
        calcularRisco();
    }
    
    // =========================================================================
    // BLOCO DE FUNÇÕES PARA INTEGRAR COM A PÁGINA DE RISCO (risco.js)
    // =========================================================================

    /**
     * Adiciona um novo registro de preso/REDS ao histórico de risco.
     * @param {object} dadosPreso - Dados do preso a ser salvo.
     */
    function addPresoToHistoricoRisco(dadosPreso) {
        try {
            const data = localStorage.getItem(RISCO_STORAGE_KEY);
            const presosHistorico = data ? JSON.parse(data) : [];
            
            // Verifica se o preso já existe (usando ID único)
            const index = presosHistorico.findIndex(p => p.id === dadosPreso.id);

            if (index === -1) {
                 presosHistorico.push(dadosPreso);
            } else {
                presosHistorico[index] = dadosPreso;
            }

            localStorage.setItem(RISCO_STORAGE_KEY, JSON.stringify(presosHistorico));
        } catch (e) {
            console.error("Erro ao salvar dados de risco/chegada:", e);
        }
    }

    // =========================================================================
    // LÓGICA DE INCLUSÃO DE DADOS
    // =========================================================================

    incluirGuarnicaoBtn.addEventListener('click', () => {
        const reds = numeroREDSInput.value.trim().toUpperCase();
        const batalhao = batalhaoResponsavelSelect.value;
        const isREDSValid = reds.length >= 15; 
        const isBatalhaoValid = batalhao !== '';
        
        const numeroPM = numeroPMInputGuarnicao.value;
        const nomeMilitar = nomeMilitarInputGuarnicao.value.trim();
        const telefone = telefoneInputGuarnicao.value;
        const isPMValid = pmPattern.test(numeroPM);
        const isPhoneValid = telefone.length >= 14; 

        if (!isREDSValid) { 
            alert('O Nº REDS deve ser preenchido completamente no formato AAAA-BBBBBBBBB-CCC antes de incluir o militar.'); 
            return; 
        }
        
        if (!isBatalhaoValid) {
            alert('O Batalhão Responsável deve ser selecionado antes de incluir o militar.');
            return;
        }
        
        if (nomeMilitar && isPMValid && isPhoneValid) {
            const novoMilitar = {
                id: Date.now().toString(),
                graduacao: graduacaoGuarnicaoInput.value,
                numeroPM,
                nome: nomeMilitar.toUpperCase(),
                telefone, // <--- O TELEFONE ESTÁ SENDO SALVO AQUI
                dataHoraInclusao: new Date().toLocaleString('pt-BR'),
                oitiva: {
                    nome: `${graduacaoGuarnicaoInput.value} ${nomeMilitar.toUpperCase()}`,
                    chegada: null,
                    saida: null,
                    dispensado: null
                }
            };
            
            let protocolos = getHistorico();
            let protocolo = protocolos.find(p => p.reds === reds);
            
            if (!protocolo) {
                protocolo = {
                    id: Date.now(),
                    reds: reds,
                    batalhao: batalhao,
                    status: 'ABERTO',
                    dataLancamento: new Date().toLocaleString('pt-BR'),
                    guarnicao: [],
                    presos: [],
                    pcnet: { protocolo: '', dataHora: null },
                    entrega: { dataHora: null }
                };
            }

            if (protocolo.guarnicao.some(m => m.numeroPM === numeroPM)) {
                alert(`O militar ${numeroPM} já foi incluído neste REDS.`);
                return;
            }
            
            protocolo.guarnicao.push(novoMilitar);
            salvarProtocolo(protocolo);
            currentREDS = reds;

            // Limpar campos de guarnição
            numeroPMInputGuarnicao.value = '';
            telefoneInputGuarnicao.value = '';
            nomeMilitarInputGuarnicao.value = '';
            graduacaoGuarnicaoInput.focus();
        } else {
            alert('Por favor, preencha todos os campos do Militar da Guarnição.');
        }
    });
    
    incluirPresoBtn.addEventListener('click', () => {
        const reds = numeroREDSInput.value.trim().toUpperCase();
        const batalhao = batalhaoResponsavelSelect.value;
        const isREDSValid = reds.length >= 15;
        const isBatalhaoValid = batalhao !== '';

        if (!isREDSValid) { 
            alert('O Nº REDS deve ser preenchido completamente antes de incluir o preso.'); 
            return; 
        }

        if (!isBatalhaoValid) {
            alert('O Batalhão Responsável deve ser selecionado antes de incluir o preso.');
            return;
        }
        
        const nomePreso = nomePresoInput.value.trim();
        const docPreso = docPresoInput.value.trim();
        const nivelRisco = calcularRisco();

        if (nomePreso) {
            const dataHoraChegada = new Date();
            
            const novoPreso = {
                id: `${reds}-${Date.now()}-${Math.floor(Math.random() * 999)}`, 
                nome: nomePreso.toUpperCase(),
                doc: docPreso,
                risco: nivelRisco,
                dataHoraInclusao: dataHoraChegada.toLocaleString('pt-BR'),
                dataHoraRecebimento: null
            };
            
            let protocolos = getHistorico();
            let protocolo = protocolos.find(p => p.reds === reds);
            
            if (!protocolo) {
                 protocolo = {
                    id: Date.now(),
                    reds: reds,
                    batalhao: batalhao,
                    status: 'ABERTO',
                    dataLancamento: dataHoraChegada.toLocaleString('pt-BR'),
                    guarnicao: [],
                    presos: [],
                    pcnet: { protocolo: '', dataHora: null },
                    entrega: { dataHora: null }
                };
            }
            
            protocolo.presos.push(novoPreso);
            salvarProtocolo(protocolo);
            currentREDS = reds;

            const dadosRisco = {
                id: novoPreso.id,
                reds: reds,
                nome: novoPreso.nome,
                documento: novoPreso.doc,
                risco: novoPreso.risco,
                batalhao: batalhao,
                cia: 'N/A', // Não está no formulário, mantido como N/A
                chegada: dataHoraChegada.toISOString(),
                saida: null 
            };
            addPresoToHistoricoRisco(dadosRisco);


            // Limpar campos de preso e resetar questionário
            nomePresoInput.value = '';
            docPresoInput.value = '';
            q1Input.value = q2Input.value = q3Input.value = q4Input.value = q5Input.value = 'N';
            calcularRisco();
            nomePresoInput.focus();
        } else {
            alert('Por favor, preencha o Nome Completo do Preso.');
        }
    });


    // --- FUNÇÕES DE AÇÃO DIRETA NO CARTÃO (Mantidas) ---

    window.marcarPcnet = (redsId, protocoloPCNET) => {
        const protocolos = getHistorico();
        const protocolo = protocolos.find(p => p.reds === redsId);

        if (protocolo) {
            if (!protocoloPCNET) {
                protocoloPCNET = prompt('Insira o Nº Protocolo PCNET:');
            }

            if (protocoloPCNET) {
                protocolo.pcnet.protocolo = protocoloPCNET.toUpperCase();
                protocolo.pcnet.dataHora = new Date().toLocaleString('pt-BR');
                salvarProtocolo(protocolo);
            } else {
                alert('Número do Protocolo PCNET não informado.');
            }
        }
    };

    window.marcarEntregaPreso = (redsId) => {
        const protocolos = getHistorico();
        const protocolo = protocolos.find(p => p.reds === redsId);

        if (protocolo && protocolo.presos.length > 0) {
            if (confirm(`Confirmar ENTREGA DO(S) PRESO(S) do REDS ${redsId} à PCMG?`)) {
                const now = new Date();
                protocolo.entrega.dataHora = now.toLocaleString('pt-BR');
                salvarProtocolo(protocolo);
                
                // ATUALIZA O HISTÓRICO DE RISCO COM O HORÁRIO DE SAÍDA
                const data = localStorage.getItem(RISCO_STORAGE_KEY);
                let presosHistorico = data ? JSON.parse(data) : [];

                protocolo.presos.forEach(presoProtocolo => {
                    const index = presosHistorico.findIndex(p => p.id === presoProtocolo.id);
                    if (index !== -1) {
                        // Garante que o horário de saída seja o da entrega do REDS
                        presosHistorico[index].saida = now.toISOString();
                    }
                });
                localStorage.setItem(RISCO_STORAGE_KEY, JSON.stringify(presosHistorico));
                
                alert(`Entrega dos presos do REDS ${redsId} registrada com sucesso. O histórico de Risco foi atualizado.`);

            }
        } else if (protocolo && protocolo.presos.length === 0) {
             alert('Não há presos incluídos neste REDS para marcar a entrega.');
        }
    };

    window.marcarOitiva = (redsId, militarId, acao) => {
        const protocolos = getHistorico();
        const protocolo = protocolos.find(p => p.reds === redsId);

        if (protocolo) {
            const militar = protocolo.guarnicao.find(m => m.id === militarId);
            if (militar) {
                const now = new Date().toLocaleString('pt-BR');
                if (acao === 'entrada') {
                    militar.oitiva.chegada = now;
                    militar.oitiva.dispensado = null; 
                } else if (acao === 'saida') {
                    militar.oitiva.saida = now;
                } else if (acao === 'dispensado') {
                    militar.oitiva.dispensado = now;
                    militar.oitiva.chegada = null;
                    militar.oitiva.saida = null;
                }
                salvarProtocolo(protocolo);
            }
        }
    };
    
    window.encerrarProtocolo = (redsId) => {
        if (confirm(`Tem certeza que deseja ENCERRAR o protocolo do REDS ${redsId}? Ele será movido para o histórico definitivo.`)) {
            const protocolos = getHistorico();
            const protocolo = protocolos.find(p => p.reds === redsId);
            
            if (protocolo) {
                protocolo.status = 'FINALIZADO';
                protocolo.dataFinalizacao = new Date().toLocaleString('pt-BR');
                salvarProtocolo(protocolo);
            }
        }
    };

    // --- FUNÇÃO DE RENDERIZAÇÃO DA LISTA DE PROTOCOLOS (ALTERADA AQUI) ---

    function renderizarListaProtocolos(filtroReds = '') {
        const protocolos = getHistorico().sort((a, b) => b.id - a.id);
        listaProtocolosDiv.innerHTML = '';

        const protocolosFiltrados = protocolos.filter(p => p.reds.includes(filtroReds.toUpperCase()));

        if (protocolosFiltrados.length === 0) {
            listaProtocolosDiv.innerHTML = `<p class="empty-history">${filtroReds ? 'NENHUM PROTOCOLO ENCONTRADO PARA O REDS INFORMADO.' : 'NENHUM PROTOCOLO CADASTRADO.'}</p>`;
            return;
        }

        protocolosFiltrados.forEach((p, index) => {
            const isAberto = p.status === 'ABERTO';
            const statusClass = isAberto ? 'tag-high' : 'tag-low';
            const statusText = isAberto ? 'ABERTO' : 'FINALIZADO';
            
            const card = document.createElement('div');
            card.className = `protocolo-card ${isAberto ? 'card-aberto' : 'card-finalizado'}`;
            
            // 1. Cabeçalho (REDS, Batalhão, Data Lançamento e Encerrar)
            let header = `
                <div class="protocol-header">
                    <strong class="protocol-reds">
                        <span class="launch-timestamp">(${p.dataLancamento.split(',')[1].trim()})</span> REDS ${p.reds}
                        <span style="font-size: 0.9em; color: #666; margin-left: 10px;">| ${p.batalhao || 'Batalhão não informado'}</span>
                        (#${protocolos.length - index})
                    </strong>
                    <span class="status-tag ${statusClass}">${statusText}</span>
                    ${isAberto ? `<button onclick="encerrarProtocolo('${p.reds}')" class="action-btn danger-btn small-btn">ENCERRAR PROTOCOLO</button>` : ''}
                </div>
                <hr class="header-separator">
            `;

            // 2. Oitivas (Militares)
            let oitivasHtml = p.guarnicao.map(militar => {
                const m = militar.oitiva;
                
                // MUDANÇA AQUI: Adiciona o telefone após o nome
                const nomeMilitarComTelefone = militar.oitiva.nome + 
                    (militar.telefone ? ` <span style="font-weight: normal; color: #999;">(${militar.telefone})</span>` : '');

                // Novo agrupamento de ações para alinhamento
                let acoesHtml; 

                if (m.dispensado) {
                    acoesHtml = `<span class="timestamp" style="color: var(--cor-vermelho);">DISPENSADO em: ${m.dispensado.split(',')[1].trim()}</span>`;
                } else if (m.chegada && m.saida) {
                    acoesHtml = `<span class="timestamp">E: ${m.chegada.split(',')[1].trim()} | S: ${m.saida.split(',')[1].trim()}</span>`;
                } else if (m.chegada) {
                    // Botão de SAÍDA e texto de ENTRADA juntos
                    acoesHtml = `
                        <span class="timestamp">E: ${m.chegada.split(',')[1].trim()}</span>
                        <button onclick="marcarOitiva('${p.reds}', '${militar.id}', 'saida')" class="action-btn secondary-btn x-small-btn">SAÍDA</button>`;
                } else {
                    // Botões ENTRADA e DISPENSADO lado a lado
                    acoesHtml = `
                        <button onclick="marcarOitiva('${p.reds}', '${militar.id}', 'entrada')" class="action-btn primary-btn x-small-btn">ENTRADA</button>
                        <button onclick="marcarOitiva('${p.reds}', '${militar.id}', 'dispensado')" class="action-btn secondary-btn x-small-btn">DISPENSADO</button>`;
                }
                
                return `
                    <li class="oitiva-item-list">
                        <span class="oitiva-nome">${nomeMilitarComTelefone}:</span> 
                        <span class="oitiva-acoes-container"> 
                            ${isAberto ? acoesHtml : (m.dispensado || m.chegada ? acoesHtml : '<span class="timestamp">NÃO ACIONADO</span>')}
                        </span>
                    </li>
                `;
            }).join('');
            
            // 3. Presos e Entrega (Mantido)
            let presosHtml = '';
            if (p.presos.length > 0) {
                // Linha de Presos com Risco
                const presosComRisco = p.presos.map(preso => {
                    let riskClass = '';
                    let riskText = '';
                    if (preso.risco === 'ALTO') {
                        riskClass = 'risk-tag-high';
                        riskText = 'ALTO RISCO';
                    } else if (preso.risco === 'MÉDIO') {
                        riskClass = 'risk-tag-medium';
                        riskText = 'MÉDIO RISCO';
                    } else {
                        riskClass = 'risk-tag-low';
                        riskText = 'BAIXO PERIGO'; 
                    }
                    
                    // Inclui Nome Completo e DOC (Identity)
                    const infoPreso = `
                        <span class="preso-details">
                            <strong style="color: var(--cor-azul);">${preso.nome}</strong> 
                            ${preso.doc ? `(DOC: ${preso.doc})` : ''}
                        </span>
                    `;
                    
                    return `
                        <li class="preso-item-details">
                            ${infoPreso}
                            <span class="risk-pill ${riskClass}">${riskText}</span>
                        </li>
                    `;
                }).join('');

                // Linha de Status de Entrega
                const entregaData = p.entrega.dataHora ? p.entrega.dataHora.split(',')[1].trim() : 'PENDENTE';
                const entregaBtn = isAberto && !p.entrega.dataHora ? 
                    `<button onclick="marcarEntregaPreso('${p.reds}')" class="action-btn primary-btn x-small-btn">Marcar Entrega</button>` : '';

                presosHtml = `
                    <li class="oitiva-item-list preso-list-header" style="flex-direction: column; align-items: flex-start; border-bottom: none;">
                        <span class="oitiva-nome" style="margin-bottom: 5px;">PRESOS ENVOLVIDOS:</span>
                        <ul class="presos-container-details">
                            ${presosComRisco}
                        </ul>
                    </li>
                    <li class="oitiva-item-list delivery-line" style="border-top: 1px dotted #ccc;">
                        <span class="oitiva-nome" style="font-weight: normal;">Entrega à PCMG:</span>
                        <span class="${p.entrega.dataHora ? 'timestamp' : 'tag-medium'}">${entregaData}</span>
                        ${entregaBtn}
                    </li>
                `;
            }

            // 4. PCNET (Mantido)
            const pcnetData = p.pcnet.dataHora ? p.pcnet.dataHora.split(',')[1].trim() : 'AGUARDANDO LANÇAMENTO';
            const pcnetProtocolo = p.pcnet.protocolo || '__________';
            const pcnetBtn = isAberto && !p.pcnet.protocolo ? 
                `<button onclick="marcarPcnet('${p.reds}')" class="action-btn primary-btn x-small-btn" style="background-color: var(--cor-azul);">Lançar</button>` : '';

            let pcnetHtml = `
                <div class="pcnet-status">
                    <span class="pcnet-label">PCNET ${pcnetProtocolo}:</span>
                    <span class="${p.pcnet.dataHora ? 'timestamp' : 'tag-medium'}">${pcnetData}</span>
                    ${pcnetBtn}
                </div>
            `;
            
            card.innerHTML = `
                ${header}
                <div class="protocol-body">
                    <ul class="oitivas-list">
                        ${oitivasHtml}
                        ${presosHtml}
                    </ul>
                    <hr class="body-separator">
                    ${pcnetHtml}
                </div>
            `;

            listaProtocolosDiv.appendChild(card);
        });
    }

    // --- INICIALIZAÇÃO E EVENTOS (Mantidas) ---

    buscaRedsInput.addEventListener('input', (e) => {
        renderizarListaProtocolos(e.target.value.trim());
    });
    
    numeroREDSInput.addEventListener('blur', (e) => {
        const reds = e.target.value.trim().toUpperCase();
        const batalhao = batalhaoResponsavelSelect.value;
        if (reds.length >= 15 && batalhao !== '') { 
            const protocolos = getHistorico();
            const existente = protocolos.find(p => p.reds === reds);
            
            if (!existente) {
                 const novoProtocolo = {
                    id: Date.now(),
                    reds: reds,
                    batalhao: batalhao,
                    status: 'ABERTO',
                    dataLancamento: new Date().toLocaleString('pt-BR'),
                    guarnicao: [],
                    presos: [],
                    pcnet: { protocolo: '', dataHora: null },
                    entrega: { dataHora: null }
                };
                salvarProtocolo(novoProtocolo);
            }
            currentREDS = reds;
            renderizarListaProtocolos();
        }
    });

    renderizarListaProtocolos();
});