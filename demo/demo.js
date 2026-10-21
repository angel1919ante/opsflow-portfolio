(function () {
  "use strict";

  const storageKey = "opsflow-demo-v1";
  const initialState = {
    leads: [
      { id: "lead-1", company: "Juniper Field Services", contact: "Avery Morgan", need: "Replace a spreadsheet dispatch workflow", stage: "new", source: "Website", age: "12 min" },
      { id: "lead-2", company: "Harborline Heating", contact: "Maya Chen", need: "Create one pipeline for estimates and follow-ups", stage: "new", source: "Referral", age: "1 hr" },
      { id: "lead-3", company: "Northstar Dental Group", contact: "Elijah Brooks", need: "Unify intake across three locations", stage: "qualified", source: "Partner", age: "Today" },
      { id: "lead-4", company: "Cedar Works Studio", contact: "Sofia Reyes", need: "Track projects from inquiry to installation", stage: "converted", source: "Direct", age: "Yesterday" }
    ],
    deals: [
      { id: "deal-1", company: "Cedar Works Studio", contact: "Sofia Reyes", stage: "Discovery", next: "Workflow review", value: "$3,800" },
      { id: "deal-2", company: "Evergreen Property Care", contact: "Caleb Foster", stage: "Prototype", next: "Mobile review", value: "$2,450" }
    ],
    tasks: [
      { id: "task-1", title: "Send workflow questions", owner: "Alex Morgan", due: "Today", done: false },
      { id: "task-2", title: "Review mobile prototype", owner: "Alex Morgan", due: "Tomorrow", done: false },
      { id: "task-3", title: "Prepare discovery summary", owner: "Alex Morgan", due: "Friday", done: true }
    ]
  };

  let state = loadState();
  let activeLeadId = null;
  let toastTimer;
  const views = {
    leads: ["Leads", "Move every inquiry forward.", "Add lead"],
    deals: ["Deals", "Keep the next commitment visible.", "Add deal"],
    tasks: ["Tasks", "Turn every promise into an action.", "Add task"],
    inventory: ["Inventory", "Spot operational exceptions early.", "Export view"]
  };

  const pipeline = document.querySelector("#pipeline");
  const dealList = document.querySelector("#deal-list");
  const taskList = document.querySelector("#task-list");
  const leadDialog = document.querySelector("#lead-dialog");
  const detailDialog = document.querySelector("#detail-dialog");
  const taskDialog = document.querySelector("#task-dialog");

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || structuredClone(initialState);
    } catch {
      return structuredClone(initialState);
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function renderPipeline() {
    const query = document.querySelector("#lead-search").value.trim().toLowerCase();
    const stages = [
      ["new", "New inquiry"],
      ["qualified", "Qualified"],
      ["converted", "Converted"]
    ];
    pipeline.innerHTML = stages.map(([key, label]) => {
      const leads = state.leads.filter((lead) => lead.stage === key && `${lead.company} ${lead.contact}`.toLowerCase().includes(query));
      return `<section class="stage" aria-label="${label}">
        <div class="stage-heading"><strong>${label}</strong><span>${leads.length}</span></div>
        <div class="lead-stack">${leads.length ? leads.map((lead) => `<button class="lead-card" data-lead-id="${lead.id}">
          <span class="lead-card-top"><strong>${escapeHtml(lead.company)}</strong><span class="status ${key === "qualified" ? "status-good" : ""}">${key}</span></span>
          <p>${escapeHtml(lead.need)}</p>
          <span class="lead-card-meta"><span>${escapeHtml(lead.contact)}</span><span>${escapeHtml(lead.age)}</span></span>
        </button>`).join("") : `<div class="empty-stage">No matching leads</div>`}</div>
      </section>`;
    }).join("");
  }

  function renderDeals() {
    dealList.innerHTML = state.deals.map((deal) => `<article class="data-row">
      <div><strong>${escapeHtml(deal.company)}</strong><p>${escapeHtml(deal.contact)}</p></div>
      <span>${escapeHtml(deal.stage)}</span><span>${escapeHtml(deal.next)}</span><strong>${escapeHtml(deal.value)}</strong>
    </article>`).join("");
  }

  function renderTasks() {
    taskList.innerHTML = state.tasks.map((task) => `<label class="task-row ${task.done ? "is-done" : ""}">
      <input type="checkbox" data-task-id="${task.id}" ${task.done ? "checked" : ""} />
      <span class="task-copy"><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.owner)}</p></span>
      <span class="due">${escapeHtml(task.due)}</span>
    </label>`).join("");
  }

  function render() {
    renderPipeline();
    renderDeals();
    renderTasks();
    document.querySelector("#lead-count").textContent = state.leads.length;
    document.querySelector("#deal-count").textContent = state.deals.length;
    document.querySelector("#task-count").textContent = state.tasks.filter((task) => !task.done).length;
    document.querySelector("#metric-new").textContent = state.leads.filter((lead) => lead.stage === "new").length;
    document.querySelector("#metric-qualified").textContent = state.leads.filter((lead) => lead.stage === "qualified").length;
    document.querySelector("#metric-converted").textContent = state.leads.filter((lead) => lead.stage === "converted").length;
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function openLead(leadId) {
    const lead = state.leads.find((item) => item.id === leadId);
    if (!lead) return;
    activeLeadId = leadId;
    document.querySelector("#detail-company").textContent = lead.company;
    document.querySelector("#detail-need").textContent = `${lead.contact}: ${lead.need}`;
    document.querySelector("#qualification-error").textContent = "";
    document.querySelector("#qualification-form").reset();
    detailDialog.showModal();
  }

  function setView(view) {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
    document.querySelectorAll(".view").forEach((item) => item.classList.toggle("is-active", item.id === `${view}-view`));
    document.querySelector("#view-label").textContent = views[view][0];
    document.querySelector("#view-title").textContent = views[view][1];
    document.querySelector("#primary-action").textContent = views[view][2];
    document.querySelector("#primary-action").dataset.action = view;
  }

  document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
  document.querySelector("#lead-search").addEventListener("input", renderPipeline);
  pipeline.addEventListener("click", (event) => {
    const card = event.target.closest("[data-lead-id]");
    if (card) openLead(card.dataset.leadId);
  });
  taskList.addEventListener("change", (event) => {
    const task = state.tasks.find((item) => item.id === event.target.dataset.taskId);
    if (task) { task.done = event.target.checked; saveState(); }
  });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelector("#primary-action").addEventListener("click", (event) => {
    if (event.currentTarget.dataset.action === "leads" || !event.currentTarget.dataset.action) leadDialog.showModal();
    else if (event.currentTarget.dataset.action === "tasks") taskDialog.showModal();
    else showToast("This portfolio action is intentionally read-only.");
  });
  document.querySelector("#add-task").addEventListener("click", () => taskDialog.showModal());
  document.querySelector("#reset-demo").addEventListener("click", () => {
    state = structuredClone(initialState);
    localStorage.removeItem(storageKey);
    render();
    setView("leads");
    showToast("Sample workspace reset.");
  });
  document.querySelector("#lead-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.leads.unshift({ id: crypto.randomUUID(), company: form.get("company"), contact: form.get("contact"), need: form.get("need"), stage: "new", source: "Manual", age: "Now" });
    saveState();
    event.currentTarget.reset();
    leadDialog.close();
    showToast("Lead added to the pipeline.");
  });
  document.querySelector("#qualification-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const complete = ["decisionMaker", "workflow", "nextStep"].every((name) => form.get(name) === "on");
    if (!complete) {
      document.querySelector("#qualification-error").textContent = "Complete all qualification checks before conversion.";
      return;
    }
    const lead = state.leads.find((item) => item.id === activeLeadId);
    if (!lead) return;
    lead.stage = "converted";
    state.deals.unshift({ id: crypto.randomUUID(), company: lead.company, contact: lead.contact, stage: "Discovery", next: "Confirm pilot scope", value: "$350" });
    state.tasks.unshift({ id: crypto.randomUUID(), title: `Confirm pilot scope with ${lead.company}`, owner: "Alex Morgan", due: "Tomorrow", done: false });
    saveState();
    detailDialog.close();
    showToast("Lead converted. Follow-up task created.");
  });
  document.querySelector("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.tasks.unshift({ id: crypto.randomUUID(), title: form.get("title"), owner: form.get("owner"), due: form.get("due"), done: false });
    saveState();
    event.currentTarget.reset();
    taskDialog.close();
    showToast("Follow-up task created.");
  });
  [leadDialog, detailDialog, taskDialog].forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  }));

  render();
  const requestedView = location.hash.replace("#", "");
  setView(Object.hasOwn(views, requestedView) ? requestedView : "leads");
})();
