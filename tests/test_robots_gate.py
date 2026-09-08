"""
Offline tests for the compliance gate. No network required.

The INDIGO_FIXTURE below is an excerpt copied verbatim from the live
https://www.goindigo.in/robots.txt as fetched on 2026-09-08. It is a fixture for
parser correctness only -- it is NOT a substitute for the runtime fetch. The gate
always re-fetches at run time; refresh this fixture when you re-audit.
"""

from datetime import datetime, timezone

import pytest

from src.compliance.robots_gate import RobotsFile, RobotsGate, RobotsDenied, _compile

NOW = datetime(2026, 9, 8, tzinfo=timezone.utc)

INDIGO_FIXTURE = """
User-Agent: *
Disallow: /search.html
Disallow: /errors
Disallow: /offers.html
Disallow: *.pdf
Disallow: /bookings/*
Disallow: /book/*
Disallow: /booking/*
Disallow: /check-in/*
Disallow: /airports/*

Sitemap: https://www.goindigo.in/sitemap.xml
"""


def parse(body: str) -> RobotsFile:
    return RobotsFile.parse("https://example.com/robots.txt", body, 200, NOW)


class TestWildcards:
    def test_star_suffix_blocks_subpaths(self):
        rf = parse(INDIGO_FIXTURE)
        d = rf.evaluate("https://www.goindigo.in/book/flight-select", "APIx-ResearchBot/1.0")
        assert d.allowed is False
        assert d.matched_directive == "Disallow: /book/*"

    def test_star_prefix_blocks_all_pdfs_anywhere(self):
        """The stdlib robotparser gets this wrong -- it would return allowed=True."""
        rf = parse(INDIGO_FIXTURE)
        d = rf.evaluate(
            "https://www.goindigo.in/content/dam/tariff/DEL-BOM-tariff.pdf",
            "APIx-ResearchBot/1.0",
        )
        assert d.allowed is False
        assert d.matched_directive == "Disallow: *.pdf"

    def test_dollar_anchors_end_of_path(self):
        rf = parse("User-agent: *\nDisallow: /fares$\n")
        assert rf.evaluate("https://x.com/fares", "bot").allowed is False
        assert rf.evaluate("https://x.com/fares/DEL-BOM", "bot").allowed is True

    def test_unlisted_path_is_allowed(self):
        rf = parse(INDIGO_FIXTURE)
        assert rf.evaluate("https://www.goindigo.in/about-us.html", "bot").allowed is True


class TestPrecedence:
    def test_longest_match_wins(self):
        rf = parse("User-agent: *\nDisallow: /a/\nAllow: /a/public/\n")
        assert rf.evaluate("https://x.com/a/private/1", "bot").allowed is False
        assert rf.evaluate("https://x.com/a/public/1", "bot").allowed is True

    def test_allow_wins_on_equal_length_tie(self):
        rf = parse("User-agent: *\nDisallow: /p\nAllow: /p\n")
        assert rf.evaluate("https://x.com/p", "bot").allowed is True

    def test_metacharacters_do_not_inflate_specificity(self):
        rf = parse("User-agent: *\nDisallow: /data/*\nAllow: /data/open/\n")
        assert rf.evaluate("https://x.com/data/open/x", "bot").allowed is True

    def test_specific_agent_group_overrides_wildcard(self):
        rf = parse(
            "User-agent: *\nDisallow: /\n\n"
            "User-agent: APIx-ResearchBot\nAllow: /\n"
        )
        assert rf.evaluate("https://x.com/f", "APIx-ResearchBot/1.0").allowed is True
        assert rf.evaluate("https://x.com/f", "SomeOtherBot/2").allowed is False

    def test_consecutive_user_agent_lines_share_one_group(self):
        rf = parse("User-agent: alpha\nUser-agent: beta\nDisallow: /x\n")
        assert rf.evaluate("https://x.com/x", "beta-crawler").allowed is False

    def test_empty_disallow_means_allow_all(self):
        rf = parse("User-agent: *\nDisallow:\n")
        assert rf.evaluate("https://x.com/anything", "bot").allowed is True


class TestMetadata:
    def test_sitemaps_are_captured(self):
        assert parse(INDIGO_FIXTURE).sitemaps == ["https://www.goindigo.in/sitemap.xml"]

    def test_crawl_delay_is_captured(self):
        rf = parse("User-agent: *\nCrawl-delay: 12\nDisallow: /x\n")
        assert rf.evaluate("https://x.com/ok", "bot").crawl_delay == 12.0

    def test_comments_are_stripped(self):
        rf = parse("User-agent: *  # everyone\nDisallow: /x  # secret\n")
        assert rf.evaluate("https://x.com/x", "bot").allowed is False

    def test_decision_carries_robots_hash_for_audit(self):
        d = parse(INDIGO_FIXTURE).evaluate("https://www.goindigo.in/book/a", "bot")
        assert d.robots_sha256 and len(d.robots_sha256) == 64
        assert d.as_audit_row()["matched_directive"] == "Disallow: /book/*"


class TestFailClosed:
    def _gate(self, policy):
        gate = RobotsGate(unreachable_policy=policy)
        gate._cache["https://down.example"] = RobotsFile(
            "https://down.example/robots.txt", NOW, None, None, fetch_error="ConnectTimeout"
        )
        return gate

    def test_unreachable_denies_by_default(self):
        d = self._gate("deny").check("https://down.example/fares")
        assert d.allowed is False
        assert "fail-closed" in d.reason

    def test_authorize_raises_on_denial(self):
        with pytest.raises(RobotsDenied):
            self._gate("deny").authorize("https://down.example/fares")

    def test_spec_policy_allows_on_4xx(self):
        gate = RobotsGate(unreachable_policy="spec")
        now_fresh = datetime.now(timezone.utc)
        gate._cache["https://nf.example"] = RobotsFile(
            "https://nf.example/robots.txt", now_fresh, 404, None, fetch_error="HTTP 404"
        )
        assert gate.check("https://nf.example/fares").allowed is True

    def test_spec_policy_denies_on_5xx(self):
        gate = RobotsGate(unreachable_policy="spec")
        now_fresh = datetime.now(timezone.utc)
        gate._cache["https://err.example"] = RobotsFile(
            "https://err.example/robots.txt", now_fresh, 503, None, fetch_error="HTTP 503"
        )
        assert gate.check("https://err.example/fares").allowed is False



def test_query_string_is_part_of_the_matched_path():
    rf = parse("User-agent: *\nDisallow: /s?q=\n")
    assert rf.evaluate("https://x.com/s?q=DEL", "bot").allowed is False


def test_compile_escapes_regex_metacharacters_in_paths():
    assert _compile("/a.b").match("/a.b")
    assert not _compile("/a.b").match("/axb")
