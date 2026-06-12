document.getElementById('params-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    //visual de carregamento
    document.getElementById('btn-calcular').innerText = "Calculando...";

    // 1. Coletar os dados dos inputs
    const data = {
        L: parseFloat(document.getElementById('L').value),
        R: parseFloat(document.getElementById('R').value),
        C: parseFloat(document.getElementById('C').value),
        M1: parseFloat(document.getElementById('M1').value),
        B1: parseFloat(document.getElementById('B1').value),
        K1: parseFloat(document.getElementById('K1').value),
        Vf: parseFloat(document.getElementById('Vf').value),
        Rh: parseFloat(document.getElementById('Rh').value),
        Tem: parseFloat(document.getElementById('Tem').value),
        A: parseFloat(document.getElementById('A').value),
        T: parseFloat(document.getElementById('T').value)
    };

    try {
        
        const response = await fetch('/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        // 3. Avaliar Causalidade e Estabilidade
        const polos = result.polos;
        const zeros = result.zeros;

        document.getElementById('txt-causalidade').innerText = "SISTEMA CAUSAL (Grau Denom. ≥ Nume.)";
        document.getElementById('txt-causalidade').style.color = "#27ae60";

        // Calcula a magnitude de todos os polos (sqrt(real^2 + imag^2))
        let maxMagnitude = 0;
        let isStable = true;

        polos.forEach(p => {
            let mag = Math.sqrt(p.real * p.real + p.imag * p.imag);
            if (mag > maxMagnitude) maxMagnitude = mag;
            if (mag >= 1) isStable = false; // Se magnitude >= 1, é instável
        });

        const estabEl = document.getElementById('txt-estabilidade');
        if (isStable) {
            estabEl.innerText = "SISTEMA ESTÁVEL (|z| < 1)";
            estabEl.style.color = "#27ae60";
        } else {
            estabEl.innerText = "SISTEMA INSTÁVEL (|z| ≥ 1)";
            estabEl.style.color = "#e74c3c";
        }

       
        const tbody = document.getElementById('tabela-corpo');
        tbody.innerHTML = ""; 

        // Função auxiliar para criar as linhas formatadas
        const criarLinha = (tipo, real, imag) => {
            const mag = Math.sqrt(real * real + imag * imag);
            const tr = document.createElement('tr');
            const classeCor = tipo === 'Polo' ? 'tag-polo' : 'tag-zero';
            
            // Formata os números para terem no máximo 5 casas decimais
            tr.innerHTML = `
                <td class="${classeCor}">${tipo}</td>
                <td>${real.toFixed(5)}</td>
                <td>${imag.toFixed(5)} j</td>
                <td><strong>${mag.toFixed(5)}</strong></td>
            `;
            tbody.appendChild(tr);
        };

        // Popula a tabela primeiro com os Polos, depois com os Zeros
        polos.forEach(p => criarLinha('Polo', p.real, p.imag));
        zeros.forEach(z => criarLinha('Zero', z.real, z.imag));
        // ==========================================

        // 4. Plotar o Gráfico com Plotly
        desenharGraficoZ(polos, zeros, maxMagnitude);

    } catch (error) {
        console.error("Erro na API:", error);
        alert("Erro ao calcular. Verifique se a API está rodando corretamente.");
    } finally {
        document.getElementById('btn-calcular').innerText = "Calcular Plano Z";
    }
});

function desenharGraficoZ(polos, zeros, maxMagnitude) {
    const rangeLimit = Math.max(1.5, maxMagnitude + 0.5);

    // Preparar dados do Círculo Unitário
    const circleX = [], circleY = [];
    for (let i = 0; i <= 100; i++) {
        const theta = (i / 100) * 2 * Math.PI;
        circleX.push(Math.cos(theta));
        circleY.push(Math.sin(theta));
    }

    // Trace 1: Círculo Unitário
    const traceCircle = {
        x: circleX,
        y: circleY,
        mode: 'lines',
        line: { color: 'gray', dash: 'dash' },
        name: 'Círculo Unitário (|z|=1)',
        hoverinfo: 'none'
    };

    // Trace 2: Polos (X)
    const tracePolos = {
        x: polos.map(p => p.real),
        y: polos.map(p => p.imag),
        mode: 'markers',
        marker: { symbol: 'x', size: 12, color: '#e74c3c', line: {width: 2} },
        name: 'Polos',
        text: polos.map(p => `Polo: ${p.real.toFixed(4)} + ${p.imag.toFixed(4)}j`),
        hoverinfo: 'text'
    };

    // Trace 3: Zeros (O)
    const traceZeros = {
        x: zeros.map(z => z.real),
        y: zeros.map(z => z.imag),
        mode: 'markers',
        marker: { symbol: 'circle-open', size: 12, color: '#2980b9', line: {width: 2} },
        name: 'Zeros',
        text: zeros.map(z => `Zero: ${z.real.toFixed(4)} + ${z.imag.toFixed(4)}j`),
        hoverinfo: 'text'
    };

    const layout = {
        title: 'Plano Z e Região de Convergência (RDC)',
        xaxis: { title: 'Eixo Real', range: [-rangeLimit, rangeLimit], zeroline: true, zerolinecolor: 'black' },
        yaxis: { title: 'Eixo Imaginário', range: [-rangeLimit, rangeLimit], zeroline: true, zerolinecolor: 'black', scaleanchor: "x", scaleratio: 1 },
        plot_bgcolor: '#ffffff', // Fundo branco para a RDC funcionar
        margin: { t: 50, l: 50, r: 50, b: 50 },
        showlegend: true,
        
        shapes: [
            
            {
                type: 'rect', xref: 'x', yref: 'y',
                x0: -20, y0: -20, x1: 20, y1: 20,
                fillcolor: 'rgba(46, 204, 113, 0.1)', // Verde transparente
                line: {width: 0}, layer: 'below'
            },
            
            {
                type: 'circle', xref: 'x', yref: 'y',
                x0: -maxMagnitude, y0: -maxMagnitude,
                x1: maxMagnitude, y1: maxMagnitude,
                fillcolor: '#ffffff', // Branco sólido
                line: { color: '#27ae60', width: 2, dash: 'dot' }, // Borda da RDC
                layer: 'below'
            }
        ],
        annotations: [
            {
                x: maxMagnitude + 0.1, y: maxMagnitude + 0.1,
                xref: 'x', yref: 'y',
                text: 'RDC: |z| > ' + maxMagnitude.toFixed(2),
                showarrow: false, font: {color: '#27ae60', size: 12}
            }
        ]
    };

    Plotly.newPlot('grafico-z', [traceCircle, traceZeros, tracePolos], layout, {responsive: true});
}


window.onload = () => {
    document.getElementById('btn-calcular').click();
};