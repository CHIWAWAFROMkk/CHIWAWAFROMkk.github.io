CSV Analysis Tool · version 1.0.0 · [Open the tool](/en/projects/stock-data/) · [Download the source package](/downloads/csv-lab-source.zip)

Record the input and every cleaning decision, then check the output with a public sample and the same calculation code.

## Goal

Let anyone looking at the work bring their own data and compare before and after processing, instead of only looking at static charts.

## Input and output

- Input: a UTF-8 CSV, TSV or pasted text with a header row; comma, semicolon and tab are detected automatically.
- Output: per-column quality checks, descriptive statistics, a histogram, a searchable and sortable data preview, and CSV and JSON downloads.

## Tools

JavaScript ES modules do the calculation; the File API reads files; Web Crypto computes SHA-256; HTML/CSS draw the tables and histogram; Node.js runs the same module with assertion checks. No server-side processing, no AI analysis calls.

## From input to result

1. **Check the input's structure.** Enforce the 2 MB, 20,000-row and 100-column limits; normalise line breaks and strip the UTF-8 BOM. Detect the delimiter from the header outside quotes. Parse double quotes, escaped quotes and multi-line cells. Ignore fully blank lines; reject duplicate or empty headers, unclosed quotes and records with the wrong number of columns, so nothing silently shifts.
2. **Keep the input and record what processing changed.** Nothing is removed by default. The user can remove exact duplicate rows first, then rows with blanks. De-duplication keeps the first occurrence and compares the original cells without rewriting spaces. Everything is recomputed from the original input, so unticking an option restores it. Input rows, both removal counts and output rows are recorded and checked to reconcile.
3. **Define the statistics explicitly.** Blanks and non-numbers are left out of numeric statistics; decimals and scientific notation are accepted strictly, while infinities, thousand-separated text and values beyond 10¹⁰⁰ are rejected. IDs with leading zeros are treated as text. The mean is the sum over the count of valid numbers; the median and quartiles use linear interpolation on the sorted values; the sample standard deviation divides by n−1 and is not computed for a single value.
4. **Show results you can check.** The histogram uses equal-width bins, min(10, ceil(√n)) of them; identical values share one bin. Bins are closed on the left and open on the right, the last bin includes the maximum, and the counts add up to the number of valid values. Values below Q1−1.5×IQR or above Q3+1.5×IQR are only marked as outlier candidates — never removed, and never explained as business anomalies.
5. **Export what is needed to recompute.** The JSON stores the module version, the input's SHA-256, the delimiter, the options, the row-count audit and column statistics. The same input, version and options recompute the same result. The hash compares content; it does not prove where the data came from. The CSV export contains every processed row; searching and sorting the preview do not affect it.

## Verified results

Synthetic sample · not real market data. It holds two made-up security codes with dates, closing prices and volumes — 13 rows in total, one exact duplicate and two rows with one blank each.

| Action | Expected result |
|---|---|
| Import with no processing | 13 rows / 2 blanks / 1 duplicate |
| Remove exact duplicates | 12 rows |
| Then remove rows with blanks | 10 rows |
| Analyse close | mean 15.2 / min 8 / max 22 |

### Why can these numbers be trusted?

After processing, close is: 10, 11, 12, 9, 8, 20, 21, 22, 19, 20. They sum to 152 over 10 valid records, a mean of 15.2. The web page and the command line import the same calculation module; there are not two copies of the formulas.

This verifies deterministic processing logic — not market returns — and makes no claim that the tool has been validated by many users.

## Run it yourself

### Without code

1. Download [sample.csv](/assets/sample.csv) and upload it to [the tool](/en/projects/stock-data/).
2. Check 13 rows, 2 blanks and 1 duplicate.
3. Tick "Remove exact duplicate rows" and "Remove rows with blanks".
4. Choose close and check 10 rows and a mean of 15.2.
5. Export the analysis record; untick the options and confirm the original data comes back.

### Locally

Download [the source package](/downloads/csv-lab-source.zip) and unzip it; you need Node.js 20.11 or later. No third-party dependencies, nothing to install.

```
node reproduce.mjs sample.csv --dedupe --drop-missing
node check.mjs
```

The first prints a structured result; the second runs checks on the core sample, parsing and statistics. Replace sample.csv with your own file if you like.

## Process and trade-offs

### From a market report to an interactive tool

The original project covered market-data cleaning, SQLite reconciliation and a strategy ledger. Because the raw Excel files have not been rebuilt yet, real market results cannot be recomputed. This version keeps the data-quality thinking, turns the general part into a tool anyone can try, and does not dress up an unfinished backtest as a feature.

### Why compute in the browser

A light CSV does not need to be uploaded to a server, and visitors do not need to log in; the input lives only in the page's memory. The cost is limited scale, so size, rows and columns are capped explicitly, and the tool stops and explains why when a limit is exceeded.

### Why not fix things automatically

Blanks can carry business meaning, and outliers can be real events. By default the tool only diagnoses; removal is the user's choice, and the original input is kept so it can be restored. Dates, currencies, percentages, joins or regressions call for a dedicated analysis workflow.

### Next

No XLSX, SQL, multi-table joins, saved sessions or real market backtesting yet. Before extending it, collect the actual input types and feedback, so the interface never shows buttons for things that do not exist.

## Calculation source

The module shared by the website and the source package, so you can inspect the parsing, de-duplication, statistics and export logic directly: [download analysis-core.mjs](/downloads/source/analysis-core.mjs) · [back to the tool](/en/projects/stock-data/)
