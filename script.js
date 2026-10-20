function getElementById(id) {
  return document.getElementById(id);
}

const addMemberForm = getElementById("add-member-form");
const p = getElementById("member-error-msg");
const expenseTitleInput = getElementById("expense-title-input");
const expenseAmountInput = getElementById("expense-amount-input");
const expensePayerSelect = getElementById("expense-payer-select");
const addExpenseBtn = getElementById("add-expense-btn");
const expenseValidationHint = getElementById("expense-validation-hint");
const splitMemberCheckbox = document.querySelectorAll("split-member-checkbox");
const splitMembersContainer = getElementById("split-members-container");
const splitSelectAllBtn = getElementById("split-select-all-btn");
const splitClearAllBtn = getElementById("split-clear-all-btn");
const addExpenseForm = getElementById("add-expense-form");

const MEMBERS_LOCALSTORAGE_KEY = "members";
const EXPENSE_LOCALSTORAGE_KEY = "expenses";
const BADGE_COLORS = ["#2F6B4F", "#3D5A80", "#8C5E58", "#6A7B76"];

let allMembers = getItems(MEMBERS_LOCALSTORAGE_KEY);
let expenses = getItems(EXPENSE_LOCALSTORAGE_KEY);

function getItems(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setItems(key, item) {
  localStorage.setItem(key, JSON.stringify(item));
}

function getRandomBadgeColor() {
  let randomIndex = Math.floor(Math.random() * BADGE_COLORS.length);
  return BADGE_COLORS[randomIndex];
}

addMemberForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = getElementById("member-name-input").value.trim();
  p.classList.add("hidden");
  if (!value) {
    p.textContent = "Please enter a name.";
    p.classList.remove("hidden");
    return;
  }

  const isMemberAlreadyExist = allMembers.some(
    ({ name }) => name.toLowerCase() === value.toLowerCase(),
  );
  if (isMemberAlreadyExist) {
    p.textContent = "A member with this name already exists.";
    p.classList.remove("hidden");
    return;
  }

  allMembers = [...allMembers, { name: value, id: `mem_${Date.now()}` }];
  console.log(allMembers);
  setItems(MEMBERS_LOCALSTORAGE_KEY, allMembers);

  getElementById("member-name-input").value = "";
  renderAll();
});

function renderMembers() {
  const membersList = getElementById("members-list");
  membersList.innerHTML = "";
  expenseMembersWarning.classList.remove("hidden");
  addExpenseForm.classList.add("hidden");
  getElementById("members-count").textContent = `${allMembers.length} members`;

  if (!allMembers.length) {
    getElementById("members-empty").classList.remove("hidden");
    membersList.classList.add("hidden");
    return;
  }

  getElementById("members-empty").classList.add("hidden");
  membersList.classList.remove("hidden");

  allMembers.forEach(({ id, name }) => {
    let li = document.createElement("li");
    li.innerHTML = `
    <li class="flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors gap-2">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium text-white shrink-0 select-none" style="background-color: #2F6B4F;">
                    ${name[0].toUpperCase()}
                  </span>
                  <span class="font-sans text-sm font-medium text-ledger-ink truncate break-words">${name}</span>
                </div>
                <button type="button" class="remove-member-btn text-ledger-muted hover:text-ledger-rust p-2 rounded-sm transition-colors cursor-pointer shrink-0 ml-2 min-w-[36px] min-h-[36px] flex items-center justify-center" data-id=${id} title="Remove ram" aria-label="Remove ram">
                  <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
    `;

    membersList.append(li);
  });

  membersList.addEventListener("click", (e) => {
    e.stopPropagation();
    const remMemBtn = e.target.closest(".remove-member-btn");
    if (remMemBtn) {
      p.classList.add("hidden");
      const id = remMemBtn.dataset.id;
      const isExpRecordExist = expenses.some((exp) => {
        if (exp.payer === id || exp.splitMember.includes(id)) {
          return exp;
        }
      });
      if (isExpRecordExist) {
        p.classList.remove("hidden");
        p.textContent =
          "Cannot remove member included in recorded expenses. Remove their expenses first.";
        return;
      }
      allMembers = allMembers.filter(({ id: memId }) => memId !== id);
      setItems(MEMBERS_LOCALSTORAGE_KEY, allMembers);
      renderAll();
    }
  });

  expensePayerSelect.innerHTML = "";
  splitMembersContainer.innerHTML = "";
  if (allMembers.length < 2) {
    expenseMembersWarning.classList.remove("hidden");
    addExpenseForm.classList.add("hidden");
    addExpenseFormReset();
  } else {
    expenseMembersWarning.classList.add("hidden");
    addExpenseForm.classList.remove("hidden");

    allMembers.forEach(({ id, name }) => {
      let option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      expensePayerSelect.append(option);

      let label = document.createElement("label");
      label.className =
        "flex items-center gap-2.5 text-xs font-sans text-ledger-ink cursor-pointer hover:bg-slate-100/60 px-2 py-2 rounded-sm select-none border border-transparent hover:border-ledger-border transition-colors min-h-[36px]";

      label.innerHTML = `<input type="checkbox" value=${id} class="split-member-checkbox rounded-sm text-ledger-forest accent-[#2F6B4F] cursor-pointer w-4 h-4 shrink-0" checked>
                  <span class="truncate break-all min-w-0">${name}</span>`;
      splitMembersContainer.append(label);
    });
  }

  validateAddExpenseForm();
  renderBalance();
}

const expenseMembersWarning = getElementById("expense-members-warning");

let isValid = false;

function validateAddExpenseForm() {
  const title = expenseTitleInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);
  const payer = expensePayerSelect.value;
  console.log(payer);
  const isValidAmount = amount > 0;
  const selectedCount =
    splitMembersContainer.querySelectorAll("input:checked").length;
  const isValidSelectedCount = selectedCount > 0;

  isValid = title && isValidAmount && isValidSelectedCount && payer;
  addExpenseBtn.disabled = !isValid;

  if (!title) {
    expenseValidationHint.textContent = "Enter expense title";
  } else if (!isValidAmount) {
    expenseValidationHint.textContent = "Enter a valid amount";
  } else if (!payer) {
    expenseValidationHint.textContent = `Please select payer`;
  } else if (selectedCount < 1) {
    expenseValidationHint.textContent = "Select at least 1 person to split";
  } else if (selectedCount > 1) {
    expenseValidationHint.textContent = `Splitting between ${selectedCount} people`;
  } else if (selectedCount == 1) {
    expenseValidationHint.textContent = `Splitting between 1 person`;
  } else if (!payer) {
    expenseValidationHint.textContent = `Please select payer`;
  }
}

[expenseTitleInput, expenseAmountInput].forEach((ele) => {
  ele.addEventListener("input", validateAddExpenseForm);
});

splitMembersContainer.addEventListener("change", validateAddExpenseForm);
expensePayerSelect.addEventListener("change", validateAddExpenseForm);

function splitCheckboxToggle(checked) {
  const checkedInputs = splitMembersContainer.querySelectorAll("input");

  checkedInputs.forEach((e) => (e.checked = checked));

  validateAddExpenseForm();
}

splitClearAllBtn.addEventListener("click", () => splitCheckboxToggle(false));

splitSelectAllBtn.addEventListener("click", () => splitCheckboxToggle(true));

addExpenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!isValid) {
    return;
  }

  const title = expenseTitleInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);
  const payer = expensePayerSelect.value;
  // const splitMember = [];
  // splitMembersContainer.querySelectorAll("input:checked").forEach((e) => {
  //   splitMember.push(e.value);
  // });
  let splitMember = Array.from(
    splitMembersContainer.querySelectorAll("input:checked"),
  ).map((e) => e.value);

  expenses.push({
    id: `exp_${Date.now()}`,
    title,
    amount: amount.toFixed(2),
    payer,
    splitMember,
  });

  setItems(EXPENSE_LOCALSTORAGE_KEY, expenses);
  addExpenseFormReset();
  renderAll();
});

function addExpenseFormReset() {
  expenseTitleInput.value = "";
  expenseAmountInput.value = "";
  expensePayerSelect.value = "";
}

const expensesEmpty = getElementById("expenses-empty");
const expensesList = getElementById("expenses-list");
const expensesCount = getElementById("expenses-count");

function getNameById(id) {
  const result = allMembers.find((mem) => mem.id == id);
  return result.name || "Anonymous";
}

function renderExpense() {
  expensesList.innerHTML = "";
  const totalExpense = expenses.length;
  expensesCount.textContent = `${totalExpense} expenses`;
  if (!totalExpense) {
    expensesEmpty.classList.remove("hidden");
    expensesList.classList.add("hidden");
    return;
  }

  expensesEmpty.classList.add("hidden");
  expensesList.classList.remove("hidden");

  expenses.map(({ id, title, amount, payer, splitMember }) => {
    const li = document.createElement("li");
    const splitMemberNames = splitMember
      .map((mem) => getNameById(mem))
      .join(", ");
    li.className = "py-3 px-1 hover:bg-slate-100/50 transition-colors";

    li.innerHTML = `
                <div class="flex items-start justify-between gap-3 sm:gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
                      <h3 class="font-sans text-sm sm:text-base font-semibold text-ledger-ink break-words min-w-0">
                        ${title}
                      </h3>
                      <div class="flex items-baseline gap-2 shrink-0 self-start sm:self-auto">
                        <span class="font-mono text-sm sm:text-base font-semibold text-ledger-ink">
                          ₹${amount}
                        </span>
                        <span class="font-mono text-xs text-ledger-muted">
                          (₹${amount / splitMember.length} / person)
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ledger-muted font-sans">
                      <span>Paid by <strong class="font-medium text-ledger-ink">${getNameById(payer)}</strong></span>
                      <span class="text-ledger-border">•</span>
                      <span>Split between: <span class="text-ledger-ink font-medium break-words">${splitMemberNames}</span></span>
                    </div>
                  </div>
                  <button type="button" class="delete-expense-btn text-ledger-muted hover:text-ledger-rust p-2 rounded-sm transition-colors cursor-pointer shrink-0 ml-1 min-w-[36px] min-h-[36px] flex items-center justify-center" data-id=${id} title="Delete Groceries" aria-label="Delete Groceries">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div> 
                `;

    expensesList.append(li);
  });

  expensesList.addEventListener("click", (e) => {
    e.stopPropagation();

    const dltExpBtn = e.target.closest(".delete-expense-btn");

    if (dltExpBtn) {
      const id = dltExpBtn.dataset.id;
      expenses = expenses.filter(({ id: expId }) => expId !== id);
      setItems(EXPENSE_LOCALSTORAGE_KEY, expenses);
      renderExpense();
      renderAll();
    }
  });
}

const balancesList = getElementById("balances-list");
const balancesHelperText = getElementById("balances-helper-text");
const balancesEmpty = getElementById("balances-empty");

function renderBalance() {
  balancesList.innerHTML = "";

  if (!allMembers.length) {
    balancesList.classList.add("hidden");
    balancesHelperText.classList.add("hidden");
    balancesEmpty.classList.remove("hidden");
    return;
  }

  balancesList.classList.remove("hidden");
  balancesHelperText.classList.remove("hidden");
  balancesEmpty.classList.add("hidden");

  allMembers.map(({ id, name }) => {
    let paid = 0;
    let owed = 0;

    expenses.forEach(({ amount, splitMember, payer }) => {
      const expAmount = Number(amount);
      if (payer === id) {
        paid = paid + expAmount;
      }
      if (splitMember.includes(id) && splitMember.length > 0) {
        owed = owed + expAmount / splitMember.length;
      }
    });

    let net = paid - owed;
    let statusElement = `<span class="text-ledger-muted">settled up</span>`;
    if (net > 0) {
      statusElement = `<span class="text-ledger-forest font-medium">gets back ₹${Math.abs(net)}</span>`;
    } else if (net < 0) {
      statusElement = `<span class="text-ledger-rust font-medium">owes ₹${Math.abs(net)}</span>`;
    }

    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors gap-3";
    li.innerHTML = `
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium text-white shrink-0 select-none" style="background-color: #8C5E58;">
                   ${name[0].toUpperCase()}
                  </span>
                  <span class="font-sans text-sm font-medium text-ledger-ink truncate break-words">${name}</span>
                </div>
                <div class="font-mono text-sm shrink-0 ml-2 text-right">
                  ${statusElement}
                </div> 
                `;
    balancesList.append(li);
  });
}

function renderAll() {
  p.classList.add("hidden");
  renderMembers();
  renderExpense();
  renderBalance();
}

renderAll();