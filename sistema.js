document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos HTML ---
    const graduacaoInputEntrada = document.getElementById('graduacaoEntrada');
    const numeroPMInputEntrada = document.getElementById('numeroPMEntrada');
    const nomeMilitarInputEntrada = document.getElementById('nomeMilitarEntrada');
    const incluirMilitarBtnEntrada = document.getElementById('incluirMilitarBtnEntrada');
    const listaMilitaresUlEntrada = document.getElementById('listaMilitaresEntrada');

    const dataHoraSpan = document.getElementById('dataHoraAtual');
    const salvarRelatorioBtn = document.getElementById('salvarRelatorioBtn');
    const exportarRelatorioBtn = document.getElementById('exportarRelatorioBtn'); // NOVO
    const presosRecebidosInput = document.getElementById('presosRecebidos');
    const objetosGuardaInput = document.getElementById('objetosGuarda');
    const relatorioFinalInput = document.getElementById('relatorioFinal');
    const obsEquipeAnteriorArea = document.getElementById('obsEquipeAnterior');
    const historicoRelatoriosDiv = document.getElementById('historicoRelatorios');

    // Arrays temporários
    let militaresEntrada = [];

    // Validação PM (Regex)
    const pmPattern = /^\d{3}\.\d{3}-\d{1}$/;

    // --- FUNÇÕES GERAIS (Máscara, Data, Renderização) ---

    function aplicarMascaraPM(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 7);

        let formattedValue = '';
        if (value.length > 0) {
            formattedValue = value.substring(0, 3);
        }
        if (value.length > 3) {
            formattedValue += '.' + value.substring(3, 6);
        }
        if (value.length > 6) {
            formattedValue += '-' + value.substring(6, 7);
        }
        e.target.value = formattedValue;
    }

    numeroPMInputEntrada.addEventListener('input', aplicarMascaraPM);

    function handleKeyDown(e) {
        if (['ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(e.key)) {
            return;
        }
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
        militaresEntrada.forEach(militar => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong class="military-info">${militar.numeroPM} - ${militar.graduacao}</strong> - ${militar.nome} 
                <span class="timestamp">(${militar.dataHora})</span>
            `;
            listaMilitaresUlEntrada.appendChild(listItem);
        });
    }

    function criarObjetoMilitar(graduacao, numeroPM, nome) {
        const now = new Date();
        const dataInclusaoFormatada = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaInclusaoFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return {
            graduacao,
            numeroPM,
            nome: nome.trim(),
            dataHora: `${dataInclusaoFormatada} ${horaInclusaoFormatada}`
        };
    }

    // --- LÓGICA DE INCLUSÃO ---

    incluirMilitarBtnEntrada.addEventListener('click', () => {
        const numeroPM = numeroPMInputEntrada.value;
        const nomeMilitar = nomeMilitarInputEntrada.value.trim();

        if (nomeMilitar && pmPattern.test(numeroPM)) {
            const novoMilitar = criarObjetoMilitar(graduacaoInputEntrada.value, numeroPM, nomeMilitar);
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


    // --- LÓGICA DE HISTÓRICO E RELATÓRIO ---

    function getRelatorios() {
        const relatoriosJson = localStorage.getItem('trocaRelatorios');
        return relatoriosJson ? JSON.parse(relatoriosJson) : [];
    }

    function saveRelatorios(relatorios) {
        localStorage.setItem('trocaRelatorios', JSON.stringify(relatorios));
    }

    function renderizarHistorico() {
        const relatorios = getRelatorios();
        historicoRelatoriosDiv.innerHTML = '';
        let militaresSaidaDesteTurno = [];

        // Função auxiliar para formatar a lista de nomes (ex: "SGT P. SILVA, CB S. DIAS")
        const formatarNomes = (militares) => {
            if (!militares || militares.length === 0) return 'N/A';
            // Alternativa para NOME COMPLETO:
            return militares.map(m => `${m.graduacao} ${m.nome}`).join(' | ');
        };

        if (relatorios.length === 0) {
            historicoRelatoriosDiv.innerHTML = '<p class="empty-history">NENHUM RELATÓRIO ANTERIOR ENCONTRADO.</p>';
            obsEquipeAnteriorArea.value = 'NENHUMA OBSERVAÇÃO DE TURNO ANTERIOR.';

        } else {
            const ultimoRelatorioSalvo = relatorios[relatorios.length - 1];
            obsEquipeAnteriorArea.value = ultimoRelatorioSalvo.relatorioFinal || 'A EQUIPE ANTERIOR NÃO DEIXOU OBSERVAÇÕES.';

            militaresSaidaDesteTurno = ultimoRelatorioSalvo.militaresEntrada;

            const ultimos3 = relatorios.slice(-3).reverse();

            ultimos3.forEach((relatorio) => {
                const quemAssumiu = relatorio.militaresEntrada;
                const quemSaiu = relatorio.militaresSaida || [];

                // Formata a lista de militares para o display do histórico
                const listaQuemAssumiu = formatarNomes(quemAssumiu);
                const listaQuemSaiu = formatarNomes(quemSaiu);

                const item = document.createElement('div');
                item.className = 'history-item';

                item.innerHTML = `
                    <div class="history-header">Relatório de Troca - ${relatorio.dataRelatorio}</div>
                    <p><strong>Quem Saiu:</strong> ${listaQuemSaiu}</p>
                    <p><strong>Quem Assumiu:</strong> ${listaQuemAssumiu}</p>
                    <p><strong>Prisioneiros Recebidos:</strong> ${relatorio.presosRecebidos}</p>
                    <p><strong>Resumo do Relatório Final:</strong> ${relatorio.relatorioFinal ? relatorio.relatorioFinal.substring(0, 80) + '...' : 'N/A'}</p>
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

        if (relatorioFinalInput.value.trim() === '') {
            if (!confirm('O Relatório Final do Turno está vazio. Deseja salvar mesmo assim?')) {
                return;
            }
        }

        const militaresSaidaAutomatica = renderizarHistorico();

        const relatorios = getRelatorios();
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


    // 6. FUNÇÃO PARA EXPORTAR O ÚLTIMO RELATÓRIO SALVO
    exportarRelatorioBtn.addEventListener('click', () => {
        const relatorios = getRelatorios();
        if (relatorios.length === 0) {
            alert('Nenhum relatório salvo para exportar.');
            return;
        }

        const rel = relatorios[relatorios.length - 1]; // Último relatório salvo

        // Formatação dos militares
        const formatarMilitares = (militares) => {
            if (!militares || militares.length === 0) return 'N/A';
            return militares.map(m => ` - ${m.graduacao} PM ${m.numeroPM} - ${m.nome}`).join('\n');
        };

        const textoRelatorio = `
======================================================
         RELATÓRIO DE TROCA DE SERVIÇO - PMMG
------------------------------------------------------
Data/Hora da Troca: ${rel.dataRelatorio}
======================================================

--- EQUIPE QUE DEIXOU O SERVIÇO ---
${formatarMilitares(rel.militaresSaida)}

--- EQUIPE QUE ASSUMIU O SERVIÇO ---
${formatarMilitares(rel.militaresEntrada)}

======================================================
--- INFORMAÇÕES DO SERVIÇO ENTREGUE ---

1. PRISIONEIROS RECEBIDOS: ${rel.presosRecebidos}

2. OBJETOS SOB GUARDA:
${rel.objetosGuarda || 'Nenhuma informação registrada.'}

3. RELATÓRIO FINAL DO TURNO:
${rel.relatorioFinal || 'Nenhum relatório final registrado.'}

======================================================
`;

        // Cria um Blob e dispara o download como arquivo .txt
        const nomeArquivo = `Relatorio_Troca_${rel.dataRelatorio.replace(/[\/:\s]/g, '_')}.txt`;
        const blob = new Blob([textoRelatorio], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Relatório do turno de ${rel.dataRelatorio} exportado com sucesso!`);
    });

    // Carregar o histórico e a observação da equipe anterior ao iniciar
    renderizarHistorico();
});