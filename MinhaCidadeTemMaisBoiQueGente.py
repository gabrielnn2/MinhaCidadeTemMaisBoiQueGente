import streamlit as st
import pandas as pd
import numpy as np
import json
import pydeck as pdk
import plotly.express as px
import plotly.graph_objects as go
from TratamentoDadosBase import load_data

# ==========================================
# Configuração da Página
# ==========================================
st.set_page_config(
    page_title="Minha Cidade Tem Mais Boi Que Gente?",
    page_icon="🐂",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# Design System Minimalista (Minimal Dark Design)
# ==========================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #E2E8F0;
    }
    
    .stApp {
        background-color: #090D16;
    }
    
    /* Header Minimalista */
    .minimal-header {
        padding: 16px 0 20px 0;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .minimal-title {
        font-family: 'Outfit', sans-serif;
        font-size: 2.1rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #F8FAFC;
        margin: 0 0 4px 0;
    }
    .minimal-subtitle {
        color: #94A3B8;
        font-size: 0.92rem;
        font-weight: 400;
        line-height: 1.5;
    }
    
    /* Cards de Métrica Minimalistas */
    .metric-box {
        background: #101626;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 10px;
        padding: 16px 18px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .metric-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: #64748B;
        margin-bottom: 6px;
    }
    .metric-num {
        font-family: 'Outfit', sans-serif;
        font-size: 1.85rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #F8FAFC;
        margin-bottom: 2px;
    }
    .metric-sub {
        font-size: 0.78rem;
        color: #94A3B8;
    }
    
    /* Badges de Diagnóstico */
    .badge-minimal {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-amber {
        background: rgba(245, 158, 11, 0.12);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .badge-emerald {
        background: rgba(16, 185, 129, 0.12);
        color: #34D399;
        border: 1px solid rgba(16, 185, 129, 0.25);
    }

    /* Card do Inspetor */
    .inspector-card {
        background: #101626;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    .inspector-header {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #F8FAFC;
        margin-bottom: 3px;
    }
    .inspector-meta {
        font-size: 0.8rem;
        color: #64748B;
        margin-bottom: 12px;
    }
    
    /* Legenda de Mapa Minimalista */
    .map-legend {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 8px 12px;
        background: #101626;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        margin-bottom: 10px;
        font-size: 0.8rem;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .legend-color {
        width: 13px;
        height: 13px;
        border-radius: 3px;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# Carga dos Dados com Cache Otimizado
# ==========================================
@st.cache_data(show_spinner=False)
def get_cached_base():
    return load_data()

@st.cache_data(show_spinner=False)
def get_cached_polygons():
    # Carrega malha simplificada (Douglas-Peucker + quantização de coordenadas)
    with open("3_Dados_Processados/municipios_poligonos_simplificados.json", "r", encoding="utf-8") as f:
        geo = json.load(f)
    # Índice rápido de polígonos por código IBGE (int)
    feat_index = {}
    for feat in geo["features"]:
        try:
            cid = int(feat["properties"]["id"])
            feat_index[cid] = feat
        except (ValueError, KeyError):
            pass
    return geo, feat_index

with st.spinner("Inicializando dados IBGE e malha territorial simplificada..."):
    df_base = get_cached_base()
    geo_poligonos, index_poligonos = get_cached_polygons()

# Lista de anos
anos_disponiveis = sorted(df_base["ANO"].unique(), reverse=True)
ano_padrao = 2025 if 2025 in anos_disponiveis else anos_disponiveis[0]

# ==========================================
# Barra Lateral (Filtros)
# ==========================================
with st.sidebar:
    st.markdown("### Parâmetros")
    
    ano_selecionado = st.selectbox(
        "Ano de Referência",
        options=anos_disponiveis,
        index=anos_disponiveis.index(ano_padrao),
        help="2025 conta com dados consolidados da Pesquisa da Pecuária Municipal (PPM) e Estimativas IBGE."
    )
    
    regioes_disponiveis = ["Todas as Regiões"] + sorted([r for r in df_base["NM_REGIAO"].dropna().unique()])
    regiao_selecionada = st.selectbox("Região", regioes_disponiveis)
    
    if regiao_selecionada == "Todas as Regiões":
        ufs_disponiveis = ["Todas as UFs"] + sorted([u for u in df_base["SG_UF"].dropna().unique()])
    else:
        ufs_da_regiao = df_base[df_base["NM_REGIAO"] == regiao_selecionada]["SG_UF"].dropna().unique()
        ufs_disponiveis = ["Todas as UFs"] + sorted(list(ufs_da_regiao))
        
    uf_selecionada = st.selectbox("Estado (UF)", ufs_disponiveis)
    
    categoria_filtro = st.radio(
        "Classificação",
        options=["Todos os Municípios", "Apenas Mais Boi que Gente 🐂", "Apenas Mais Gente que Boi 👥"]
    )
    
    st.markdown("---")
    st.markdown("#### Fontes Oficiais")
    st.caption("""
    • **Rebanho Bovino**: IBGE PPM (Tabela 3939), 2000-2025 (e projeção 2026).  
    • **População Residente**: IBGE Censos (Tabela 202) e Estimativas (Tabela 6579), 2000-2026.  
    • **Polígonos**: Malha Municipal Simplificada com preservação topológica.
    """)

# ==========================================
# Filtragem dos Dados
# ==========================================
df_ano = df_base[df_base["ANO"] == ano_selecionado].copy()

# Filtros do recorte selecionado
df_filtrado = df_ano.copy()
if regiao_selecionada != "Todas as Regiões":
    df_filtrado = df_filtrado[df_filtrado["NM_REGIAO"] == regiao_selecionada]
if uf_selecionada != "Todas as UFs":
    df_filtrado = df_filtrado[df_filtrado["SG_UF"] == uf_selecionada]

if categoria_filtro == "Apenas Mais Boi que Gente 🐂":
    df_filtrado = df_filtrado[df_filtrado["MAIS_BOI"] == 1]
elif categoria_filtro == "Apenas Mais Gente que Boi 👥":
    df_filtrado = df_filtrado[df_filtrado["MAIS_BOI"] == 0]

# Métricas do Recorte
total_bov = int(df_filtrado["BOVINO"].sum())
total_pop = int(df_filtrado["POPULACAO"].sum())
saldo = total_bov - total_pop
razao_geral = (total_bov / total_pop) if total_pop > 0 else 0
total_mun = len(df_filtrado)
mun_mais_boi = int(df_filtrado["MAIS_BOI"].sum())
mun_mais_gente = total_mun - mun_mais_boi
pct_mais_boi = (mun_mais_boi / total_mun * 100) if total_mun > 0 else 0
pct_mais_gente = (mun_mais_gente / total_mun * 100) if total_mun > 0 else 0

def format_pt(num):
    return f"{num:,.0f}".replace(",", ".")

# ==========================================
# Cabeçalho Minimalista
# ==========================================
st.markdown(f"""
<div class="minimal-header">
    <div class="minimal-title">Minha Cidade Tem Mais Boi Que Gente?</div>
    <div class="minimal-subtitle">
        Diagnóstico territorial da proporção entre o rebanho bovino e a população residente no Brasil.
        <br>Ano de referência: <strong>{ano_selecionado}</strong> • Recorte ativo: <strong>{regiao_selecionada}</strong> • <strong>{uf_selecionada}</strong>
    </div>
</div>
""", unsafe_allow_html=True)

# ==========================================
# KPIs em Cards Minimalistas
# ==========================================
col_kpi1, col_kpi2, col_kpi3, col_kpi4, col_kpi5 = st.columns(5)

with col_kpi1:
    st.markdown(f"""
    <div class="metric-box">
        <div class="metric-label">Rebanho Bovino</div>
        <div class="metric-num">{format_pt(total_bov)}</div>
        <div class="metric-sub">cabeças de gado</div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi2:
    st.markdown(f"""
    <div class="metric-box">
        <div class="metric-label">População Residente</div>
        <div class="metric-num">{format_pt(total_pop)}</div>
        <div class="metric-sub">habitantes</div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi3:
    saldo_txt = f"+{format_pt(saldo)} bois" if saldo >= 0 else f"{format_pt(saldo)} bois"
    cor_razao = "#F59E0B" if saldo >= 0 else "#10B981"
    st.markdown(f"""
    <div class="metric-box">
        <div class="metric-label">Razão Boi / Habitante</div>
        <div class="metric-num" style="color: {cor_razao};">{razao_geral:.2f}</div>
        <div class="metric-sub">Saldo: {saldo_txt}</div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi4:
    st.markdown(f"""
    <div class="metric-box">
        <div class="metric-label">Mais Boi que Gente</div>
        <div class="metric-num" style="color: #F59E0B;">{mun_mais_boi}</div>
        <div class="metric-sub">{pct_mais_boi:.1f}% das cidades</div>
    </div>
    """, unsafe_allow_html=True)

with col_kpi5:
    st.markdown(f"""
    <div class="metric-box">
        <div class="metric-label">Mais Gente que Boi</div>
        <div class="metric-num" style="color: #10B981;">{mun_mais_gente}</div>
        <div class="metric-sub">{pct_mais_gente:.1f}% das cidades</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==========================================
# Abas de Navegação
# ==========================================
tab_mapa, tab_historico, tab_segmentacao, tab_dados = st.tabs([
    "🗺️ Mapa de Polígonos & Consulta",
    "📈 Crescimento Histórico",
    "📊 Segmentação por Região & UF",
    "📋 Tabela de Dados"
])

# ==========================================
# ABA 1: MAPA DE POLÍGONOS & CONSULTA MUNICIPAL
# ==========================================
with tab_mapa:
    col_mapa_area, col_consulta_area = st.columns([7, 5])
    
    with col_consulta_area:
        st.markdown("#### 🔍 Consulta & Diagnóstico")
        
        # Opções de Seleção: Brasil selecionado por padrão na inicialização
        OPCAO_BRASIL = "🇧🇷 Brasil"
        
        # Lista filtrada de cidades baseada na Região/UF ativa
        cidades_base_filtro = df_filtrado[["NM_MUNICIPIO", "SG_UF", "CO_MUNICIPIO"]].drop_duplicates()
        cidades_base_filtro["LABEL"] = cidades_base_filtro["NM_MUNICIPIO"] + " (" + cidades_base_filtro["SG_UF"] + ")"
        cidades_ordenadas = [OPCAO_BRASIL] + sorted(cidades_base_filtro["LABEL"].tolist())
        
        cidade_escolhida = st.selectbox(
            "Selecione uma cidade ou veja o agregado nacional:",
            options=cidades_ordenadas,
            index=0,
            help="Inicia por padrão com todos os municípios agregados no nível Brasil. Digite qualquer cidade para filtrar e dar zoom."
        )
        
        is_brasil_selecionado = (cidade_escolhida == OPCAO_BRASIL)
        
        # ========================================================
        # CASO 1: AGREGADO ESPECIAL DO BRASIL (PADRÃO NA INICIALIZAÇÃO)
        # ========================================================
        if is_brasil_selecionado:
            df_br_hist = df_base.groupby("ANO").agg(
                bovinos=("BOVINO", "sum"),
                populacao=("POPULACAO", "sum"),
                total_cidades=("CO_MUNICIPIO", "count"),
                cidades_mais_boi=("MAIS_BOI", "sum")
            ).reset_index()
            
            df_br_ano = df_br_hist[df_br_hist["ANO"] == ano_selecionado].iloc[0]
            br_bov = int(df_br_ano["bovinos"])
            br_pop = int(df_br_ano["populacao"])
            br_saldo = br_bov - br_pop
            br_razao = br_bov / br_pop
            br_cidades_boi = int(df_br_ano["cidades_mais_boi"])
            br_cidades_tot = int(df_br_ano["total_cidades"])
            br_pct_boi = (br_cidades_boi / br_cidades_tot * 100)
            
            if uf_selecionada != "Todas as UFs":
                recorte_titulo = f"{uf_selecionada}"
            elif regiao_selecionada != "Todas as Regiões":
                recorte_titulo = f"{regiao_selecionada}"
            else:
                recorte_titulo = "Brasil"

            badge_recorte_text = f"🐂 {recorte_titulo.upper()} TEM MAIS BOI QUE GENTE" if br_saldo >= 0 else f"👥 {recorte_titulo.upper()} TEM MAIS GENTE QUE BOI"
            badge_recorte_class = "badge-amber" if br_saldo >= 0 else "badge-emerald"

            st.markdown(f"""
            <div class="inspector-card">
                <div class="inspector-header">{recorte_titulo}</div>
                <div class="inspector-meta">5.570 municípios analisados • Ano de referência: {ano_selecionado}</div>
                <div style="margin-bottom: 14px;">
                    <span class="badge-minimal {badge_recorte_class}">
                        {badge_recorte_text}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Rebanho Bovino</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #FBBF24;">{format_pt(br_bov)}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">População Residente</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #34D399;">{format_pt(br_pop)}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Razão Nacional</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #F8FAFC;">{br_razao:.2f} {'boi por pessoa' if -2 < br_razao < 2 else 'bois por pessoa'}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Saldo Líquido</div>
                        <div style="font-size: 1.3rem; font-weight: 700; color: #FBBF24;">+{format_pt(br_saldo)}</div>
                    </div>
                </div>
                <div style="font-size: 0.83rem; color: #94A3B8; line-height: 1.4; padding: 10px; background: rgba(245, 158, 11, 0.05); border-left: 3px solid #F59E0B; border-radius: 4px;">
                    No ano de <strong>{ano_selecionado}</strong>, exatamente <strong>{br_cidades_boi} municípios</strong> (<strong>{br_pct_boi:.1f}%</strong> do Brasil) possuem mais cabeças de gado do que pessoas.
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Gráfico Histórico do Brasil
            st.markdown("##### 📈 Evolução Histórica Nacional (2000 a 2026)")
            fig_br_evol = go.Figure()
            fig_br_evol.add_trace(go.Scatter(
                x=df_br_hist["ANO"],
                y=df_br_hist["bovinos"],
                name="Bovinos (Cabeças)",
                mode="lines+markers",
                line=dict(color="#F59E0B", width=2.8),
                marker=dict(size=4)
            ))
            fig_br_evol.add_trace(go.Scatter(
                x=df_br_hist["ANO"],
                y=df_br_hist["populacao"],
                name="População (Hab.)",
                mode="lines+markers",
                line=dict(color="#10B981", width=2.8),
                marker=dict(size=4)
            ))
            fig_br_evol.update_layout(
                template="plotly_dark",
                paper_bgcolor="#101626",
                plot_bgcolor="#101626",
                height=220,
                margin={"l": 10, "r": 10, "t": 10, "b": 10},
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=11)),
                hovermode="x unified",
                xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)"),
                yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)")
            )
            st.plotly_chart(fig_br_evol, use_container_width=True)
            
            # Centro e zoom do mapa no modo Brasil / Recorte Geral
            if uf_selecionada != "Todas as UFs":
                centro_lat = float(df_filtrado["LATITUDE"].mean()) if len(df_filtrado) > 0 else -14.235
                centro_lon = float(df_filtrado["LONGITUDE"].mean()) if len(df_filtrado) > 0 else -51.925
                zoom_mapa = 5.8
            elif regiao_selecionada != "Todas as Regiões":
                centro_lat = float(df_filtrado["LATITUDE"].mean()) if len(df_filtrado) > 0 else -14.235
                centro_lon = float(df_filtrado["LONGITUDE"].mean()) if len(df_filtrado) > 0 else -51.925
                zoom_mapa = 4.4
            else:
                centro_lat = -14.235
                centro_lon = -51.925
                zoom_mapa = 3.5
            cod_cidade_focada = None

        # ========================================================
        # CASO 2: CIDADE ESPECÍFICA FILTRADA (ZOOM E FILTRO DIRETO)
        # ========================================================
        else:
            cod_selecionado = cidades_base_filtro[cidades_base_filtro["LABEL"] == cidade_escolhida]["CO_MUNICIPIO"].values[0]
            cod_cidade_focada = int(cod_selecionado)
            
            df_cid_hist = df_base[df_base["CO_MUNICIPIO"] == cod_selecionado].sort_values("ANO")
            df_cid_ano = df_cid_hist[df_cid_hist["ANO"] == ano_selecionado]
            
            if not df_cid_ano.empty:
                nome_cid = df_cid_ano["NM_MUNICIPIO"].values[0]
                uf_cid = df_cid_ano["SG_UF"].values[0]
                regiao_cid = df_cid_ano["NM_REGIAO"].values[0]
                cid_bov = int(df_cid_ano["BOVINO"].values[0])
                cid_pop = int(df_cid_ano["POPULACAO"].values[0])
                cid_razao = float(df_cid_ano["RAZAO"].values[0])
                cid_saldo = cid_bov - cid_pop
                cid_tem_mais_boi = cid_bov > cid_pop
                
                # Coordenadas da cidade para zoom dinâmico
                centro_lat = float(df_cid_ano["LATITUDE"].values[0])
                centro_lon = float(df_cid_ano["LONGITUDE"].values[0])
                zoom_mapa = 9.8  # Zoom detalhado no município!
                
                badge_class = "badge-amber" if cid_tem_mais_boi else "badge-emerald"
                badge_text = "🐂 SIM! Esta cidade tem MAIS BOI QUE GENTE" if cid_tem_mais_boi else "👥 NÃO! Esta cidade tem MAIS GENTE QUE BOI"
                
                st.markdown(f"""
                <div class="inspector-card">
                    <div class="inspector-header">📍 {nome_cid} - {uf_cid}</div>
                    <div class="inspector-meta">Região {regiao_cid} • Código IBGE: {cod_selecionado} • Ano {ano_selecionado}</div>
                    <div style="margin-bottom: 14px;">
                        <span class="badge-minimal {badge_class}">{badge_text}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                            <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Rebanho Bovino</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #FBBF24;">{format_pt(cid_bov)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                            <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">População Residente</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #34D399;">{format_pt(cid_pop)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                            <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Razão Boi/Pessoa</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #F8FAFC;">{cid_razao:.2f} {'boi por pessoa' if -2 < cid_razao < 2 else 'bois por pessoa'}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
                            <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase;">Saldo Líquido</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: {'#FBBF24' if cid_saldo >= 0 else '#34D399'};">
                                {cid_saldo:+,.0f}
                            </div>
                        </div>
                    </div>
                </div>
                """.replace(",", "."), unsafe_allow_html=True)
                
                # Gráfico Histórico da Cidade
                st.markdown(f"##### 📈 Evolução Histórica de {nome_cid}")
                fig_cid = go.Figure()
                fig_cid.add_trace(go.Scatter(
                    x=df_cid_hist["ANO"],
                    y=df_cid_hist["BOVINO"],
                    name="Bovinos (Cabeças)",
                    mode="lines+markers",
                    line=dict(color="#F59E0B", width=2.8),
                    marker=dict(size=4)
                ))
                fig_cid.add_trace(go.Scatter(
                    x=df_cid_hist["ANO"],
                    y=df_cid_hist["POPULACAO"],
                    name="População (Hab.)",
                    mode="lines+markers",
                    line=dict(color="#10B981", width=2.8),
                    marker=dict(size=4)
                ))
                fig_cid.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="#101626",
                    plot_bgcolor="#101626",
                    height=220,
                    margin={"l": 10, "r": 10, "t": 10, "b": 10},
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=11)),
                    hovermode="x unified",
                    xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)"),
                    yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)")
                )
                st.plotly_chart(fig_cid, use_container_width=True)

    with col_mapa_area:
        st.markdown(f"#### 🗺️ Malha de Polígonos Municipais ({ano_selecionado})")
        
        # Barra de Legenda Minimalista
        st.markdown("""
        <div class="map-legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #F59E0B;"></div>
                <span><strong>Mais Boi que Gente</strong> (Rebanho > População)</span>
            </div>
            <div class="legend-item" style="margin-left: 12px;">
                <div class="legend-color" style="background: #10B981;"></div>
                <span><strong>Mais Gente que Boi</strong> (População ≥ Rebanho)</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # ========================================================
        # FILTRAGEM EFICIENTE DOS POLÍGONOS (REDUÇÃO DE PAYLOAD)
        # ========================================================
        # Se uma cidade específica for selecionada: carrega APENAS o polígono daquela cidade!
        # Isso reduz o payload do mapa de 5MB para ~2KB e garante zoom instantâneo!
        dados_mapa = df_ano.set_index("CO_MUNICIPIO")
        
        if cod_cidade_focada is not None:
            # Apenas 1 polígono no mapa (zoom e foco exclusivo na cidade)
            cids_a_renderizar = [cod_cidade_focada] if cod_cidade_focada in index_poligonos else []
        else:
            # Cidades do recorte ativo (UF, Região ou Brasil)
            cids_a_renderizar = [cid for cid in df_filtrado["CO_MUNICIPIO"] if cid in index_poligonos]

        features_filtradas = []
        for cid in cids_a_renderizar:
            feat = index_poligonos[cid]
            row = dados_mapa.loc[cid]
            cor = [245, 158, 11, 220] if row["MAIS_BOI"] == 1 else [16, 185, 129, 220]
            
            features_filtradas.append({
                "type": feat["type"],
                "geometry": feat["geometry"],
                "properties": {
                    "name": feat["properties"]["name"],
                    "uf": row["SG_UF"],
                    "status": row["CATEGORIA"],
                    "bovino_fmt": format_pt(int(row["BOVINO"])),
                    "pop_fmt": format_pt(int(row["POPULACAO"])),
                    "razao_fmt": f"{row['RAZAO']:.2f}",
                    "razao_sufixo": "boi por pessoa" if (-2 < float(row['RAZAO']) < 2) else "bois por pessoa",
                    "fill_color": cor
                }
            })
            
        geojson_render = {
            "type": "FeatureCollection",
            "features": features_filtradas
        }
        
        # Renderização com PyDeck WebGL de alta eficiência
        polygon_layer = pdk.Layer(
            "GeoJsonLayer",
            geojson_render,
            opacity=0.9,
            stroked=True,
            filled=True,
            get_fill_color="properties.fill_color",
            get_line_color=[15, 23, 42, 140] if cod_cidade_focada is None else [255, 255, 255, 200],
            get_line_width=180 if cod_cidade_focada is None else 60,
            pickable=True,
            auto_highlight=True
        )
        
        view_state = pdk.ViewState(
            latitude=centro_lat,
            longitude=centro_lon,
            zoom=zoom_mapa,
            pitch=0
        )
        
        deck = pdk.Deck(
            layers=[polygon_layer],
            initial_view_state=view_state,
            tooltip={
                "html": """
                <div style="background: #0F172A; color: #F8FAFC; padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); font-family: sans-serif; font-size: 13px;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">{name} ({uf})</div>
                    <div style="color: #94A3B8; margin-bottom: 6px;">{status}</div>
                    <div>🐂 <strong>Bovinos:</strong> {bovino_fmt} cabeças</div>
                    <div>👥 <strong>População:</strong> {pop_fmt} hab.</div>
                    <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1); color: #FBBF24;">
                        ⚖️ <strong>Razão:</strong> {razao_fmt} {razao_sufixo}
                    </div>
                </div>
                """
            },
            map_style="dark"
        )
        st.pydeck_chart(deck, height=560)
        
        if cod_cidade_focada is not None:
            st.caption(f"🎯 *Exibindo o polígono isolado com zoom focado em {cidade_escolhida}. Para voltar à visão geral de todas as cidades, selecione 'Brasil' na busca ao lado.*")

# ==========================================
# ABA 2: CRESCIMENTO HISTÓRICO
# ==========================================
with tab_historico:
    st.markdown("#### 📈 Crescimento Histórico: Bovinos vs População (2000 a 2026)")
    st.caption(f"Dados agregados para o recorte: {regiao_selecionada} • {uf_selecionada}")
    
    df_hist_filtro = df_base.copy()
    if regiao_selecionada != "Todas as Regiões":
        df_hist_filtro = df_hist_filtro[df_hist_filtro["NM_REGIAO"] == regiao_selecionada]
    if uf_selecionada != "Todas as UFs":
        df_hist_filtro = df_hist_filtro[df_hist_filtro["SG_UF"] == uf_selecionada]
        
    df_serie = df_hist_filtro.groupby("ANO").agg(
        bovinos=("BOVINO", "sum"),
        populacao=("POPULACAO", "sum"),
        total_mun=("CO_MUNICIPIO", "count"),
        mun_boi=("MAIS_BOI", "sum")
    ).reset_index()
    
    df_serie["mun_gente"] = df_serie["total_mun"] - df_serie["mun_boi"]
    df_serie["pct_boi"] = (df_serie["mun_boi"] / df_serie["total_mun"] * 100).round(1)
    df_serie["razao"] = (df_serie["bovinos"] / df_serie["populacao"]).round(2)
    
    bov_00 = df_serie[df_serie["ANO"] == 2000]["bovinos"].values[0]
    pop_00 = df_serie[df_serie["ANO"] == 2000]["populacao"].values[0]
    df_serie["bov_base100"] = (df_serie["bovinos"] / bov_00 * 100).round(1)
    df_serie["pop_base100"] = (df_serie["populacao"] / pop_00 * 100).round(1)
    
    c_hist1, c_hist2 = st.columns(2)
    
    with c_hist1:
        st.markdown("##### 1. Trajetória Absoluta de Volumes")
        fig_vol = go.Figure()
        fig_vol.add_trace(go.Scatter(
            x=df_serie["ANO"],
            y=df_serie["bovinos"],
            name="Rebanho Bovino",
            mode="lines+markers",
            line=dict(color="#F59E0B", width=3),
            fill="tozeroy",
            fillcolor="rgba(245, 158, 11, 0.05)"
        ))
        fig_vol.add_trace(go.Scatter(
            x=df_serie["ANO"],
            y=df_serie["populacao"],
            name="População",
            mode="lines+markers",
            line=dict(color="#10B981", width=3),
            fill="tozeroy",
            fillcolor="rgba(16, 185, 129, 0.05)"
        ))
        fig_vol.update_layout(
            template="plotly_dark",
            paper_bgcolor="#101626",
            plot_bgcolor="#101626",
            height=330,
            margin={"l": 20, "r": 20, "t": 20, "b": 20},
            hovermode="x unified",
            xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)"),
            yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)", title="Total de Indivíduos")
        )
        st.plotly_chart(fig_vol, use_container_width=True)
        
    with c_hist2:
        st.markdown("##### 2. Velocidade de Crescimento Relativo (Base 100 = Ano 2000)")
        fig_idx = go.Figure()
        fig_idx.add_trace(go.Scatter(
            x=df_serie["ANO"],
            y=df_serie["bov_base100"],
            name="Bovinos (% vs 2000)",
            mode="lines+markers",
            line=dict(color="#F59E0B", width=2.5)
        ))
        fig_idx.add_trace(go.Scatter(
            x=df_serie["ANO"],
            y=df_serie["pop_base100"],
            name="População (% vs 2000)",
            mode="lines+markers",
            line=dict(color="#10B981", width=2.5)
        ))
        fig_idx.update_layout(
            template="plotly_dark",
            paper_bgcolor="#101626",
            plot_bgcolor="#101626",
            height=330,
            margin={"l": 20, "r": 20, "t": 20, "b": 20},
            hovermode="x unified",
            xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)"),
            yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)", title="Índice Base 100")
        )
        st.plotly_chart(fig_idx, use_container_width=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("##### 3. Divisão de Municípios: Mais Boi vs Mais Gente ao Longo do Tempo")
    
    fig_barras = go.Figure()
    fig_barras.add_trace(go.Bar(
        x=df_serie["ANO"],
        y=df_serie["mun_boi"],
        name="Cidades c/ Mais Boi",
        marker_color="#F59E0B"
    ))
    fig_barras.add_trace(go.Bar(
        x=df_serie["ANO"],
        y=df_serie["mun_gente"],
        name="Cidades c/ Mais Gente",
        marker_color="#10B981"
    ))
    fig_barras.update_layout(
        template="plotly_dark",
        paper_bgcolor="#101626",
        plot_bgcolor="#101626",
        barmode="stack",
        height=300,
        margin={"l": 20, "r": 20, "t": 20, "b": 20},
        hovermode="x unified",
        xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)"),
        yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.05)", title="Número de Municípios")
    )
    st.plotly_chart(fig_barras, use_container_width=True)

# ==========================================
# ABA 3: SEGMENTAÇÃO POR REGIÃO & UF
# ==========================================
with tab_segmentacao:
    st.markdown(f"#### 📊 Segmentação Regional e Estadual ({ano_selecionado})")
    
    # Panorama Regional
    st.markdown("##### Panorama por Grande Região")
    df_reg = df_ano.groupby("NM_REGIAO").agg(
        bov=("BOVINO", "sum"),
        pop=("POPULACAO", "sum"),
        cidades=("CO_MUNICIPIO", "count"),
        cidades_boi=("MAIS_BOI", "sum")
    ).reset_index()
    df_reg["cidades_gente"] = df_reg["cidades"] - df_reg["cidades_boi"]
    df_reg["pct_boi"] = (df_reg["cidades_boi"] / df_reg["cidades"] * 100).round(1)
    df_reg["razao"] = (df_reg["bov"] / df_reg["pop"]).round(2)
    
    col_r1, col_r2 = st.columns(2)
    with col_r1:
        fig_reg_pct = px.bar(
            df_reg.sort_values("pct_boi", ascending=True),
            x="pct_boi",
            y="NM_REGIAO",
            orientation="h",
            color="pct_boi",
            color_continuous_scale="Viridis",
            text="pct_boi",
            title="% dos Municípios com Mais Boi por Região"
        )
        fig_reg_pct.update_layout(
            template="plotly_dark",
            paper_bgcolor="#101626",
            plot_bgcolor="#101626",
            height=280,
            margin={"l": 10, "r": 20, "t": 35, "b": 10},
            xaxis_title="%",
            yaxis_title=""
        )
        fig_reg_pct.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        st.plotly_chart(fig_reg_pct, use_container_width=True)
        
    with col_r2:
        fig_reg_vol = px.bar(
            df_reg.sort_values("bov", ascending=False),
            x="NM_REGIAO",
            y=["bov", "pop"],
            barmode="group",
            color_discrete_map={"bov": "#F59E0B", "pop": "#10B981"},
            labels={"value": "Total", "variable": "Tipo", "NM_REGIAO": "Região"},
            title="Bovinos vs População por Região"
        )
        fig_reg_vol.update_layout(
            template="plotly_dark",
            paper_bgcolor="#101626",
            plot_bgcolor="#101626",
            height=280,
            margin={"l": 10, "r": 10, "t": 35, "b": 10},
            yaxis_title=""
        )
        st.plotly_chart(fig_reg_vol, use_container_width=True)

    st.markdown("---")
    
    # Ranking por Estado
    st.markdown("##### Ranking Estadual por Densidade de Rebanho (Bois por Pessoa)")
    df_uf_agg = df_ano.groupby(["SG_UF", "NM_UF", "NM_REGIAO"]).agg(
        bov=("BOVINO", "sum"),
        pop=("POPULACAO", "sum"),
        cidades=("CO_MUNICIPIO", "count"),
        cidades_boi=("MAIS_BOI", "sum")
    ).reset_index()
    df_uf_agg["razao"] = (df_uf_agg["bov"] / df_uf_agg["pop"]).round(2)
    df_uf_agg["pct_boi"] = (df_uf_agg["cidades_boi"] / df_uf_agg["cidades"] * 100).round(1)
    
    fig_uf_bar = px.bar(
        df_uf_agg.sort_values("razao", ascending=False),
        x="SG_UF",
        y="razao",
        color="NM_REGIAO",
        text="razao",
        title="Cabeças de Gado Bovino por Habitante por UF"
    )
    fig_uf_bar.update_layout(
        template="plotly_dark",
        paper_bgcolor="#101626",
        plot_bgcolor="#101626",
        height=320,
        margin={"l": 10, "r": 10, "t": 35, "b": 10},
        xaxis_title="UF",
        yaxis_title="Bois por Pessoa"
    )
    fig_uf_bar.update_traces(texttemplate="%{text:.2f}", textposition="outside")
    st.plotly_chart(fig_uf_bar, use_container_width=True)

    # Tabelas Top 10
    col_t1, col_t2 = st.columns(2)
    with col_t1:
        st.markdown(f"##### 🏆 Top 10 Maiores Rebanhos Bovinos ({ano_selecionado})")
        top_bov = df_ano.nlargest(10, "BOVINO")[["NM_MUNICIPIO", "SG_UF", "BOVINO", "POPULACAO", "RAZAO"]]
        top_bov.columns = ["Município", "UF", "Rebanho Bovino", "População", "Bois/Pessoa"]
        st.dataframe(
            top_bov.style.format({
                "Rebanho Bovino": "{:,.0f}",
                "População": "{:,.0f}",
                "Bois/Pessoa": "{:.2f}"
            }),
            use_container_width=True,
            hide_index=True
        )
        
    with col_t2:
        st.markdown(f"##### 🚀 Top 10 Cidades com Mais Boi por Habitante ({ano_selecionado})")
        top_rz = df_ano[df_ano["POPULACAO"] >= 1000].nlargest(10, "RAZAO")[["NM_MUNICIPIO", "SG_UF", "RAZAO", "BOVINO", "POPULACAO"]]
        top_rz.columns = ["Município", "UF", "Bois/Pessoa", "Rebanho Bovino", "População"]
        st.dataframe(
            top_rz.style.format({
                "Bois/Pessoa": "{:.2f}",
                "Rebanho Bovino": "{:,.0f}",
                "População": "{:,.0f}"
            }),
            use_container_width=True,
            hide_index=True
        )

# ==========================================
# ABA 4: EXPLORADOR DE DADOS
# ==========================================
with tab_dados:
    st.markdown(f"#### 📋 Tabela Completa de Municípios ({ano_selecionado})")
    st.caption("Consulte e baixe os dados do recorte ativo.")
    
    df_view = df_ano[[
        "CO_MUNICIPIO", "NM_MUNICIPIO", "SG_UF", "NM_REGIAO",
        "BOVINO", "POPULACAO", "RAZAO", "DIFERENCA", "CATEGORIA"
    ]].sort_values("BOVINO", ascending=False)
    
    df_view.columns = [
        "Cód. IBGE", "Município", "UF", "Região",
        "Bovinos", "População", "Razão (Bois/Pessoa)", "Saldo Líquido", "Diagnóstico"
    ]
    
    st.dataframe(
        df_view.style.format({
            "Bovinos": "{:,.0f}",
            "População": "{:,.0f}",
            "Razão (Bois/Pessoa)": "{:.2f}",
            "Saldo Líquido": "{:+,.0f}"
        }),
        use_container_width=True,
        hide_index=True,
        height=480
    )
    
    csv_bytes = df_view.to_csv(index=False, sep=";").encode("utf-8-sig")
    st.download_button(
        label="📥 Exportar Dados Filtrados em CSV",
        data=csv_bytes,
        file_name=f"boi_que_gente_{ano_selecionado}_{uf_selecionada}.csv",
        mime="text/csv"
    )