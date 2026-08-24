"""
src/index_engine/plot_sanity_check.py

Phase 3 sanity check -- a quick matplotlib plot of the computed APIx series,
separate from the Streamlit dashboard. Useful for eyeballing the index shape
right after a pipeline run, before it's worth opening the full dashboard.

Run: python -m src.index_engine.plot_sanity_check
Writes: data/clean/apix_sanity_check.png
"""

from pathlib import Path

import matplotlib.pyplot as plt

from src.index_engine.compute_index import load_clean_fares, compute_daily_index

OUTPUT_PATH = Path("data/clean/apix_sanity_check.png")


def main() -> None:
    df = load_clean_fares()
    if df.empty:
        print("No fare data available yet — run the ingestion pipeline first.")
        return

    daily = compute_daily_index(df)
    if daily.empty:
        print("Could not compute an index from the available data.")
        return

    real = daily[~daily["is_estimated"]]
    estimated = daily[daily["is_estimated"]]

    fig, ax = plt.subplots(figsize=(9, 4))
    if not real.empty:
        ax.plot(real["date"], real["apix_value"], "o-", color="#0EA5E9", label="Real data")
    if not estimated.empty:
        ax.plot(
            estimated["date"], estimated["apix_value"], "D--",
            color="#F59E0B", label="Includes estimated data",
        )
    ax.axhline(100.0, color="#94A3B8", linewidth=1, linestyle=":")
    ax.set_title("APIx — sanity check (base = 100)")
    ax.set_xlabel("Date")
    ax.set_ylabel("APIx value")
    ax.legend()
    fig.autofmt_xdate()
    fig.tight_layout()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT_PATH, dpi=150)
    print(f"Saved sanity-check plot to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
