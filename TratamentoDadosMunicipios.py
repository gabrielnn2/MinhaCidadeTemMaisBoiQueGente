# %%
import pandas as pd

# Mapeamento oficial de UF, Sigla e Região do Brasil
UF_INFO = {
    11: ('Rondônia', 'RO', 1, 'Norte'),
    12: ('Acre', 'AC', 1, 'Norte'),
    13: ('Amazonas', 'AM', 1, 'Norte'),
    14: ('Roraima', 'RR', 1, 'Norte'),
    15: ('Pará', 'PA', 1, 'Norte'),
    16: ('Amapá', 'AP', 1, 'Norte'),
    17: ('Tocantins', 'TO', 1, 'Norte'),
    21: ('Maranhão', 'MA', 2, 'Nordeste'),
    22: ('Piauí', 'PI', 2, 'Nordeste'),
    23: ('Ceará', 'CE', 2, 'Nordeste'),
    24: ('Rio Grande do Norte', 'RN', 2, 'Nordeste'),
    25: ('Paraíba', 'PB', 2, 'Nordeste'),
    26: ('Pernambuco', 'PE', 2, 'Nordeste'),
    27: ('Alagoas', 'AL', 2, 'Nordeste'),
    28: ('Sergipe', 'SE', 2, 'Nordeste'),
    29: ('Bahia', 'BA', 2, 'Nordeste'),
    31: ('Minas Gerais', 'MG', 3, 'Sudeste'),
    32: ('Espírito Santo', 'ES', 3, 'Sudeste'),
    33: ('Rio de Janeiro', 'RJ', 3, 'Sudeste'),
    35: ('São Paulo', 'SP', 3, 'Sudeste'),
    41: ('Paraná', 'PR', 4, 'Sul'),
    42: ('Santa Catarina', 'SC', 4, 'Sul'),
    43: ('Rio Grande do Sul', 'RS', 4, 'Sul'),
    50: ('Mato Grosso do Sul', 'MS', 5, 'Centro-Oeste'),
    51: ('Mato Grosso', 'MT', 5, 'Centro-Oeste'),
    52: ('Goiás', 'GO', 5, 'Centro-Oeste'),
    53: ('Distrito Federal', 'DF', 5, 'Centro-Oeste')
}

def processar_municipios():
    print("Processando base de municípios e coordenadas...")
    coords = pd.read_csv("3_Dados_Processados/municipios_coords.csv", encoding="utf-8")
    
    # Criar DataFrame estruturado
    dados = []
    for _, row in coords.iterrows():
        cod_mun = int(row['codigo_ibge'])
        cod_uf = int(row['codigo_uf'])
        nome_mun = str(row['nome']).strip()
        lat = float(row['latitude'])
        lon = float(row['longitude'])
        
        uf_nome, uf_sigla, cod_reg, nome_reg = UF_INFO.get(cod_uf, ("Outro", "BR", 0, "Outro"))
        dados.append({
            'CO_MUNICIPIO': cod_mun,
            'NM_MUNICIPIO': nome_mun,
            'CO_UF': cod_uf,
            'SG_UF': uf_sigla,
            'NM_UF': uf_nome,
            'CO_REGIAO': cod_reg,
            'NM_REGIAO': nome_reg,
            'LATITUDE': lat,
            'LONGITUDE': lon
        })
        
    df_mun = pd.DataFrame(dados)
    df_mun = df_mun.sort_values(['SG_UF', 'NM_MUNICIPIO']).reset_index(drop=True)
    df_mun.to_csv("3_Dados_Processados/municipios.csv", index=False, encoding="utf-8")
    print(f"Sucesso: {len(df_mun)} municípios processados com coordenadas e UFs.")
    return df_mun

if __name__ == "__main__":
    processar_municipios()