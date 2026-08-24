"""
tests/test_quotes_query.py

Exercises build_quotes_query() purely as a string/params builder -- no
database involved.
"""

from datetime import date

from src.api.quotes import build_quotes_query


class TestBuildQuotesQuery:
    def test_no_filters_has_no_where_clause(self):
        sql, params = build_quotes_query()
        assert "WHERE" not in sql
        assert params == [50, 0]

    def test_route_filter(self):
        sql, params = build_quotes_query(route="DEL-BOM")
        assert "route = %s" in sql
        assert params[0] == "DEL-BOM"

    def test_multiple_filters_combined_with_and(self):
        sql, params = build_quotes_query(route="DEL-BOM", source_name="air_india_direct", advance_purchase_days=7)
        assert "route = %s" in sql
        assert "source_name = %s" in sql
        assert "advance_purchase_days = %s" in sql
        assert sql.count("AND") == 2
        assert params[:3] == ["DEL-BOM", "air_india_direct", 7]

    def test_date_range_filters(self):
        sql, params = build_quotes_query(date_from=date(2026, 8, 1), date_to=date(2026, 8, 31))
        assert "travel_date >= %s" in sql
        assert "travel_date <= %s" in sql
        assert date(2026, 8, 1) in params
        assert date(2026, 8, 31) in params

    def test_exclude_sold_out(self):
        sql, params = build_quotes_query(include_sold_out=False)
        assert "is_sold_out = FALSE" in sql

    def test_include_sold_out_by_default_has_no_sold_out_filter(self):
        sql, params = build_quotes_query()
        # is_sold_out is still a selected column -- just not filtered on
        assert "is_sold_out = FALSE" not in sql

    def test_limit_and_offset_are_last_params(self):
        sql, params = build_quotes_query(route="DEL-BOM", limit=25, offset=100)
        assert params[-2:] == [25, 100]

    def test_param_order_matches_clause_order(self):
        sql, params = build_quotes_query(
            route="DEL-BOM",
            source_name="indigo_direct",
            advance_purchase_days=30,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 2, 1),
            include_sold_out=False,
            limit=10,
            offset=5,
        )
        # 6 filter params + limit + offset
        assert params == ["DEL-BOM", "indigo_direct", 30, date(2026, 1, 1), date(2026, 2, 1), 10, 5]

    def test_uses_window_function_for_total_count(self):
        sql, params = build_quotes_query()
        assert "COUNT(*) OVER()" in sql
