const currencySymbols = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  PKR: "₨",
  INR: "₹",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CNY: "¥",
  RUB: "₽",
  BRL: "R$",
  ZAR: "R",
};

async function detectCurrency() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return data.currency || "USD";
  } catch {
    return "USD";
  }
}

async function applyPrices() {
  const userCurrency = await detectCurrency();
  const symbol = currencySymbols[userCurrency] || "$";
  const conversionRate = {
    USD: 1,
    PKR: 285,
    INR: 84,
    GBP: 0.78,
    EUR: 0.93,
    AUD: 1.55,
    CAD: 1.37,
    JPY: 150,
    CNY: 7.1,
    RUB: 97,
    BRL: 5.6,
    ZAR: 18.9,
  };

  document.querySelectorAll(".item-price").forEach(el => {
    const usd = parseFloat(el.getAttribute("data-price"));
    const local = usd * (conversionRate[userCurrency] || 1);
    el.textContent = `${symbol}${local.toFixed(2)} ${userCurrency}`;
  });
}

applyPrices();
