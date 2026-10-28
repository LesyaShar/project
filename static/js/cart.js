// ============================================================
// cart.js — общая логика корзины для всего сайта.
//
// Пока на сайте нет регистрации, корзина хранится в браузере
// (localStorage): товары не пропадают при переходе между
// страницами и после перезагрузки. Оформленные заказы тоже
// складываем в localStorage, чтобы показать их в профиле.
//
// Когда появится авторизация и API заказов, функции ниже можно
// будет заменить запросами к серверу, а остальной код сайта
// почти не изменится.
// ============================================================

const CART_KEY = "vstraneknig_cart_v1";
const ORDERS_KEY = "vstraneknig_orders_v1";

// --- Чтение / запись корзины ---

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const cart = raw ? JSON.parse(raw) : [];
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Не удалось прочитать корзину:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

// --- Локальные заказы (для страницы профиля) ---

function getLocalOrders() {
    try {
        const raw = localStorage.getItem(ORDERS_KEY);
        const orders = raw ? JSON.parse(raw) : [];
        return Array.isArray(orders) ? orders : [];
    } catch (error) {
        console.error("Не удалось прочитать заказы:", error);
        return [];
    }
}

function saveLocalOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// --- Добавление товара и счётчик в шапке ---

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            author: product.author,
            price: Number(product.price),
            image_name: product.image_name || "default-cover.jpg",
            quantity: 1,
        });
    }

    saveCart(cart);
    showCartToast(`«${product.title}» — добавлено в корзину`);
}

function getCartItemsCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-count");
    if (!badge) return;

    const count = getCartItemsCount();
    badge.textContent = count;
    badge.hidden = count === 0;
}

// Привязывает кнопку «Купить» к товару: по клику кладёт товар
// в корзину и на секунду меняет подпись кнопки.
function bindAddToCartButton(button, product) {
    button.addEventListener("click", () => {
        addToCart(product);

        const originalText = button.textContent;
        button.textContent = "В корзине ✓";
        button.classList.add("added");

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("added");
        }, 1200);
    });
}

// --- Вспомогательные функции ---

let toastTimer = null;

function showCartToast(message) {
    const toast = document.getElementById("cart-toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatPrice(price) {
    return `${Math.round(Number(price)).toLocaleString("ru-RU")} руб`;
}

// «1 товар», «2 товара», «5 товаров»
function pluralize(count, forms) {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
}

// Экранируем текст из базы перед вставкой в HTML,
// чтобы кавычки и спецсимволы не ломали разметку.
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
}

// Счётчик корзины актуален сразу при загрузке любой страницы
document.addEventListener("DOMContentLoaded", updateCartBadge);

// Если корзина изменилась в другой вкладке — обновляем счётчик и здесь
window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) updateCartBadge();
});
