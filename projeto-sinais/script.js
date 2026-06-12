document.getElementById('params-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Feedback visual de carregamento
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
        // 2. Enviar para a API Python no Vercel
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
    // Definir os limites do gráfico (um pouco maior que o maior polo ou pelo menos 1.5)
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
        title: 'Plano Z e Região de Convergência',
        xaxis: { title: 'Eixo Real', range: [-rangeLimit, rangeLimit], zeroline: true, zerolinecolor: 'black' },
        yaxis: { title: 'Eixo Imaginário', range: [-rangeLimit, rangeLimit], zeroline: true, zerolinecolor: 'black', scaleanchor: "x", scaleratio: 1 },
        plot_bgcolor: '#f8f9fa',
        margin: { t: 50, l: 50, r: 50, b: 50 },
        showlegend: true
    };

    Plotly.newPlot('grafico-z', [traceCircle, traceZeros, tracePolos], layout, {responsive: true});
}


window.onload = () => {
    document.getElementById('btn-calcular').click();
};