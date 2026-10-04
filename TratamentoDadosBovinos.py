# %%
import glob
import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def processar_bovinos():
    print("Iniciando processamento da Tabela 3939 (Bovinos)...")
    bovinos_pasta = '1_Dados_Recebidos/tabela3939'
    bovinos_arquivos = sorted(glob.glob(os.path.join(bovinos_pasta, '*.xlsx')))
    
    tabelas = []
    for arquivo in bovinos_arquivos:
        ano = int(os.path.basename(arquivo)[:4])
        # Consideramos dados de 2000 em diante para compatibilidade com censo e estimativas
        if ano >= 2000:
            df = pd.read_excel(arquivo, skiprows=4, na_values=["-", "..."])
            col0 = pd.to_numeric(df.iloc[:, 0], errors='coerce')
            bov_col = pd.to_numeric(df['Bovino'], errors='coerce').fillna(0)
            
            sub = pd.DataFrame({
                'CO_MUNICIPIO': col0,
                'BOVINO': bov_col,
                'ANO': ano
            })
            sub = sub.dropna(subset=['CO_MUNICIPIO'])
            sub = sub[sub['CO_MUNICIPIO'] >= 1000000]
            sub['CO_MUNICIPIO'] = sub['CO_MUNICIPIO'].astype('int64')
            sub['BOVINO'] = sub['BOVINO'].round(0).astype('int64')
            tabelas.append(sub)
            
    bovinos = pd.concat(tabelas, ignore_index=True)
    print(f"Bovinos reais carregados: anos {sorted(bovinos['ANO'].unique())}, total registros: {len(bovinos)}")

    # Salva dados tratados históricos reais
    os.makedirs("2_Dados_Tratados", exist_ok=True)
    os.makedirs("3_Dados_Processados", exist_ok=True)
    bovinos.to_csv("2_Dados_Tratados/bovinos.csv", index=False)

    # Salva dados tratados históricos reais (2000 a 2025)
    os.makedirs("2_Dados_Tratados", exist_ok=True)
    os.makedirs("3_Dados_Processados", exist_ok=True)
    bovinos.to_csv("2_Dados_Tratados/bovinos.csv", index=False)

    bovinos_completo = bovinos[bovinos['ANO'] <= 2025].sort_values(['CO_MUNICIPIO', 'ANO']).reset_index(drop=True)
    bovinos_completo.to_csv("3_Dados_Processados/bovinos.csv", index=False)
    print(f"Sucesso: bovinos.csv gravado em 3_Dados_Processados com anos {sorted(bovinos_completo['ANO'].unique())}")
    return bovinos_completo

if __name__ == "__main__":
    processar_bovinos()
