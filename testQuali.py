import requests
import pandas as pd

# Configuração da API
url = 'https://api.ajin.io/v3/loans?dueBalanceDate.gte=2025-03-01&dueBalanceDate.ite=2025-03-06'
headers = {
    'apiKey': 'SdRa+8+4JT5wPuMVRA4dyixG7C/p6okJrMQpgItUJIXYInjs2ikTlRmQGHD41ICt',
    'Content-Type': 'application/json'
}

# Fazendo a requisição GET
response = requests.get(url, headers=headers)

# Checando resposta
if response.status_code == 200:
    data = response.json()
    
    # Se a resposta for uma lista, normaliza diretamente
    if isinstance(data, list):
        df = pd.json_normalize(data)
    elif isinstance(data, dict) and 'items' in data:
        df = pd.json_normalize(data['items'])
    else:
        print("Formato de resposta inesperado.")
        exit()
    
    # Salva o DataFrame em CSV separado por ';'
    df.to_csv("dados_api.csv", sep=";", index=False, encoding='utf-8-sig')
    print("Dados salvos com sucesso em dados_api.csv")
else:
    print(f"Erro ao obter os dados: {response.status_code} - {response.text}")