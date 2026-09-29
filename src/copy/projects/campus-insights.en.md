## Where the data comes from

This is **synthetic data**: a script with a fixed seed writes a full term of orders, items, payments, deliveries and refunds, one by one, through the course project's schema, constraints and triggers. It obeys every business rule the course project does — but it is not real business data.

## Which patterns were planted

Lunch and dinner peaks, Friday and Saturday late nights, a few merchants earning most of the revenue, students who join in the first two weeks coming back more often, slower delivery to the North dorms, more cancellations at peak hours — all of these are set in the generator's parameters (table below). The five chapters above use SQL to **find them again**: what they show is the method — asking the question, defining the metric, writing the query, reading the result — not new business findings.

## How the numbers are computed

Every number in the story was computed at build time with the same queries listed below; the dashboard runs those queries live, in your browser, on the same database. Tests check that both agree, and that every number on the page comes from a query result.
