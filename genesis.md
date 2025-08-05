```text
# CONTEXT
We already have a working ai-widget prototype (map + timeline + warnings).
Wrap it in “FreshCity Logistics CRM”, preload realistic data, keep ids in ai-widget.*.

# ALWAYS
— Tailwind via CDN, no build tools.  
— Do NOT rename or delete ids/classes inside ai-widget.  
— index.html must open by double-click.

# DATA (insert as JSON files in /data)

1. routes.json  ← 24 couriers
[
  { "id":"A","name":"Miguel Silva","stops":11,"km":35,"risk":"High" },
  { "id":"B","name":"Inês Ramos","stops":10,"km":32,"risk":"Low" },
  { "id":"C","name":"João Costa","stops":12,"km":38,"risk":"Med" },
  ... /* up to id":"X" */
]

2. orders.json  ← 150 rows (snippet)
[
  { "orderId":"FC-12001","customer":"Sofia Monteiro","address":"Av. da Liberdade 245","slot":"07–10","temp":"COLD","status":"Packed","courier":"A" },
  { "orderId":"FC-12002","customer":"Ricardo Lima","address":"Rua Augusta 210","slot":"10–13","temp":"FRESH","status":"Picking","courier":"" },
  ...
]

3. stops_A.json  ← Today stops for courier A (11 pts)
[
  {"id":1,"eta":"08:00","addr":"Warehouse Alvalade","lat":38.758,"lon":-9.139},
  {"id":2,"eta":"08:25","addr":"Av. da Liberdade 245","lat":38.723,"lon":-9.144,"warning":"Call before delivery"},
  {"id":3,"eta":"08:45","addr":"Praça do Comércio 88","lat":38.707,"lon":-9.136,"ai":"Optimised"},
  {"id":4,"eta":"09:05","addr":"Rua Augusta 210","lat":38.710,"lon":-9.139,"warning":"Traffic jam risk"},
  {"id":5,"eta":"09:25","addr":"Rua do Ouro 131","lat":38.709,"lon":-9.136,"ai":"Optimised"},
  {"id":6,"eta":"09:45","addr":"Rua Prata 78","lat":38.710,"lon":-9.135,"warning":"Better to deliver evening"},
  {"id":7,"eta":"10:25","addr":"Warehouse Alvalade","lat":38.758,"lon":-9.139}
]

4. summary_base.json
{
 "routesOptimised":3,
 "stopsMerged":2,
 "callsScheduled":1,
 "timeSavedMin":42,
 "successDelta":7.2,
 "spoilageDelta":-0.8,
 "effGainPct":15
}

# TASKS
────────────────────────────────────────────

## 1. index.html  – CRM shell
(header + sidebar + <main id="content"> as described previously)

## 2. app.js  – SPA router
– Sidebar links fetch `/partials/{page}.html` into #content.  
– On first load → orders.html.  
– When page==='ai-widget', call initAI().

## 3. partials
orders.html  • routes.html  • live-map.html  • cold-chain.html  • reports.html  • settings.html  
Fill each with enough HTML rows/cards to create vertical scroll.  
Use orders.json & routes.json for real rows.

## 4. ai-widget.html  (move existing body)  
Add:
```

## 5. ai-widget.js  – new logic

- Load routes.json, orders.json, stops\_{courier}.json on demand.
- renderOverview(): draw all 24 polylines thin (`class="thin-route"`), fill route-list table.
- setFocus(id): highlight one route (stroke-4), dim others; open timeline drawer; update KPI-snap with courier km & success%.
- backToOverview(): hide drawer, redraw thin-layer, KPI-snap returns to totals.
- KPI-snap totals: **120 km**, 4.0 km/stop, 92 %. After `Run AI` → **90 km**, 3.5 km/stop, 99.2 %.
- Inject Summary cards using summary\_base.json ➜ each card clickable → show modal with UL of addresses (use ids from stops\_A).
- Warning handlers:
  - “Call before delivery” ⇒ change badge to “Call scheduled”, increment callsScheduled.
  - “Traffic jam risk”    ⇒ move stop to Tomorrow, decrement km 3, success +0.4.
  - “Deliver evening”     ⇒ move stop to 19:00, shift Warehouse to 20:15, km –2.
  - After each, call updateKPI() and re-render Summary numbers (animate counter).

## 6. Map style

- .thin-route = strokeWidth 1, opacity .3
- .highlight-route = strokeWidth 4, opacity 1
- Tomorrow segments dotted (`dashArray:"6 4"`)

## 7. KPI glow CSS

```css
@keyframes glow {0%{box-shadow:0 0 0 #22c55e80}50%{box-shadow:0 0 10px #22c55e}100%{box-shadow:0 0 0 #22c55e00}}
.kpi-glow{animation:glow .8s ease-in-out;}
```

Apply class on KPI update, remove after 0.8 s.

## DONE checklist

✓ Sidebar nav works, orders/routes tables use JSON.\
✓ AI Optimiser opens with 24 routes overview.\
✓ Click row → focus, timeline, KPI update.\
✓ Warnings apply: Call ➜ badge; Traffic ➜ Tomorrow; Evening ➜ 19 h + warehouse shift.\
✓ Summary cards update counters; modal lists concrete addresses.\
✓ Export PDF button prints current AI view.

```
```
