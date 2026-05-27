const memberNames = [
  "최동일",
  "신정은",
  "엄승열",
  "나영미",
  "엄미선",
  "이성규",
  "최민영",
  "주수지",
  "김선영",
];

const members = memberNames.map((name, index) => ({
  id: `member-${index + 1}`,
  name,
}));

const categories = [
  { id: "coffee", name: "COFFEE" },
  { id: "cold-brew", name: "COLD BREW" },
  { id: "signature", name: "SIGNATURE" },
  { id: "ade", name: "ADE" },
  { id: "non-coffee", name: "NON COFFEE" },
  { id: "tea", name: "TEA" },
];

const menu = [
  { id: "americano", category: "coffee", name: "아메리카노", price: 2500, sizes: { S: 1500, R: 2500, L: 3500 }, bean: true },
  { id: "cafe-latte", category: "coffee", name: "카페라떼", price: 3300, bean: true },
  { id: "vanilla-bean-latte", category: "coffee", name: "수제 바닐라빈 라떼", price: 4000 },
  { id: "condensed-milk-latte", category: "coffee", name: "연유 라떼", price: 3800 },
  { id: "hazelnut-latte", category: "coffee", name: "헤이즐넛 라떼", price: 3800 },
  { id: "cinnamon-latte", category: "coffee", name: "시나몬 라떼", price: 3800, temperatures: ["HOT"], note: "Only HOT" },
  { id: "coconut-latte", category: "coffee", name: "코코넛 라떼", price: 3800, temperatures: ["ICE"], note: "Only ICE" },
  { id: "soso-latte", category: "coffee", name: "소소 라떼", price: 3800 },
  { id: "cold-brew", category: "cold-brew", name: "콜드 브루", price: 3300, temperatures: ["ICE"] },
  { id: "cold-brew-latte", category: "cold-brew", name: "콜드 브루 라떼", price: 3800, temperatures: ["ICE"] },
  { id: "condensed-cold-brew", category: "cold-brew", name: "연유 콜드 브루", price: 4300, temperatures: ["ICE"] },
  { id: "soso-spanner", category: "signature", name: "소소슈페너", price: 4000 },
  { id: "signature-choco", category: "signature", name: "시그니처 초코", price: 5000 },
  { id: "cafe-mocha", category: "signature", name: "카페 모카", price: 5000 },
  { id: "strawberry-latte", category: "signature", name: "딸기라떼", price: 4500 },
  { id: "lemon-ade", category: "ade", name: "레몬 에이드", price: 4000, temperatures: ["ICE"] },
  { id: "grapefruit-ade", category: "ade", name: "자몽 에이드", price: 4000, temperatures: ["ICE"] },
  { id: "green-grape-ade", category: "ade", name: "청포도 에이드", price: 4000, temperatures: ["ICE"] },
  { id: "grapefruit-hibiscus-ade", category: "ade", name: "자몽 히비스커스 에이드", price: 4000, temperatures: ["ICE"] },
  { id: "toffee-nut-latte", category: "non-coffee", name: "토피넛 라떼", price: 3800 },
  { id: "green-tea-latte", category: "non-coffee", name: "그린티 라떼", price: 3800 },
  { id: "misugaru-latte", category: "non-coffee", name: "미숫가루 라떼", price: 3800, temperatures: ["ICE"], note: "Only ICE" },
  { id: "earl-grey-milk-tea", category: "non-coffee", name: "얼그레이 밀크티", price: 4000 },
  { id: "earl-grey-peach-iced-tea", category: "tea", name: "얼그레이 복숭아 아이스티", price: 3000, temperatures: ["ICE"] },
  { id: "grapefruit-hibiscus-tea", category: "tea", name: "자몽 히비스커스티", price: 3500 },
  { id: "earl-grey", category: "tea", name: "얼그레이", price: 3000 },
  { id: "chamomile", category: "tea", name: "캐모마일", price: 3000 },
  { id: "peppermint", category: "tea", name: "페퍼민트", price: 3000 },
  { id: "rooibos-caramel", category: "tea", name: "루이보스 카라멜 티", price: 3000 },
];

const additions = [
  { id: "shot", name: "샷 추가", price: 500 },
  { id: "decaf", name: "디카페인 변경", price: 700 },
  { id: "oat", name: "오트밀크 변경", price: 1000 },
];

const state = {
  screen: "member",
  selectedMember: null,
  selectedMenu: null,
  category: "coffee",
  draft: null,
  orders: {},
};

const currency = new Intl.NumberFormat("ko-KR");
const screen = document.querySelector("#screen");

function money(value) {
  return `${currency.format(value)}원`;
}

function getMenu(menuId) {
  return menu.find((item) => item.id === menuId);
}

function defaultDraft(item) {
  const temperatures = item.temperatures || ["ICE", "HOT"];
  return {
    temperature: temperatures[0],
    size: item.sizes ? "R" : "R",
    bean: item.bean ? "소소 시그니처 블렌드" : "",
    additions: [],
    memo: "",
  };
}

function totalPrice(item, draft) {
  const drinkPrice = item.sizes ? item.sizes[draft.size] : item.price;
  return drinkPrice + draft.additions.reduce((sum, id) => sum + additions.find((option) => option.id === id).price, 0);
}

async function loadOrders() {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("offline");
    const data = await response.json();
    state.orders = data.orders || {};
  } catch {
    state.orders = JSON.parse(localStorage.getItem("soso-orders") || "{}");
  }
}

async function saveOrder(order) {
  state.orders[order.memberId] = order;
  localStorage.setItem("soso-orders", JSON.stringify(state.orders));
  try {
    const response = await fetch(`/api/orders/${order.memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (response.ok) {
      state.orders[order.memberId] = await response.json();
    }
  } catch {
    // Local storage keeps the app usable during a temporary connection issue.
  }
}

function setStep(step) {
  document.querySelectorAll("[data-step-indicator]").forEach((element) => {
    element.classList.toggle("active", element.dataset.stepIndicator === step);
  });
}

function selectMember(member) {
  state.selectedMember = member;
  const saved = state.orders[member.id];
  if (saved) {
    state.selectedMenu = getMenu(saved.menuId);
    state.draft = {
      temperature: saved.temperature,
      size: saved.size,
      bean: saved.bean,
      additions: saved.additions || [],
      memo: saved.memo || "",
    };
    renderDone(saved);
    return;
  }
  state.selectedMenu = null;
  state.draft = null;
  renderMenu();
}

function renderMembers() {
  state.screen = "member";
  setStep("member");
  const view = document.querySelector("#member-screen").content.cloneNode(true);
  const submitted = Object.keys(state.orders).length;
  view.querySelector(".submitted-count").textContent = `${submitted} / ${members.length} 제출`;
  const grid = view.querySelector(".member-grid");

  members.forEach((member) => {
    const hasOrder = Boolean(state.orders[member.id]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `member-button${hasOrder ? " submitted" : ""}`;
    button.innerHTML = `${member.name}<small class="member-status">${hasOrder ? "제출 완료" : "선택하기"}</small>`;
    button.addEventListener("click", () => selectMember(member));
    grid.append(button);
  });

  const orderList = view.querySelector(".order-list");
  const orders = members.map((member) => state.orders[member.id]).filter(Boolean);
  if (orders.length === 0) {
    orderList.innerHTML = '<p class="empty-orders">아직 제출된 주문이 없어요.</p>';
  } else {
    orders.forEach((order) => {
      const line = document.createElement("div");
      line.className = "order-item";
      line.innerHTML = `<strong>${order.memberName}</strong><span>${order.menuName} · ${money(order.total)}</span>`;
      orderList.append(line);
    });
  }

  const totals = view.querySelector(".totals");
  const grouped = orders.reduce((result, order) => {
    result[order.menuName] = (result[order.menuName] || 0) + 1;
    return result;
  }, {});
  Object.entries(grouped).forEach(([name, count]) => {
    const line = document.createElement("div");
    line.className = "totals-line";
    line.innerHTML = `<span>${name}</span><strong>${count}잔</strong>`;
    totals.append(line);
  });
  if (orders.length) {
    const amount = orders.reduce((sum, order) => sum + order.total, 0);
    const line = document.createElement("div");
    line.className = "totals-line totals-price";
    line.innerHTML = `<span>예상 합계</span><strong>${money(amount)}</strong>`;
    totals.append(line);
  }

  view.querySelector(".refresh-button").addEventListener("click", async () => {
    await loadOrders();
    renderMembers();
  });

  screen.replaceChildren(view);
}

function renderMenu() {
  state.screen = "menu";
  setStep("menu");
  const view = document.querySelector("#menu-screen").content.cloneNode(true);
  view.querySelector(".selected-member-title").textContent = `${state.selectedMember.name}님의 음료`;
  view.querySelector(".back-button").addEventListener("click", renderMembers);

  const tabs = view.querySelector(".category-tabs");
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-button${state.category === category.id ? " active" : ""}`;
    button.textContent = category.name;
    button.addEventListener("click", () => {
      state.category = category.id;
      renderMenu();
    });
    tabs.append(button);
  });

  const list = view.querySelector(".menu-list");
  menu.filter((item) => item.category === state.category).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-button";
    button.innerHTML = `<span><span class="menu-name">${item.name}</span>${item.note ? `<small class="menu-note">${item.note}</small>` : ""}</span><span class="menu-price">${money(item.price)}</span>`;
    button.addEventListener("click", () => {
      state.selectedMenu = item;
      state.draft = defaultDraft(item);
      renderOptions();
    });
    list.append(button);
  });
  screen.replaceChildren(view);
}

function inputChoice({ type, name, value, label, price, checked }) {
  const wrapper = document.createElement("label");
  wrapper.className = "choice";
  wrapper.innerHTML = `<input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""}><span class="choice-label"><span>${label}</span>${price ? `<span>${price}</span>` : ""}</span>`;
  return wrapper;
}

function renderOptions() {
  state.screen = "options";
  setStep("options");
  const item = state.selectedMenu;
  const view = document.querySelector("#options-screen").content.cloneNode(true);
  const form = view.querySelector(".option-form");

  view.querySelector(".back-button").addEventListener("click", renderMenu);
  view.querySelector(".chosen-drink").innerHTML = `<strong>${item.name}</strong><span>${money(item.price)}</span>`;

  const temperatures = item.temperatures || ["ICE", "HOT"];
  temperatures.forEach((temperature) => {
    view.querySelector(".temperature-options").append(inputChoice({
      type: "radio",
      name: "temperature",
      value: temperature,
      label: temperature,
      checked: state.draft.temperature === temperature,
    }));
  });

  const sizeBlock = view.querySelector(".size-block");
  if (item.sizes) {
    Object.entries(item.sizes).forEach(([size, price]) => {
      view.querySelector(".size-options").append(inputChoice({
        type: "radio",
        name: "size",
        value: size,
        label: size,
        price: money(price),
        checked: state.draft.size === size,
      }));
    });
  } else {
    sizeBlock.remove();
  }

  const beanBlock = view.querySelector(".bean-block");
  if (item.bean) {
    ["소소 시그니처 블렌드", "프리미엄 다크 블렌드"].forEach((bean) => {
      view.querySelector(".bean-options").append(inputChoice({
        type: "radio",
        name: "bean",
        value: bean,
        label: bean,
        checked: state.draft.bean === bean,
      }));
    });
  } else {
    beanBlock.remove();
  }

  additions.forEach((addition) => {
    view.querySelector(".addon-options").append(inputChoice({
      type: "checkbox",
      name: "addition",
      value: addition.id,
      label: addition.name,
      price: `+${money(addition.price)}`,
      checked: state.draft.additions.includes(addition.id),
    }));
  });
  view.querySelector('input[name="memo"]').value = state.draft.memo;

  function captureDraft() {
    const selectedAddition = [...form.querySelectorAll('input[name="addition"]:checked')].map((input) => input.value);
    state.draft = {
      temperature: form.elements.temperature.value,
      size: item.sizes ? form.elements.size.value : "R",
      bean: item.bean ? form.elements.bean.value : "",
      additions: selectedAddition,
      memo: form.elements.memo.value.trim(),
    };
    view.querySelector(".total-price").textContent = money(totalPrice(item, state.draft));
  }

  form.addEventListener("change", captureDraft);
  form.addEventListener("input", captureDraft);
  captureDraft();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    captureDraft();
    const order = {
      memberId: state.selectedMember.id,
      memberName: state.selectedMember.name,
      menuId: item.id,
      menuName: item.name,
      ...state.draft,
      total: totalPrice(item, state.draft),
    };
    const submitButton = form.querySelector(".submit-button");
    submitButton.disabled = true;
    submitButton.textContent = "저장 중...";
    await saveOrder(order);
    renderDone(state.orders[order.memberId]);
  });

  screen.replaceChildren(view);
}

function orderOptionsText(order) {
  const details = [order.temperature];
  if (getMenu(order.menuId)?.sizes) details.push(`${order.size} 사이즈`);
  if (order.bean) details.push(order.bean);
  order.additions.forEach((id) => details.push(additions.find((item) => item.id === id).name));
  if (order.memo) details.push(order.memo);
  return details.join(" · ");
}

function renderDone(order) {
  state.screen = "done";
  setStep("done");
  const view = document.querySelector("#done-screen").content.cloneNode(true);
  view.querySelector(".done-message").textContent = `${order.memberName}님의 주문이 저장되었습니다.`;
  view.querySelector(".receipt").innerHTML = `
    <div class="receipt-line"><span>메뉴</span><strong>${order.menuName}</strong></div>
    <div class="receipt-line"><span>옵션</span><span>${orderOptionsText(order)}</span></div>
    <div class="receipt-line"><span>총 금액</span><strong>${money(order.total)}</strong></div>
  `;
  view.querySelector(".edit-button").addEventListener("click", renderOptions);
  view.querySelector(".home-button").addEventListener("click", renderMembers);
  screen.replaceChildren(view);
}

async function start() {
  await loadOrders();
  renderMembers();
}

start();
