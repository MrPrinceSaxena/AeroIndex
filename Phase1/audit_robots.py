"""
Live source-eligibility audit.

Fetches every target's real robots.txt right now and reports which fare-bearing
paths are permitted for our user agent. Nothing is fetched beyond robots.txt
itself, so this is safe to run repeatedly.

Two outputs:
    docs/compliance_annexe.md    -- the table you put in your submission
    data/compliance/audit_<ts>.json -- machine-readable, one row per decision

Re-run weekly. robots.txt changes; a claim made in April is not evidence in
September. The annexe records the SHA-256 of each robots.txt so a reviewer can
verify you evaluated the file you say you evaluated.

Usage:
    python -m scripts.audit_robots
    python -m scripts.audit_robots --targets custom_targets.json
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.compliance.robots_gate import RobotsGate  # noqa: E402

# Candidate fare-bearing paths. These are probe URLs for the eligibility check --
# adjust the paths to whatever the current site structure actually uses. The point
# is to test the real path you would fetch, not a homepage.
TARGETS: dict[str, list[str]] = {
    "IndiGo": [
        "https://www.goindigo.in/book/flight-select.html",
        "https://www.goindigo.in/booking/flight-select",
        "https://www.goindigo.in/content/dam/tariff/domestic-tariff.pdf",
        "https://www.goindigo.in/sitemap.xml",
    ],
    "Air India": [
        "https://www.airindia.com/in/en/book/flight-search.html",
        "https://www.airindia.com/robots.txt",
    ],
    "Akasa Air": ["https://www.akasaair.com/booking/select"],
    "SpiceJet": ["https://www.spicejet.com/", "https://www.spicejet.com/booking"],
    "Air India Express": ["https://www.airindiaexpress.com/booking"],
    "MakeMyTrip": ["https://www.makemytrip.com/flight/search"],
    "Yatra": ["https://flight.yatra.com/air-search-ui/dom2"],
    "EaseMyTrip": ["https://flight.easemytrip.com/FlightList/Index"],
    "Cleartrip": ["https://www.cleartrip.com/flights/results"],
    "Ixigo": ["https://www.ixigo.com/search/result/flight"],
    "Goibibo": ["https://www.goibibo.com/flights/air-DEL-BOM/"],
}


def run(targets: dict[str, list[str]], user_agent: str | None) -> dict:
    gate = RobotsGate(user_agent=user_agent) if user_agent else RobotsGate()
    started = datetime.now(timezone.utc)
    rows, by_source = [], defaultdict(list)

    for source, urls in targets.items():
        for url in urls:
            d = gate.check(url)
            row = {"source": source, **d.as_audit_row()}
            rows.append(row)
            by_source[source].append(d)
            flag = "ALLOW" if d.allowed else "DENY "
            print(f"[{flag}] {source:<18} {url}")
            if d.matched_directive:
                print(f"          matched: {d.matched_directive}")

    verdicts = {}
    for source, decisions in by_source.items():
        allowed = [d for d in decisions if d.allowed]
        verdicts[source] = {
            "eligible": bool(allowed),
            "allowed_paths": [d.url for d in allowed],
            "blocking_directives": sorted(
                {d.matched_directive for d in decisions if not d.allowed and d.matched_directive}
            ),
            "robots_sha256": next((d.robots_sha256 for d in decisions if d.robots_sha256), None),
        }

    gate.close()
    return {
        "generated_at": started.isoformat(),
        "user_agent": gate.user_agent,
        "unreachable_policy": gate.unreachable_policy,
        "decisions": rows,
        "verdicts": verdicts,
    }


def write_annexe(report: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Annexe A — Source Eligibility Under robots.txt",
        "",
        f"Generated: {report['generated_at']}  ",
        f"User agent evaluated: `{report['user_agent']}`  ",
        f"Unreachable-robots policy: `{report['unreachable_policy']}`",
        "",
        "Every path below was evaluated against the source's live robots.txt at the",
        "timestamp shown. Only paths marked ALLOW are ever fetched by the ingestion",
        "engine; the gate refuses the rest at call time, not by convention.",
        "",
        "| Source | Eligible | Blocking directive(s) | robots.txt SHA-256 |",
        "|---|---|---|---|",
    ]
    for source, v in report["verdicts"].items():
        blocking = "<br>".join(f"`{b}`" for b in v["blocking_directives"]) or "—"
        sha = (v["robots_sha256"] or "n/a")[:16]
        lines.append(f"| {source} | {'yes' if v['eligible'] else 'no'} | {blocking} | `{sha}…` |")

    lines += [
        "",
        "## Method",
        "",
        "Rules are applied per RFC 9309: the most specific matching user-agent group",
        "wins, then the longest matching path rule, with Allow winning ties. `*` and",
        "`$` wildcards are honoured. Where robots.txt cannot be retrieved the engine",
        "fails closed and fetches nothing, which is stricter than the specification.",
        "",
        "This annexe is regenerated by `python -m scripts.audit_robots`. Re-run before",
        "submission — robots.txt is not a static document.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--targets", type=Path, help="JSON file: {source: [urls]}")
    ap.add_argument("--user-agent")
    ap.add_argument("--annexe", type=Path, default=Path("docs/compliance_annexe.md"))
    args = ap.parse_args()

    targets = json.loads(args.targets.read_text()) if args.targets else TARGETS
    report = run(targets, args.user_agent)

    out_dir = Path("data/compliance")
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = report["generated_at"].replace(":", "").replace("-", "")[:15]
    (out_dir / f"audit_{stamp}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    write_annexe(report, args.annexe)

    eligible = [s for s, v in report["verdicts"].items() if v["eligible"]]
    print(f"\neligible sources: {len(eligible)}/{len(report['verdicts'])} -> {eligible}")
    print(f"annexe: {args.annexe}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
