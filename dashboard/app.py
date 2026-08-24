"""
dashboard/app.py

APIx Streamlit Dashboard — Phase 5

Panels (all mandatory per blueprint):
    1. Header + current index value
    2. APIx trend line (daily + weekly) — dashed line / badge for estimated data
    3. Route-pair fare heatmap
    4. Lead-time elasticity curve (fare vs. days-to-departure)
    5. Methodology panel — DGCA route weights + cross-source validation stats
    6. What this means panel — plain-English auto-generated sentence

Design principles:
    - Light palette: soft white (#F8FAFC) + sky blue (#0EA5E9) + warm grey (#64748B)
    - Rounded cards, friendly captions — not a trading terminal
    - Estimated data is ALWAYS visually distinct: dashed lines, orange color, badge
    - Methodology panel is not a footnote — it answers Why should we trust this?
    - What this means panel answers What can government actually do with this?

Run: streamlit run dashboard/app.py
"""

import os
import sys
from pathlib import Path
from datetime import date, timedelta

# `streamlit run dashboard/app.py` puts dashboard/ on sys.path, not the repo
# root, so the `src` package can't be found without this.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from dotenv import load_dotenv
import psycopg2

from src.index_engine.weights import ROUTE_WEIGHTS, DGCA_PAX_MILLIONS
from src.index_engine.compute_index import load_clean_fares, compute_daily_index, compute_weekly_index
from src.validation.cross_source_check import get_validation_summary

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# ─── PAGE CONFIG ──────────────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="APIx — India Airfare Index",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── COLOUR PALETTE ───────────────────────────────────────────────────────────────────────────
COLOR_REAL = "#0EA5E9"       # sky blue — real data
COLOR_ESTIMATED = "#F59E0B"  # amber — synthetic / estimated data
COLOR_BG = "#F8FAFC"         # near-white background
COLOR_TEXT = "#1E293B"       # dark slate
COLOR_MUTED = "#64748B"      # warm grey

# ─── CUSTOM CSS ──────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #F8FAFC; }
    .block-container { padding-top: 2rem; max-width: 1100px; }
    .metric-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        border-left: 4px solid #0EA5E9;
    }
    .estimated-badge {
        background: #FEF3C7;
        color: #92400E;
        border-radius: 6px;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .section-header { color: #1E293B; font-size: 1.1rem; font-weight: 700; margin-top: 1rem; }
    .caption-text { color: #64748B; font-size: 0.85rem; line-height: 1.4; }
</style>
""", unsafe_allow_html=True)


# ─── DATA LOADING ──────────────────────────────────────────────────────────────────────────────
@st.cache_data(ttl=300)
def load_data():
    try:
        df = load_clean_fares()
        daily = compute_daily_index(df)
        weekly = compute_weekly_index(daily)
        validation = get_validation_summary()
        return df, daily, weekly, validation, None
    except Exception as e:
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), [], str(e)


df, daily_df, weekly_df, validation_stats, error = load_data()


# ─── HEADER ──────────────────────────────────────────────────────────────────────────────────
st.markdown("## ✈️ AeroIndex — India Airfare Price Index")
st.markdown(
    "<p class='caption-text'>A real-time index tracking what domestic flights actually cost, "
    "built for India's Ministry of Statistics (MoSPI) and RBI — not a flight-deal app.</p>",
    unsafe_allow_html=True
)

if error:
    st.error(f"Could not load data: {error}. Run the ingestion pipeline first.")
    st.info(
        "Tip: run `python src/db/init_db.py` to create the tables, "
        "then `python -m src.ingestion.run_all` to populate them."
    )
    st.stop()

if daily_df.empty:
    st.warning("No index data yet — run the ingestion pipeline first.")
    st.stop()


# ─── TOP METRICS ──────────────────────────────────────────────────────────────────────────────
latest = daily_df.iloc[-1]
prev = daily_df.iloc[-2] if len(daily_df) > 1 else latest
change_pct = ((latest["apix_value"] - prev["apix_value"]) / prev["apix_value"] * 100)

col1, col2, col3 = st.columns(3)
with col1:
    st.markdown(
        f"<div class='metric-card'>"
        f"<div style='color:#64748B;font-size:0.85rem'>Current APIx Value</div>"
        f"<div style='font-size:2.2rem;font-weight:800;color:#0EA5E9'>{latest['apix_value']:.1f}</div>"
        f"<div style='color:#64748B;font-size:0.8rem'>Base = 100 | {daily_df.iloc[0]['date'].date()}</div>"
        f"{'<span class=estimated-badge>includes estimates</span>' if latest['is_estimated'] else ''}"
        f"</div>",
        unsafe_allow_html=True
    )
with col2:
    arrow = "↑" if change_pct > 0 else "↓"
    color = "#EF4444" if change_pct > 0 else "#22C55E"
    st.markdown(
        f"<div class='metric-card'>"
        f"<div style='color:#64748B;font-size:0.85rem'>Day-on-Day Change</div>"
        f"<div style='font-size:2.2rem;font-weight:800;color:{color}'>{arrow} {abs(change_pct):.1f}%</div>"
        f"<div style='color:#64748B;font-size:0.8rem'>vs previous observation</div>"
        f"</div>",
        unsafe_allow_html=True
    )
with col3:
    n_real = (df["source_name"] != "synthetic_estimate").sum()
    n_synth = (df["source_name"] == "synthetic_estimate").sum()
    st.markdown(
        f"<div class='metric-card'>"
        f"<div style='color:#64748B;font-size:0.85rem'>Data Coverage</div>"
        f"<div style='font-size:1.4rem;font-weight:700;color:#1E293B'>{n_real} real  •  {n_synth} estimated</div>"
        f"<div style='color:#64748B;font-size:0.8rem'>Estimated = synthetic gap-filler, always labelled</div>"
        f"</div>",
        unsafe_allow_html=True
    )

st.markdown("---")


# ─── PANEL 1: TREND LINE ─────────────────────────────────────────────────────────────────────────
st.markdown("<div class='section-header'>Here's how airfare costs have moved</div>",
            unsafe_allow_html=True)
st.caption(
    "Real data = solid sky-blue line. Estimated (synthetic gap-filler) = dashed amber line. "
    "Never blended silently."
)

fig = go.Figure()

# Split real vs estimated segments
real_mask = ~daily_df["is_estimated"]
est_mask = daily_df["is_estimated"]

if real_mask.any():
    fig.add_trace(go.Scatter(
        x=daily_df.loc[real_mask, "date"],
        y=daily_df.loc[real_mask, "apix_value"],
        mode="lines+markers",
        name="Real data",
        line={"color": COLOR_REAL, "width": 3},
        marker={"size": 6},
    ))

if est_mask.any():
    fig.add_trace(go.Scatter(
        x=daily_df.loc[est_mask, "date"],
        y=daily_df.loc[est_mask, "apix_value"],
        mode="lines+markers",
        name="Estimated (synthetic gap-filler)",
        line={"color": COLOR_ESTIMATED, "width": 2, "dash": "dash"},
        marker={"size": 6, "symbol": "diamond"},
    ))

fig.update_layout(
    plot_bgcolor="white", paper_bgcolor="white",
    xaxis_title="Date", yaxis_title="APIx (Base = 100)",
    legend={"orientation": "h", "y": -0.15},
    margin={"t": 20, "b": 20},
    height=320,
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("---")


# ─── PANEL 2: FARE HEATMAP ────────────────────────────────────────────────────────────────────────────
st.markdown("<div class='section-header'>How fares compare across routes</div>",
            unsafe_allow_html=True)
st.caption("Median total fare by route and advance-purchase window. Darker = more expensive.")

heatmap_data = (
    df[df["source_name"] != "synthetic_estimate"]
    .groupby(["route", "advance_purchase_days"])
    .agg(median_fare=("total_fare", "median"))
    .reset_index()
    .pivot(index="route", columns="advance_purchase_days", values="median_fare")
)

if not heatmap_data.empty:
    fig_heat = px.imshow(
        heatmap_data,
        color_continuous_scale="Blues",
        labels={"x": "Days before departure", "y": "Route", "color": "Fare (₹)"},
        text_auto=".0f",
    )
    fig_heat.update_layout(
        plot_bgcolor="white", paper_bgcolor="white",
        height=250, margin={"t": 10}
    )
    st.plotly_chart(fig_heat, use_container_width=True)
else:
    st.info("Heatmap will appear once real scrape data is loaded.")

st.markdown("---")


# ─── PANEL 3: LEAD-TIME ELASTICITY ──────────────────────────────────────────────────────────────────
st.markdown("<div class='section-header'>How price changes as departure approaches</div>",
            unsafe_allow_html=True)
st.caption(
    "Fare vs. days before departure for DEL-BOM — shows the lead-time price premium. "
    "Policymakers use this to understand price accessibility for last-minute travellers."
)

elasticity_df = (
    df[df["route"] == "DEL-BOM"]
    .groupby(["advance_purchase_days", "source_name"])
    .agg(median_fare=("total_fare", "median"))
    .reset_index()
)

if not elasticity_df.empty:
    fig_el = px.bar(
        elasticity_df,
        x="advance_purchase_days", y="median_fare", color="source_name",
        barmode="group",
        labels={"advance_purchase_days": "Days before departure",
                "median_fare": "Median fare (₹)",
                "source_name": "Source"},
        color_discrete_map={
            "air_india_direct": COLOR_REAL,
            "indigo_direct": "#38BDF8",
            "synthetic_estimate": COLOR_ESTIMATED,
        },
    )
    fig_el.update_layout(
        plot_bgcolor="white", paper_bgcolor="white",
        height=280, margin={"t": 10}
    )
    st.plotly_chart(fig_el, use_container_width=True)

st.markdown("---")


# ─── PANEL 4: METHODOLOGY ──────────────────────────────────────────────────────────────────────────────
with st.expander("🔍 Methodology — how this index is built (click to expand)", expanded=False):
    st.markdown("""
    **Why should you trust this index?** Two reasons — and both are shown here, not buried in code.
    """)

    st.markdown("**1. Route weights come from government data, not guesswork**")
    weights_table = pd.DataFrame([
        {
            "Route": route,
            "Weight in index": f"{weight:.1%}",
            "Passengers (FY22-23, mn)": DGCA_PAX_MILLIONS[route],
            "Source": "DGCA Annual Traffic Survey",
        }
        for route, weight in ROUTE_WEIGHTS.items()
    ])
    st.dataframe(weights_table, hide_index=True, use_container_width=True)
    st.caption(
        "Weights = each route's share of total passenger traffic. "
        "DEL-BOM gets the highest weight because it carries the most passengers — "
        "a fare spike there affects more travellers. Same logic as CPI food weighting."
    )

    st.markdown("**2. Cross-source validation — same routes, two independent airlines**")
    if validation_stats:
        val_df = pd.DataFrame(validation_stats)
        val_df.columns = ["Route", "Advance window", "Mean % difference", "Max % difference", "Comparisons"]
        st.dataframe(val_df, hide_index=True, use_container_width=True)
        st.caption(
            "These are the % fare differences between Air India and IndiGo on the same route/date. "
            "A small % difference confirms neither source is an outlier — the index reflects the market."
        )
    else:
        st.info(
            "Cross-source comparison data will appear here once both scrapers have run. "
            "It shows how much Air India and IndiGo prices differ on the same route/date."
        )

    st.markdown("**Formula:** DGCA-traffic-weighted chain-linked geometric mean. "
                "One formula — not Laspeyres, not Fisher. Explained in [docs/methodology.md](docs/methodology.md).")

st.markdown("---")


# ─── PANEL 5: WHAT THIS MEANS ─────────────────────────────────────────────────────────────────────────
st.markdown("<div class='section-header'>What this means for policy</div>",
            unsafe_allow_html=True)

if not daily_df.empty and len(daily_df) >= 2:
    latest_val = daily_df.iloc[-1]["apix_value"]
    prev_val = daily_df.iloc[-2]["apix_value"]
    chg = latest_val - prev_val
    chg_pct = (chg / prev_val) * 100

    # Find which route drove the change most
    if not df.empty:
        recent_dates = sorted(df["travel_date"].unique())[-2:]
        if len(recent_dates) == 2:
            recent = df[df["travel_date"].isin(recent_dates)]
            route_chg = (
                recent.groupby(["travel_date", "route"])
                .agg(med=("total_fare", "median")).reset_index()
                .pivot(index="travel_date", columns="route", values="med")
                .pct_change().iloc[-1]
            )
            if not route_chg.empty:
                top_route = route_chg.idxmax()
                direction = "rose" if chg_pct > 0 else "fell"
                summary = (
                    f"Fares {direction} mainly on **{top_route}** this period, "
                    f"pushing the APIx {direction} by **{abs(chg_pct):.1f}%** "
                    f"(from {prev_val:.1f} to {latest_val:.1f})."
                )
            else:
                summary = f"The APIx moved by {chg_pct:+.1f}% in the latest observation."
        else:
            summary = f"The APIx is currently at {latest_val:.1f} (base = 100)."
    else:
        summary = f"The APIx is currently at {latest_val:.1f} (base = 100)."
else:
    summary = "Not enough data for a trend statement yet."

st.info(f"📊 **{summary}")
st.caption(
    "This sentence is auto-generated from the index data. "
    "A sustained rise above 110 would signal fare-driven inflation in the transport CPI component, "
    "informing MOSPI's monthly price collection and RBI's inflation expectations."
)

st.markdown("---")
st.markdown(
    "<p class='caption-text'>APIx prototype — SIH 26056 | "
    "Data: Air India direct + IndiGo direct + synthetic gap-filler (labeled) | "
    "Weights: DGCA Annual Traffic Survey FY2022-23</p>",
    unsafe_allow_html=True
)
