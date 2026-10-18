"use strict";

/* ---------- Data layer: an Array of objects, persisted as JSON ---------- */
const KEY = "expenseTracker.expenses";
const CATEGORIES = ["Food", "Travel", "Study", "Bills", "Other"];
let expenses = load();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY)); // JSON.parse
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  } // corrupt / empty storage
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(expenses)); // JSON.stringify
}

/* ---------- Validation: returns an object of field -> message ---------- */
function validate(data) {
  const errors = {};
  const title = String(data.title ?? "").trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length < 3)
    errors.title = "Title must be at least 3 characters.";
  else if (title.length > 50)
    errors.title = "Title must be 50 characters or fewer.";
  else if (!/^[\w\s.,&'()\-]+$/.test(title))
    errors.title = "Title has invalid characters.";

  const raw = String(data.amount ?? "").trim();
  if (raw === "") errors.amount = "Amount is required.";
  else if (isNaN(Number(raw))) errors.amount = "Amount must be a number.";
  else if (Number(raw) <= 0) errors.amount = "Amount must be greater than 0.";
  else if (Number(raw) > 1000000)
    errors.amount = "Amount cannot exceed ₹10,00,000.";
  else if (!/^\d+(\.\d{1,2})?$/.test(raw))
    errors.amount = "Use at most 2 decimal places.";

  if (!CATEGORIES.includes(data.category))
    errors.category = "Please select a category.";

  if (!data.date) errors.date = "Date is required.";
  else if (isNaN(Date.parse(data.date))) errors.date = "Date is not valid.";
  else if (data.date > today()) errors.date = "Date cannot be in the future.";

  return errors;
}
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- DOM helpers ---------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function showErrors(errors) {
  ["title", "amount", "category", "date"].forEach((f) => {
    $("e-" + f).textContent = errors[f] || "";
    $(f).classList.toggle("bad", Boolean(errors[f]));
  });
}
function banner(msg, ok) {
  const b = $("banner");
  b.textContent = msg;
  b.className = ok ? "ok" : "fail";
  setTimeout(() => (b.className = ""), 3000);
}
function escapeHtml(s) {
  // prevents HTML injection through the title field
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
const newId = () => Date.now() + Math.random().toString(16).slice(2, 6);

/* ---------- Render: uses filter / sort / map / reduce ---------- */
function render() {
  const q = $("search").value.trim().toLowerCase();
  const cat = $("filter").value;
  const [key, dir] = $("sort").value.split("-");

  const visible = expenses
    .filter(
      (e) => (!cat || e.category === cat) && e.title.toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const r =
        key === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return dir === "asc" ? r : -r;
    });

  $("tbody").innerHTML = visible
    .map(
      (e) => `
    <tr>
      <td>${escapeHtml(e.title)}</td><td>${e.category}</td><td>${e.date}</td>
      <td class="amt">${fmt(e.amount)}</td>
      <td><button class="del" data-id="${e.id}" aria-label="Delete ${escapeHtml(e.title)}">Delete</button></td>
    </tr>`,
    )
    .join("");
  $("empty").hidden = visible.length > 0;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCat = expenses.reduce(
    (acc, e) => ((acc[e.category] = (acc[e.category] || 0) + e.amount), acc),
    {},
  );
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  $("s-total").textContent = fmt(total);
  $("s-count").textContent = expenses.length;
  $("s-top").textContent = top ? top[0] : "–";
  $("json").textContent = JSON.stringify(expenses, null, 2);
}

/* ---------- Events ---------- */
$("form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const data = {
    title: $("title").value,
    amount: $("amount").value,
    category: $("category").value,
    date: $("date").value,
  };
  const errors = validate(data);
  showErrors(errors);
  if (Object.keys(errors).length) {
    banner("Not saved. Fix the highlighted fields.", false);
    return;
  }
  expenses.push({
    id: newId(),
    title: data.title.trim(),
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
  });
  save();
  render();
  ev.target.reset();
  $("date").value = today();
  banner("Expense saved.", true);
});

$("tbody").addEventListener("click", (ev) => {
  const id = ev.target.dataset.id;
  if (!id) return;
  expenses = expenses.filter((e) => e.id !== id);
  save();
  render();
});
["search", "filter", "sort"].forEach((id) =>
  $(id).addEventListener("input", render),
);

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(expenses, null, 2));
    banner("JSON copied.", true);
  } catch {
    banner("Copy blocked by the browser. Select the text manually.", false);
  }
});
$("download").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(expenses, null, 2)], { type: "application/json" }),
  );
  Object.assign(document.createElement("a"), {
    href: url,
    download: "expenses.json",
  }).click();
  URL.revokeObjectURL(url);
});
$("clear").addEventListener("click", () => {
  if (expenses.length && confirm("Delete all expenses?")) {
    expenses = [];
    save();
    render();
  }
});

/* Import: parse JSON, then validate EVERY record before saving anything */
$("importBtn").addEventListener("click", () => {
  const out = $("e-import");
  let list;
  if (!$("import").value.trim()) { out.textContent = "Paste a JSON array first."; return; }
  try {
    list = JSON.parse($("import").value);
  } catch (e) {
    out.textContent = "Invalid JSON: " + e.message;
    return;
  }
  if (!Array.isArray(list)) {
    out.textContent = "JSON must be an array of expenses.";
    return;
  }
  for (let i = 0; i < list.length; i++) {
    const errs = Object.values(validate(list[i] || {}));
    if (errs.length) {
      out.textContent = `Record ${i + 1}: ${errs[0]} Nothing was imported.`;
      return;
    }
  }
  list.forEach((e) =>
    expenses.push({
      id: newId(),
      title: e.title.trim(),
      amount: Number(e.amount),
      category: e.category,
      date: e.date,
    }),
  );
  save();
  render();
  out.textContent = "";
  $("import").value = "";
  banner(`${list.length} expense(s) imported.`, true);
});

/* ---------- Init ---------- */
$("date").value = today();
$("date").max = today();
render();
