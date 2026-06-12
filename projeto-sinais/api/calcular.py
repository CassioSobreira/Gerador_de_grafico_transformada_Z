from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# O Vercel procura exatamente por esta variável 'app' (o padrão WSGI)
app = Flask(__name__)
CORS(app) # Libera a conexão do seu site com a API de cálculos

# A rota espelha o nome da pasta e do arquivo
@app.route('/api/calcular', methods=['POST'])
def calcular_polos():
    data = request.get_json()

    # Extrair parâmetros enviados pelo formulário
    L = float(data.get('L', 0.1))
    R = float(data.get('R', 10.0))
    C = float(data.get('C', 100e-6))
    M1 = float(data.get('M1', 0.5))
    B1 = float(data.get('B1', 5.0))
    K1 = float(data.get('K1', 2000.0))
    Vf = float(data.get('Vf', 0.02))
    Rh = float(data.get('Rh', 1.5))
    Tem = float(data.get('Tem', 2.0))
    A = float(data.get('A', 0.1))
    T = float(data.get('T', 0.001))

    # 1. Coeficientes Contínuos (Alphas e Betas)
    alpha5 = L * C * M1 * Rh * Vf
    alpha4 = L*C*M1 + L*C*B1*Rh*Vf + R*C*M1*Rh*Vf
    alpha3 = M1*Rh*Vf + R*C*M1 + R*C*B1*Rh*Vf + L*C*B1 + L*C*K1*Rh*Vf + L*(Tem**2)*Rh*Vf + L*C*(A**2)*Rh
    alpha2 = M1 + B1*Rh*Vf + R*C*B1 + R*C*K1*Rh*Vf + R*C*(A**2)*Rh + L*C*K1 + L*(Tem**2) + R*(Tem**2)*Rh*Vf
    alpha1 = B1 + K1*Rh*Vf + (A**2)*Rh + R*C*K1 + R*(Tem**2)
    alpha0 = K1

    beta1 = Tem * Vf * Rh
    beta0 = Tem

    # 2. Coeficientes Discretos (Transformada Z)
    B0 = (beta0 * (T**5)) + (beta1 * (T**4))
    B1 = -(beta1 * (T**4))
    numerador_z = [B0, B1]

    A0 = alpha5 + alpha4*T + alpha3*(T**2) + alpha2*(T**3) + alpha1*(T**4) + alpha0*(T**5)
    A1 = -5*alpha5 - 4*alpha4*T - 3*alpha3*(T**2) - 2*alpha2*(T**3) - alpha1*(T**4)
    A2 = 10*alpha5 + 6*alpha4*T + 3*alpha3*(T**2) + alpha2*(T**3)
    A3 = -10*alpha5 - 4*alpha4*T - alpha3*(T**2)
    A4 = 5*alpha5 + alpha4*T
    A5 = -alpha5
    denominador_z = [A0, A1, A2, A3, A4, A5]

    # 3. Encontrar Raízes
    zeros = np.roots(numerador_z)
    polos = np.roots(denominador_z)

    # Devolve o JSON formatado direto para o Plotly
    return jsonify({
        "zeros": [{"real": float(r.real), "imag": float(r.imag)} for r in zeros],
        "polos": [{"real": float(r.real), "imag": float(r.imag)} for r in polos]
    })