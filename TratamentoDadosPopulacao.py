# %%
import glob
import os
import pandas as pd
import numpy as np

def processar_populacao():
    print("Iniciando processamento da Tabela 6579 (Estimativas) e Tabela 202 (Censos)...")
    
    # 1. Tabela 6579 (Estimativas de População)
    pop6579_pasta = '1_Dados_Recebidos/tabela6579'
    pop6579_arquivos = sorted(glob.glob(os.path.join(pop6579_pasta, '*.xlsx')))
    
    tabelas_6579 = []
    for arquivo in pop6579_arquivos:
        ano = int(os.path.basename(arquivo)[:4])
        df = pd.read_excel(arquivo, skiprows=3, na_values=["-", "..."])
        col_cod = pd.to_numeric(df.iloc[:, 0], errors='coerce')
        col_pop = pd.to_numeric(df.iloc[:, 2], errors='coerce')
        
        sub = pd.DataFrame({
            'CO_MUNICIPIO': col_cod,
            'POPULACAO': col_pop,
            'ANO': ano
        })
        sub = sub.dropna(subset=['CO_MUNICIPIO', 'POPULACAO'])
        sub = sub[sub['CO_MUNICIPIO'] >= 1000000]
        sub['CO_MUNICIPIO'] = sub['CO_MUNICIPIO'].astype('int64')
        tabelas_6579.append(sub)
        
    df_6579 = pd.concat(tabelas_6579, ignore_index=True)
    print(f"Estimativas Tabela 6579 carregadas: anos {sorted(df_6579['ANO'].unique())}")

    # 2. Tabela 202 (Censos Demográficos 2000 e 2010)
    pop202_pasta = '1_Dados_Recebidos/tabela202'
    pop202_arquivos = sorted(glob.glob(os.path.join(pop202_pasta, '*.xlsx')))
    
    tabelas_202 = []
    for arquivo in pop202_arquivos:
        ano = int(os.path.basename(arquivo)[:4])
        if ano in [2000, 2010]:
            df = pd.read_excel(arquivo, skiprows=4, na_values=["-", "..."])
            col_cod = pd.to_numeric(df.iloc[:, 0], errors='coerce')
            col_pop = pd.to_numeric(df.iloc[:, 3], errors='coerce')  # coluna 3: Total População
            
            sub = pd.DataFrame({
                'CO_MUNICIPIO': col_cod,
                'POPULACAO': col_pop,
                'ANO': ano
            })
            sub = sub.dropna(subset=['CO_MUNICIPIO', 'POPULACAO'])
            sub = sub[sub['CO_MUNICIPIO'] >= 1000000]
            sub['CO_MUNICIPIO'] = sub['CO_MUNICIPIO'].astype('int64')
            tabelas_202.append(sub)
            
    df_202 = pd.concat(tabelas_202, ignore_index=True)
    print(f"Censos Tabela 202 carregados: anos {sorted(df_202['ANO'].unique())}")

    # Combinar Censos e Estimativas
    pop = pd.concat([df_202, df_6579], ignore_index=True)
    pop = pop[pop['ANO'] >= 2000]
    
    # Salvar dados brutos compilados
    os.makedirs("2_Dados_Tratados", exist_ok=True)
    os.makedirs("3_Dados_Processados", exist_ok=True)
    pop.to_csv("2_Dados_Tratados/populacao.csv", index=False)

    # Matriz para interpolação dos anos sem estimativa oficial municipal publicada
    pop_wide = pop.pivot(index='CO_MUNICIPIO', columns='ANO', values='POPULACAO')

    # Interpolação para 2007 (ano da Contagem da População sem tabela 6579)
    if 2006 in pop_wide.columns and 2008 in pop_wide.columns:
        pop_wide[2007] = np.where(
            pop_wide[2006].notna() & pop_wide[2008].notna(),
            np.ceil((pop_wide[2006] + pop_wide[2008]) / 2),
            np.nan
        )

    # Interpolação para 2022 e 2023 (entre a estimativa de 2021 e a de 2024 pós-censo)
    if 2021 in pop_wide.columns and 2024 in pop_wide.columns:
        step = (pop_wide[2024] - pop_wide[2021]) / 3.0
        pop_wide[2022] = np.ceil(pop_wide[2021] + step)
        pop_wide[2023] = np.ceil(pop_wide[2021] + 2.0 * step)

    # Transformar de volta para formato longo
    pop_long = pop_wide.reset_index().melt(
        id_vars='CO_MUNICIPIO',
        var_name='ANO',
        value_name='POPULACAO'
    )
    pop_long['ANO'] = pop_long['ANO'].astype(int)
    pop_long['POPULACAO'] = pop_long['POPULACAO'].round(0).astype('Int64')
    pop_long = pop_long[pop_long['ANO'] <= 2025].sort_values(['CO_MUNICIPIO', 'ANO']).reset_index(drop=True)

    pop_long.to_csv("3_Dados_Processados/populacao.csv", index=False)
    print(f"Sucesso: populacao.csv gravado em 3_Dados_Processados com anos {sorted(pop_long['ANO'].unique())}")
    return pop_long

if __name__ == "__main__":
    processar_populacao()