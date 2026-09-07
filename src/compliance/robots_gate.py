"""
APIx compliance gate.

Every outbound request in the ingestion engine MUST be authorised by this module.
There is no bypass flag and no override parameter -- that is deliberate. If a
reviewer asks "how do you know you never scraped a disallowed path?", the answer
is that the connector base class cannot issue a request without a Decision object,
and Decision objects are only minted here.

Why a hand-rolled parser instead of urllib.robotparser:
    urllib.robotparser.RuleLine.applies_to() does a plain str.startswith() on the
    rule path. It does not implement '*' or '$' wildcards. Real airline robots.txt
    files use them -- goindigo.in ships `Disallow: *.pdf` and `Disallow: /book/*`,
    neither of which the stdlib parser matches correctly. Using the stdlib here
    would silently authorise requests that the site owner disallowed.

This implements the Google robots.txt specification (RFC 9309):
    - user-agent groups; the most specific matching group wins, '*' is the fallback
    - within the winning group, the LONGEST matching rule wins
    - on equal length, Allow beats Disallow
    - '*' matches any run of characters, '$' anchors to end of path
"""

from __future__ import annotations

import hashlib
import re
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Iterable, Literal
from urllib.parse import urlparse, urlunparse

import httpx

UnreachablePolicy = Literal["deny", "spec"]

DEFAULT_USER_AGENT = (
    "APIx-ResearchBot/1.0 "
    "(+https://mospi.gov.in/; airfare price index research; contact: <YOUR-EMAIL>)"
)

# Floor applied even when a site declares a shorter Crawl-delay or none at all.
MIN_INTERVAL_SECONDS = 4.0
ROBOTS_TTL = timedelta(hours=6)


class RobotsDenied(RuntimeError):
    """Raised when a connector attempts a request the gate refused."""

    def __init__(self, decision: "Decision"):
        self.decision = decision
        super().__init__(
            f"robots.txt denies {decision.url} for UA={decision.user_agent!r}: "
            f"{decision.reason}"
            + (f" [matched: {decision.matched_directive}]" if decision.matched_directive else "")
        )


@dataclass(frozen=True)
class Decision:
    """An auditable authorisation record. Persist one row per decision."""

    allowed: bool
    url: str
    user_agent: str
    reason: str
    robots_url: str
    robots_fetched_at: datetime
    robots_sha256: str | None
    matched_directive: str | None = None
    matched_group: str | None = None
    crawl_delay: float | None = None

    def as_audit_row(self) -> dict:
        return {
            "allowed": self.allowed,
            "url": self.url,
            "user_agent": self.user_agent,
            "reason": self.reason,
            "robots_url": self.robots_url,
            "robots_fetched_at": self.robots_fetched_at.isoformat(),
            "robots_sha256": self.robots_sha256,
            "matched_directive": self.matched_directive,
            "matched_group": self.matched_group,
            "crawl_delay": self.crawl_delay,
        }


@dataclass
class _Rule:
    allow: bool
    raw_path: str
    pattern: re.Pattern
    length: int

    @property
    def directive(self) -> str:
        return f"{'Allow' if self.allow else 'Disallow'}: {self.raw_path}"


@dataclass
class _Group:
    agents: list[str] = field(default_factory=list)
    rules: list[_Rule] = field(default_factory=list)
    crawl_delay: float | None = None


def _compile(path: str) -> re.Pattern:
    """Translate a robots.txt path pattern into a regex anchored at the start."""
    out = ["^"]
    for ch in path:
        if ch == "*":
            out.append(".*")
        elif ch == "$":
            out.append("$")
        else:
            out.append(re.escape(ch))
    return re.compile("".join(out))


@dataclass
class RobotsFile:
    """A parsed robots.txt plus the evidence needed to defend a decision later."""

    url: str
    fetched_at: datetime
    status_code: int | None
    sha256: str | None
    groups: list[_Group] = field(default_factory=list)
    sitemaps: list[str] = field(default_factory=list)
    fetch_error: str | None = None

    @classmethod
    def parse(cls, url: str, body: str, status_code: int, fetched_at: datetime) -> "RobotsFile":
        rf = cls(
            url=url,
            fetched_at=fetched_at,
            status_code=status_code,
            sha256=hashlib.sha256(body.encode("utf-8", "replace")).hexdigest(),
        )
        current: _Group | None = None
        # A blank line or a rule line ends an agent block; consecutive user-agent
        # lines accumulate into one group (per RFC 9309).
        expecting_agents = False

        for raw in body.splitlines():
            line = raw.split("#", 1)[0].strip()
            if not line or ":" not in line:
                continue
            field_name, _, value = line.partition(":")
            key = field_name.strip().lower()
            value = value.strip()

            if key == "user-agent":
                if current is None or not expecting_agents:
                    current = _Group()
                    rf.groups.append(current)
                    expecting_agents = True
                current.agents.append(value.lower())
            elif key in ("allow", "disallow"):
                if current is None:
                    continue
                expecting_agents = False
                if key == "disallow" and value == "":
                    # "Disallow:" with an empty value means allow everything.
                    continue
                current.rules.append(
                    _Rule(
                        allow=(key == "allow"),
                        raw_path=value,
                        pattern=_compile(value),
                        # '*' and '$' are metacharacters and don't count toward
                        # specificity in the longest-match rule.
                        length=len(value.replace("*", "").replace("$", "")),
                    )
                )
            elif key == "crawl-delay":
                if current is not None:
                    expecting_agents = False
                    try:
                        current.crawl_delay = float(value)
                    except ValueError:
                        pass
            elif key == "sitemap":
                rf.sitemaps.append(value)

        return rf

    def _select_group(self, user_agent: str) -> _Group | None:
        """Most specific matching agent token wins; '*' is the fallback."""
        ua = user_agent.lower()
        best: _Group | None = None
        best_len = -1
        wildcard: _Group | None = None
        for group in self.groups:
            for agent in group.agents:
                if agent == "*":
                    if wildcard is None:
                        wildcard = group
                elif agent in ua and len(agent) > best_len:
                    best, best_len = group, len(agent)
        return best or wildcard

    def evaluate(self, url: str, user_agent: str) -> Decision:
        parsed = urlparse(url)
        path = parsed.path or "/"
        if parsed.query:
            path = f"{path}?{parsed.query}"

        group = self._select_group(user_agent)
        if group is None:
            return Decision(
                allowed=True,
                url=url,
                user_agent=user_agent,
                reason="no applicable user-agent group in robots.txt",
                robots_url=self.url,
                robots_fetched_at=self.fetched_at,
                robots_sha256=self.sha256,
                crawl_delay=None,
            )

        winner: _Rule | None = None
        for rule in group.rules:
            if not rule.pattern.match(path):
                continue
            if winner is None or rule.length > winner.length:
                winner = rule
            elif rule.length == winner.length and rule.allow and not winner.allow:
                winner = rule  # tie -> Allow wins

        agent_label = ", ".join(group.agents)
        if winner is None:
            return Decision(
                allowed=True,
                url=url,
                user_agent=user_agent,
                reason="no matching rule; default allow",
                robots_url=self.url,
                robots_fetched_at=self.fetched_at,
                robots_sha256=self.sha256,
                matched_group=agent_label,
                crawl_delay=group.crawl_delay,
            )

        return Decision(
            allowed=winner.allow,
            url=url,
            user_agent=user_agent,
            reason="longest-match rule is Allow" if winner.allow else "longest-match rule is Disallow",
            robots_url=self.url,
            robots_fetched_at=self.fetched_at,
            robots_sha256=self.sha256,
            matched_directive=winner.directive,
            matched_group=agent_label,
            crawl_delay=group.crawl_delay,
        )


class RobotsGate:
    """
    Thread-safe, caching authoriser with per-host rate limiting.

    unreachable_policy:
        "deny" (default) -- any robots.txt we cannot read means we do not fetch.
          Stricter than RFC 9309 and the correct posture for a system feeding
          an official statistic. Document this in your methodology page.
        "spec"  -- follow RFC 9309: 4xx means allow-all, 5xx/network error means
          disallow-all.
    """

    def __init__(
        self,
        user_agent: str = DEFAULT_USER_AGENT,
        unreachable_policy: UnreachablePolicy = "deny",
        min_interval: float = MIN_INTERVAL_SECONDS,
        ttl: timedelta = ROBOTS_TTL,
        client: httpx.Client | None = None,
    ):
        self.user_agent = user_agent
        self.unreachable_policy = unreachable_policy
        self.min_interval = min_interval
        self.ttl = ttl
        self._client = client or httpx.Client(
            timeout=20.0,
            follow_redirects=True,
            headers={"User-Agent": user_agent},
        )
        self._cache: dict[str, RobotsFile] = {}
        self._last_hit: dict[str, float] = {}
        self._lock = threading.Lock()

    @staticmethod
    def _origin(url: str) -> str:
        p = urlparse(url)
        if not p.scheme or not p.netloc:
            raise ValueError(f"absolute URL required, got {url!r}")
        return urlunparse((p.scheme, p.netloc, "", "", "", ""))

    def _robots_for(self, url: str) -> RobotsFile:
        origin = self._origin(url)
        robots_url = f"{origin}/robots.txt"
        now = datetime.now(timezone.utc)

        with self._lock:
            cached = self._cache.get(origin)
            if cached and now - cached.fetched_at < self.ttl:
                return cached

        try:
            resp = self._client.get(robots_url)
            if resp.status_code >= 500:
                rf = RobotsFile(robots_url, now, resp.status_code, None,
                                fetch_error=f"HTTP {resp.status_code}")
            elif resp.status_code >= 400:
                rf = RobotsFile(robots_url, now, resp.status_code, None,
                                fetch_error=f"HTTP {resp.status_code}")
            else:
                rf = RobotsFile.parse(robots_url, resp.text, resp.status_code, now)
        except Exception as exc:  # network failure, TLS failure, timeout
            rf = RobotsFile(robots_url, now, None, None, fetch_error=f"{type(exc).__name__}: {exc}")

        with self._lock:
            self._cache[origin] = rf
        return rf

    def check(self, url: str) -> Decision:
        """Authorise a single URL. Never raises on denial -- returns the Decision."""
        rf = self._robots_for(url)

        if rf.fetch_error is not None:
            if self.unreachable_policy == "deny":
                allowed, reason = False, f"robots.txt unreachable ({rf.fetch_error}); fail-closed"
            else:
                spec_allows = rf.status_code is not None and 400 <= rf.status_code < 500
                allowed = spec_allows
                reason = (
                    f"robots.txt {rf.fetch_error}; RFC 9309 "
                    f"{'allow-all (4xx)' if spec_allows else 'disallow-all'}"
                )
            return Decision(
                allowed=allowed,
                url=url,
                user_agent=self.user_agent,
                reason=reason,
                robots_url=rf.url,
                robots_fetched_at=rf.fetched_at,
                robots_sha256=None,
            )

        return rf.evaluate(url, self.user_agent)

    def authorize(self, url: str) -> Decision:
        """Authorise and raise RobotsDenied if refused. Use this in connectors."""
        decision = self.check(url)
        if not decision.allowed:
            raise RobotsDenied(decision)
        return decision

    def wait_for_slot(self, url: str, decision: Decision) -> float:
        """Block until this host's rate-limit window opens. Returns seconds slept."""
        origin = self._origin(url)
        interval = max(self.min_interval, decision.crawl_delay or 0.0)
        with self._lock:
            last = self._last_hit.get(origin, 0.0)
            wait = max(0.0, (last + interval) - time.monotonic())
        if wait:
            time.sleep(wait)
        with self._lock:
            self._last_hit[origin] = time.monotonic()
        return wait

    def sitemaps_for(self, url: str) -> list[str]:
        return list(self._robots_for(url).sitemaps)

    def audit(self, urls: Iterable[str]) -> list[Decision]:
        """Evaluate many URLs without fetching any of them. Feeds the compliance report."""
        return [self.check(u) for u in urls]

    def close(self) -> None:
        self._client.close()
