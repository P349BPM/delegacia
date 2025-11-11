document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos HTML ---
    const graduacaoInputEntrada = document.getElementById('graduacaoEntrada');
    const numeroPMInputEntrada = document.getElementById('numeroPMEntrada');
    const nomeMilitarInputEntrada = document.getElementById('nomeMilitarEntrada');
    const incluirMilitarBtnEntrada = document.getElementById('incluirMilitarBtnEntrada');
    const listaMilitaresUlEntrada = document.getElementById('listaMilitaresEntrada');

    const dataHoraSpan = document.getElementById('dataHoraAtual');
    const salvarRelatorioBtn = document.getElementById('salvarRelatorioBtn');
    const exportarRelatorioBtn = document.getElementById('exportarRelatorioBtn');
    const presosRecebidosInput = document.getElementById('presosRecebidos');
    const objetosGuardaInput = document.getElementById('objetosGuarda');
    const relatorioFinalInput = document.getElementById('relatorioFinal');
    const obsEquipeAnteriorArea = document.getElementById('obsEquipeAnterior');
    const historicoRelatoriosDiv = document.getElementById('historicoRelatorios');

    // --- Chaves de Armazenamento ---
    const TROCA_STORAGE_KEY = 'trocaRelatorios'; // Chave de Troca de Serviço
    const PROTOCOLOS_STORAGE_KEY = 'protocolosHistorico'; // Chave de Protocolos REDS

    // Arrays temporários
    let militaresEntrada = [];

    // Validação PM (Regex)
    const pmPattern = /^\d{3}\.\d{3}-\d{1}$/;

    // --- UTENSÍLIOS DE DADOS ---

    /**
     * CORREÇÃO CRÍTICA: Busca relatórios usando a chave correta.
     * @param {string} key - A chave de localStorage a ser usada.
     */
    function getRelatorios(key) {
        const relatoriosJson = localStorage.getItem(key);
        return relatoriosJson ? JSON.parse(relatoriosJson) : [];
    }

    function saveRelatorios(relatorios) {
        localStorage.setItem(TROCA_STORAGE_KEY, JSON.stringify(relatorios));
    }
    
    const formatarNomes = (militares) => {
        if (!militares || militares.length === 0) return 'N/A';
        return militares.map(m => `${m.graduacao} ${m.nome}`).join(' | ');
    };

    /**
     * Converte o formato de data/hora salvo no localStorage (DD/MM/YYYY HH:MM) 
     * em um objeto Date para comparações de tempo.
     * (Mantida)
     */
    function parseLocalDateTimeToDate(dateStr) {
        // Tenta converter o formato DD/MM/YYYY HH:MM[:SS]
        const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}),? (\d{2}):(\d{2}):?(\d{2})?/);
        if (parts) {
            // new Date(Year, Month (0-indexed), Day, Hour, Minute, Second)
            return new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6] || 0);
        }
        return null;
    }

    // --- FUNÇÕES GERAIS (Máscara, Data, Renderização) ---
    
    function aplicarMascaraPM(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 7);

        let formattedValue = '';
        if (value.length > 0) formattedValue = value.substring(0, 3);
        if (value.length > 3) formattedValue += '.' + value.substring(3, 6);
        if (value.length > 6) formattedValue += '-' + value.substring(6, 7);
        e.target.value = formattedValue;
    }
    numeroPMInputEntrada.addEventListener('input', aplicarMascaraPM);
    
    function handleKeyDown(e) {
        if (['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(e.key)) return;
    }
    numeroPMInputEntrada.addEventListener('keydown', handleKeyDown);

    function atualizarDataHora() {
        const now = new Date();
        const data = now.toLocaleDateString('pt-BR');
        const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        dataHoraSpan.textContent = `${data} ${hora}`;
    }
    setInterval(atualizarDataHora, 1000);
    atualizarDataHora();

    function renderizarListaMilitares() {
        listaMilitaresUlEntrada.innerHTML = '';
        if (militaresEntrada.length === 0) {
             listaMilitaresUlEntrada.innerHTML = '<li style="color: #999;">Nenhum militar incluído.</li>';
             return;
        }

        militaresEntrada.forEach(militar => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong class="military-info">${militar.numeroPM} - ${militar.graduacao}</strong> - ${militar.nome} 
                <span class="timestamp">(${militar.dataHora})</span>
                <button onclick="removerMilitarEntrada('${militar.numeroPM}')" style="margin-left: 10px; color: red; border: none; background: none; cursor: pointer;">[x]</button>
            `;
            listaMilitaresUlEntrada.appendChild(listItem);
        });
    }
    
    window.removerMilitarEntrada = (numeroPM) => {
        militaresEntrada = militaresEntrada.filter(m => m.numeroPM !== numeroPM);
        renderizarListaMilitares();
    };

    function criarObjetoMilitar(graduacao, numeroPM, nome) {
        const now = new Date();
        const dataInclusaoFormatada = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaInclusaoFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return {
            graduacao,
            numeroPM,
            nome: nome.trim().toUpperCase(),
            dataHora: `${dataInclusaoFormatada} ${horaInclusaoFormatada}`
        };
    }
    
    // --- LÓGICA DE INCLUSÃO ---

    incluirMilitarBtnEntrada.addEventListener('click', () => {
        const numeroPM = numeroPMInputEntrada.value;
        const nomeMilitar = nomeMilitarInputEntrada.value.trim();

        if (nomeMilitar && pmPattern.test(numeroPM)) {
            const novoMilitar = criarObjetoMilitar(graduacaoInputEntrada.value, numeroPM, nomeMilitar);
             if (militaresEntrada.some(m => m.numeroPM === numeroPM)) {
                alert(`O militar ${numeroPM} já foi incluído na equipe de entrada.`);
                return;
            }
            militaresEntrada.push(novoMilitar);
            renderizarListaMilitares();

            numeroPMInputEntrada.value = '';
            nomeMilitarInputEntrada.value = '';
            graduacaoInputEntrada.focus();
        } else {
            alert('Por favor, preencha todos os campos da EQUIPE DE ENTRADA (Graduação, Número PM (formato: 000.000-0) e Nome Completo).');
        }
    });

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && nomeMilitarInputEntrada === document.activeElement) {
            incluirMilitarBtnEntrada.click();
        }
    });


    function renderizarHistorico() {
        const relatorios = getRelatorios(TROCA_STORAGE_KEY); // Usa chave correta
        historicoRelatoriosDiv.innerHTML = '';
        let militaresSaidaDesteTurno = [];

        if (relatorios.length === 0) {
            historicoRelatoriosDiv.innerHTML = '<p class="empty-history">NENHUM RELATÓRIO ANTERIOR ENCONTRADO.</p>';
            obsEquipeAnteriorArea.value = 'NENHUMA OBSERVAÇÃO DE TURNO ANTERIOR.';
        } else {
            const ultimoRelatorioSalvo = relatorios[relatorios.length - 1];
            obsEquipeAnteriorArea.value = ultimoRelatorioSalvo.relatorioFinal || 'A EQUIPE ANTERIOR NÃO DEIXOU OBSERVAÇÕES.';

            militaresSaidaDesteTurno = ultimoRelatorioSalvo.militaresEntrada;

            const ultimos3 = relatorios.slice(-3).reverse();

            ultimos3.forEach((relatorio) => {
                const item = document.createElement('div');
                item.className = 'history-card'; 
                
                item.innerHTML = `
                    <div class="history-header">Relatório de Troca - ${relatorio.dataRelatorio}</div>
                    <p><strong>Quem Saiu:</strong> ${formatarNomes(relatorio.militaresSaida)}</p>
                    <p><strong>Quem Assumiu:</strong> ${formatarNomes(relatorio.militaresEntrada)}</p>
                    <p><strong>Prisioneiros Recebidos:</strong> ${relatorio.presosRecebidos}</p>
                    <p><strong>Resumo do Relatório:</strong> ${relatorio.relatorioFinal ? relatorio.relatorioFinal.substring(0, 80) + '...' : 'N/A'}</p>
                `;
                historicoRelatoriosDiv.appendChild(item);
            });
        }

        return militaresSaidaDesteTurno;
    }


    // 5. Salvar Relatório (Botão Principal)
    salvarRelatorioBtn.addEventListener('click', () => {

        if (militaresEntrada.length === 0) {
            alert('ERRO: Por favor, inclua pelo menos um militar que está ASSUMINDO o serviço (Equipe de Entrada).');
            return;
        }

        if (relatorioFinalInput.value.trim() === '' && !confirm('O Relatório Final do Turno está vazio. Deseja salvar mesmo assim?')) {
            return;
        }

        const militaresSaidaAutomatica = renderizarHistorico(); 

        const relatorios = getRelatorios(TROCA_STORAGE_KEY); // Usa chave correta
        const now = new Date();

        const novoRelatorio = {
            dataRelatorio: now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            militaresEntrada: militaresEntrada,
            militaresSaida: militaresSaidaAutomatica,
            presosRecebidos: presosRecebidosInput.value || 0,
            objetosGuarda: objetosGuardaInput.value.trim(),
            relatorioFinal: relatorioFinalInput.value.trim(),
        };

        relatorios.push(novoRelatorio);
        saveRelatorios(relatorios);

        // Limpar dados do formulário atual
        militaresEntrada = [];
        renderizarListaMilitares();
        presosRecebidosInput.value = 0;
        objetosGuardaInput.value = '';
        relatorioFinalInput.value = '';

        renderizarHistorico();
        alert('Relatório de Troca salvo com sucesso!');
    });


    // 6. FUNÇÃO PARA EXPORTAR O ÚLTIMO RELATÓRIO SALVO (CORRIGIDA E EXPANDIDA)
    exportarRelatorioBtn.addEventListener('click', () => {
        const relatorios = getRelatorios(TROCA_STORAGE_KEY);
        if (relatorios.length === 0) {
            alert('Nenhum relatório salvo para exportar. Não é possível definir o horário de início do turno.');
            return;
        }
        
        // --- 1. DEFINIÇÃO DO INTERVALO DE TEMPO DO TURNO ---
        const ultimoRelatorioSalvo = relatorios[relatorios.length - 1]; 
        
        // HORÁRIO DE INÍCIO: Quando o turno anterior encerrou
        const startTimeStr = ultimoRelatorioSalvo.dataRelatorio; 
        const startTime = parseLocalDateTimeToDate(startTimeStr);

        // HORÁRIO DE FIM: O momento da exportação
        const endTime = new Date();
        const endTimeStr = endTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        if (!startTime) {
            alert('Erro ao determinar o horário de início do turno. Verifique o formato do último relatório salvo.');
            return;
        }

        // --- 2. DADOS DO TURNO ATUAL (SAÍDA) ---
        const militaresQueSairam = ultimoRelatorioSalvo.militaresEntrada; 
        const militaresQueEntraram = militaresEntrada; 
        
        const relatorioFinalEquipe = relatorioFinalInput.value.trim();
        const objetosGuarda = objetosGuardaInput.value.trim();
        const presosRecebidosManual = presosRecebidosInput.value || 0;

        // --- 3. COLETA E FILTRAGEM DE DADOS DO SISTEMA DE PROTOCOLO (REDS) ---
        const protocolos = getRelatorios(PROTOCOLOS_STORAGE_KEY); // AGORA USA A CHAVE CORRETA!
        
        // Função auxiliar para converter string de data/hora do protocolo para Date object
        const parseProtocolDate = (protocolo) => {
            // O campo dataLancamento é o mais confiável para o início do evento REDS
            let dateStr = protocolo.dataLancamento || protocolo.dataHora || protocolo.dataEntrada;
            if (!dateStr) return null;
            
            // Assume formato DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY HH:MM
            return parseLocalDateTimeToDate(dateStr); 
        };

        // Filtra protocolos CUJA CRIAÇÃO está no intervalo
        const protocolosNoIntervalo = protocolos.filter(p => {
            const protocolDate = parseProtocolDate(p);
            // Verifica se a CRIAÇÃO do protocolo ocorreu no intervalo [startTime, endTime]
            return protocolDate && protocolDate >= startTime && protocolDate <= endTime;
        });

        // 3.1. Análise dos Protocolos no Intervalo
        const protocolosEncerradosNoIntervalo = protocolosNoIntervalo.filter(p => p.status === 'FINALIZADO');
        const numProtocolosEncerrados = protocolosEncerradosNoIntervalo.length;

        const presosEntregues = [];
        let totalPresosEntregues = 0;
        const guarnicoesEnvolvidas = new Set();
        
        protocolosNoIntervalo.forEach(p => {
            const protocoloDate = parseProtocolDate(p);
            // Conta e detalha APENAS protocolos que tiveram ENTREGA registrada dentro do intervalo
            if (p.presos && p.presos.length > 0 && p.entrega && p.entrega.dataHora) {
                totalPresosEntregues += p.presos.length;

                p.presos.forEach(preso => {
                    const entregaDate = parseLocalDateTimeToDate(p.entrega.dataHora);
                    
                    presosEntregues.push({
                        reds: p.reds,
                        nome: preso.nome,
                        risco: preso.risco,
                        chegada: protocoloDate ? protocoloDate.toLocaleTimeString('pt-BR') : 'N/A',
                        entrega: entregaDate ? entregaDate.toLocaleTimeString('pt-BR') : 'N/A',
                        guarnicao: p.guarnicao.map(m => `${m.graduacao} ${m.nome}`).join(' / ')
                    });
                });
                
                if (p.guarnicao) {
                    p.guarnicao.forEach(m => guarnicoesEnvolvidas.add(`${m.graduacao} ${m.nome}`));
                }
            }
        });
        
        // 3.2. Análise de Pendências (Presos Em Aberto)
        // Pega TODOS os protocolos em aberto, independentemente do horário de criação
        const protocolosEmAberto = protocolos.filter(p => p.status !== 'FINALIZADO');
        let totalPresosEmAberto = 0;
        const listaPresosEmAberto = [];
        
        protocolosEmAberto.forEach(p => {
             if (p.presos && p.presos.length > 0) {
                 totalPresosEmAberto += p.presos.length;
                 const chegadaDate = parseProtocolDate(p);
                 const chegadaStr = chegadaDate ? chegadaDate.toLocaleDateString('pt-BR') + ' ' + chegadaDate.toLocaleTimeString('pt-BR') : 'N/A';
                 p.presos.forEach(preso => {
                    listaPresosEmAberto.push(` - ${preso.nome} (REDS ${p.reds}, Risco: ${preso.risco}, Chegada: ${chegadaStr})`);
                 });
             }
        });

        // --- 4. FORMATAÇÃO FINAL DO RELATÓRIO ---
        
        const formatarMilitaresParaRelatorio = (militares) => {
             if (!militares || militares.length === 0) return 'N/A';
             return militares.map(m => ` - ${m.graduacao} PM ${m.numeroPM} - ${m.nome}`).join('\n');
        };

        const guarnicoesEnvolvidasStr = [...guarnicoesEnvolvidas].length > 0 ? [...guarnicoesEnvolvidas].join('\n - ') : 'Nenhuma guarnição registrada com entrega de preso.';
        
        const relatorioPresosEntregues = presosEntregues.length > 0
            ? presosEntregues.map(p => ` - ${p.nome} (REDS ${p.reds}, Risco: ${p.risco}) | Chegada: ${p.chegada} | Entrega PC: ${p.entrega} | Guarnição: ${p.guarnicao}`).join('\n')
            : 'Nenhum preso foi entregue à PCMG no sistema neste intervalo.';

        const textoRelatorio = `
=========================================================
      RELATÓRIO FINAL DE TURNO - DEPLAN PMMG
=========================================================
PERÍODO DO TURNO: ${startTimeStr} a ${endTimeStr}
---------------------------------------------------------

1. MILITARES DA DELEGACIA
---------------------------------------------------------
A. EQUIPE QUE DEIXOU O SERVIÇO (SAIU):
${formatarMilitaresParaRelatorio(militaresQueSairam)}

B. EQUIPE QUE ASSUMIU O SERVIÇO (ENTROU):
${formatarMilitaresParaRelatorio(militaresQueEntraram)}

C. RELATÓRIO FINAL DA EQUIPE QUE SAIU (A SER LANÇADO PELA EQUIPE ANTERIOR):
${relatorioFinalEquipe || 'Nenhum relatório final lançado neste turno.'}

---------------------------------------------------------
2. PROTOCOLOS E PRESOS DO TURNO (${startTimeStr} - ${endTimeStr})
---------------------------------------------------------
* PROTOCOLOS REDS REGISTRADOS NO TURNO: ${protocolosNoIntervalo.length}
* PROTOCOLOS REDS FINALIZADOS NO TURNO: ${numProtocolosEncerrados}

* GUARNIÇÕES ENVOLVIDAS (Na Entrega de Presos):
 - ${guarnicoesEnvolvidasStr}

* TOTAL DE PRESOS ENTREGUES À PCMG: ${totalPresosEntregues}

* DETALHAMENTO DOS PRESOS ENTREGUES (Com Horários de Controle):
${relatorioPresosEntregues}

---------------------------------------------------------
3. PENDÊNCIAS E GUARDA ATUAL
---------------------------------------------------------
* Prisioneiros Recebidos (Contagem Manual/Física): ${presosRecebidosManual}
* Objetos Sob Guarda (Lançados):
${objetosGuarda || 'Nenhum objeto lançado.'}

* TOTAL DE PRESOS A RECEBER (EM ABERTO NO SISTEMA): ${totalPresosEmAberto}

* DETALHAMENTO DOS PRESOS A RECEBER:
${listaPresosEmAberto.length > 0 ? listaPresosEmAberto.join('\n') : 'Nenhum preso em aberto no sistema.'}

=========================================================
        `;

        // Cria um Blob e dispara o download como arquivo .txt
        const nomeArquivo = `Relatorio_Turno_${endTimeStr.replace(/[\/:\s]/g, '_')}.txt`;
        const blob = new Blob([textoRelatorio], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Relatório do turno de ${startTimeStr} a ${endTimeStr} exportado com sucesso!`);
    });

    // Carregar o histórico e a observação da equipe anterior ao iniciar
    renderizarHistorico();
    renderizarListaMilitares();
});