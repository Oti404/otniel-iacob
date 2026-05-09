# n8n — Ghid de Concepte

## Ce este n8n?

n8n (pronunțat "n-eight-n") este o platformă de automatizare vizuală **open-source** pe care o poți rula pe propriul server. Îți permite să creezi **fluxuri de lucru** (workflows) care conectează diferite servicii și execută logică automată — fără să scrii cod (sau cu puțin cod când e necesar).

**Analogie:** Gândește-te la n8n ca la un set de Lego. Fiecare piesă (nod) face ceva specific. Tu le conectezi în ordinea dorită și obții o automatizare complexă.

---

## Concepte de Bază

### Workflow
Un workflow este o secvență de **noduri** conectate între ele. Se execută de la stânga la dreapta, pornind de la un **trigger**.

```
[Trigger] → [Nod A] → [Nod B] → [Nod C]
```

Datele circulă între noduri ca obiecte JSON. Fiecare nod primește datele de la nodul anterior, le procesează, și le trimite mai departe.

### Nod (Node)
Un nod este o unitate de lucru. Poate:
- Primi o cerere HTTP (Webhook)
- Apela un API extern
- Procesa date (Code, Set, IF)
- Interacționa cu AI (AI Agent)
- Trimite un răspuns

### Trigger
Primul nod dintr-un workflow. El **pornește** execuția. Fără trigger, nimic nu se execută.

### Execuție (Execution)
O rulare completă a workflow-ului de la trigger până la capăt. Poți vedea istoricul execuțiilor în tab-ul "Executions" din n8n.

---

## Noduri Folosite în Proiect

### Chat Trigger (`@n8n/n8n-nodes-langchain.chatTrigger`)
Trigger special pentru conversații AI. Expune un endpoint HTTP la care poți trimite mesaje.

**Cum funcționează:**
- Când primește un request cu `{ action: "sendMessage", sessionId: "...", chatInput: "..." }`, pornește workflow-ul
- `chatInput` = mesajul utilizatorului
- `sessionId` = identificatorul sesiunii de conversație (pentru memorie)
- Returnează automat outputul ultimului nod executat ca răspuns

**URL format:**
```
POST http://n8n:5678/webhook/{webhookId}/chat
```

**Important:** Chat Trigger ≠ Webhook normal. Respond to Webhook nu funcționează cu Chat Trigger — n8n returnează automat outputul ultimului nod.

### HTTP Request
Apelează un URL extern. Folosit în workflow pentru:
1. GET `http://backend:3000/api/internal/contributors` — obține lista de contributori existenți
2. POST `http://backend:3000/api/internal/projects` — publică un proiect nou

**Autentificare:** Am adăugat header-ul `x-internal-key` pentru a autentifica cererile de la n8n spre backend.

### AI Agent (`@n8n/n8n-nodes-langchain.agent`)
Nod de inteligență artificială. Are nevoie de:
- **Language Model** (conectat ca sub-nod) — modelul AI care procesează textul
- **Memory** (opțional, conectat ca sub-nod) — pentru a ține minte conversațiile anterioare
- **System Message** — instrucțiunile date AI-ului (cum se comportă, ce face)
- **Prompt (User Message)** — mesajul utilizatorului curent

Outputul AI Agent-ului este un obiect `{ output: "textul_raspunsului" }`.

### Google Gemini Chat Model
Sub-nodul conectat la AI Agent care specifică ce model AI să folosești.
- Model folosit: `models/gemini-2.5-pro`
- Necesită credențiale API (cheie Google AI)

### Postgres Chat Memory
Sub-nodul care stochează istoricul conversației în PostgreSQL.
- Folosește `sessionId` pentru a separa conversațiile
- `contextWindowLength: 10` = ține minte ultimele 10 schimburi
- Fără memory, AI-ul ar uita tot la fiecare mesaj

### IF
Nod de ramificare. Evaluează o condiție și trimite datele pe ramura **True** sau **False**.

**Condiția noastră:**
- `$json.output` contains `"status":` → True (AI-ul a generat JSON de confirmare)
- Altfel → False (răspuns conversațional normal)

**De ce `"status":` și nu `"CONFIRM"`?**
Inițial am verificat dacă outputul conține cuvântul "CONFIRM". Problema: mesajul de summary generat de AI include textul "Type CONFIRM to publish" — deci condiția era adevărată și pentru mesajele normale! Soluția: verificăm dacă outputul conține `"status":` (cu ghilimele), care apare DOAR în JSON-ul generat la confirmare.

### Code (JavaScript)
Execută cod JavaScript arbitrar în cadrul workflow-ului.

**Codul nostru:**
```javascript
const raw = $input.first().json.output;
const cleaned = raw.replace(/```json\n?/, '').replace(/```/g, '').trim();
return [{ json: JSON.parse(cleaned) }];
```

Ce face:
1. Ia textul generat de AI (care poate fi învelit în ` ```json ... ``` `)
2. Elimină delimitatorii Markdown
3. Parsează JSON-ul
4. Returnează obiectul curățat pentru HTTP Request

### Set
Nod simplu care setează câmpuri pe obiectul de date.

**Folosit pentru:** După ce proiectul e publicat cu succes, returnăm `{ output: "Project published successfully." }` — un mesaj pe care Angular îl va afișa în chat.

---

## Draft vs. Published vs. Active

Acesta este unul din cele mai confuze aspecte din n8n. Există trei stări separate:

### Draft (Ciornă)
- Workflow-ul a fost modificat dar modificările nu sunt "oficializate"
- Webhookurile NU sunt înregistrate
- Execuțiile de test merg, dar nu și cele de producție

### Published (Publicat)
- Versiunea curentă a workflow-ului e marcată ca oficială
- Se face prin butonul **"Publish"** din editor
- **Nu înseamnă că e activ!**

### Active (Activ)
- Workflow-ul e pornit și webhookurile sunt înregistrate în sistem
- Se face prin **toggle-ul Inactive/Active** din dreapta sus a editorului
- Fără asta, orice request la webhook returnează 404

**Regulă:** Pentru ca un webhook să funcționeze în producție trebuie să fie și **Published** și **Active**.

---

## Cum Circulă Datele între Noduri

Fiecare nod primește și returnează un **array de items**. Un item = un obiect JSON.

**Exemplu:**
```javascript
// Ce primește AI Agent de la HTTP Request (contributors):
[
  { json: { data: [{ id: 1, name: "Robert Hatos", link: "..." }, ...] } }
]

// Ce returnează AI Agent:
[
  { json: { output: "Ce proiect vrei să adaugi?" } }
]
```

**Accesarea datelor dintr-un nod anterior:**
- `$json` = datele din nodul anterior direct
- `$('Nume Nod').item.json` = datele dintr-un nod specific (după nume)
- `$input.first().json` = primul item din input (util în Code node)

---

## Expresii n8n

n8n folosește `{{ }}` pentru expresii dinamice, similar cu template literals din JavaScript.

**Exemple:**
```
{{ $json.output }}                          → valoarea câmpului output
{{ $('AI Agent').item.json.output }}        → output-ul de la nodul "AI Agent"
{{ $now.format('MMMM D, YYYY') }}           → data curentă formatată
{{ $('HTTP Request').item.json.data.toJsonString() }}  → JSON ca string
```

**Atenție:** Expresiile funcționează DOAR când câmpul e în **Expression Mode** (iconița `{}`). Dacă câmpul e în mod static (text normal), `{{ }}` e tratat ca text literal — nu e evaluat!

---

## Credențiale

Credențialele (chei API, parole) sunt stocate **criptat** în baza de date n8n — nu în codul workflow-ului.

**Ce credențiale am configurat:**
- **Google Gemini API** — pentru AI Agent (cheia e în Google AI Studio)
- **PostgreSQL** — pentru Postgres Chat Memory (conexiunea la baza de date)

**Important:** La export/import workflow, credențialele NU se exportă. Trebuie re-configurate manual pe fiecare instanță n8n (local și AWS).

---

## Workflow-ul Nostru — Explicat Pas cu Pas

```
[Chat Trigger]
    ↓
    Primește: { chatInput: "mesajul utilizatorului", sessionId: "abc123" }
    
[HTTP Request — GET contributors]
    ↓
    Apelează backend-ul pentru lista de contributori existenți
    Returneaza: { data: [{ id: 1, name: "Robert", link: "..." }] }
    
[AI Agent — Gemini 2.5 Pro]
    ↓
    System prompt: instrucțiunile complete de intake
    User prompt: mesajul utilizatorului (din Chat Trigger)
    Memory: ultimele 10 schimburi din conversație (din PostgreSQL)
    Context: lista de contributori (din HTTP Request)
    Returnează: { output: "textul_raspunsului" }
    
[IF — "status": în output?]
    ↓ True (JSON de proiect)              ↓ False (răspuns normal)
    
[Code — parsează JSON]              [Capăt — Chat Trigger returnează
    ↓                                automat output-ul AI Agent]
[HTTP Request — POST project]
    ↓
[Set — output: "Project published."]
    ↓
[Capăt — Chat Trigger returnează "Project published."]
```

---

## Ce Mai Trebuie Să Înveți despre n8n

- **Error Handling** — ce se întâmplă când un nod eșuează (nod de eroare, retry)
- **Sub-workflows** — workflow-uri care apelează alte workflow-uri
- **Schedule Trigger** — automatizări pe bază de timp (cron)
- **Variables** — variabile globale între execuții
- **Queue Mode** — pentru volume mari de execuții
- **n8n CLI** — import/export workflow-uri din linie de comandă (util pentru deploy automat)
