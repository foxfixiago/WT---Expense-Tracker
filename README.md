# Expense Tracker

A web application built with plain HTML, CSS and JavaScript to demonstrate the capabilities of JavaScript.
It stores data in a **JSON array**, **validates every entry before saving**, and shows clear **error messages**.

**Course:** 2304362L-SV26-27 | **Assignment:** 2 | **Student:** Om Gupta (PRN: ________)

## Features

- Add an expense with title, amount, category and date
- Validation before saving, with a specific error message under each field
- Search by title, filter by category, sort by date or amount
- Live summary: total spent, number of entries, top category
- Delete individual expenses or clear all
- Data persists after refresh (saved in `localStorage` as JSON)
- Export data as a `.json` file, copy it, or import JSON (every record is validated; nothing is imported if one is invalid)

## JavaScript concepts demonstrated

| Concept | Where it is used |
|---|---|
| Arrays of objects | `expenses` array holds all records |
| Array methods | `filter`, `sort`, `map`, `reduce`, `push` for search, sorting, table rendering and totals |
| JSON | `JSON.stringify` to save and export, `JSON.parse` to load and import |
| Validation | `validate()` checks each field and returns an object of error messages |
| Error handling | `try/catch` around JSON parsing and clipboard access |
| DOM manipulation | Table, stats and error messages are updated dynamically |
| Event handling | Form submit, input, click, event delegation on the table |
| Regular expressions | Title characters and amount format checks |
| Browser storage | `localStorage` |
| Security | `escapeHtml()` prevents HTML injection through the title field |

## Validation rules

| Field | Rules |
|---|---|
| Title | Required, 3 to 50 characters, letters, digits and basic punctuation only |
| Amount | Required, numeric, greater than 0, at most 1,000,000, at most 2 decimal places |
| Category | Must be one of Food, Travel, Study, Bills, Other |
| Date | Required, valid date, cannot be in the future |

## Data format

```json
[
  {
    "id": "179234093929020c6",
    "title": "Biryani",
    "amount": 150.55,
    "category": "Food",
    "date": "2026-10-18"
  }
]
```

## Project structure

```
expense-tracker/
├── index.html   # page structure
├── style.css    # styling
├── script.js    # all logic: data, validation, rendering, events
└── README.md
```

## How to run

1. Download or clone the folder.
2. Open `index.html` in any modern browser. No installation or server is needed.

The heading font (Fraunces) loads from Google Fonts. Offline, the page falls back to Georgia.

## Testing checklist

- Submit with all fields empty: four error messages appear
- Amount `abc`, `-5` and `10.999` each give a different error
- Future date is rejected
- Refresh the page: saved expenses are still there
- Import `[{"title":"x","amount":5}]`: rejected with a message, nothing imported
