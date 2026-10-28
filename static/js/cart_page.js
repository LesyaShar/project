// Страница корзины: показывает товары из localStorage,
// позволяет менять количество, удалять и оформлять заказ.
document.addEventListener("DOMContentLoaded", () => {
    const itemsContainer = document.getElementById("cart-items");
    const emptyBlock = document.getElementById("cart-empty");
    const summaryBlock = document.getElementById("cart-summary");
    const totalElement = document.getElementById("cart-total");
    const countText = document.getElementById("cart-count-text");
    const clearButton = document.getElementById("clear-cart-btn");
    const checkoutButton = document.getElementById("checkout-btn");
    const successBlock = document.getElementById("checkout-success");

    function renderCart() {
        const cart = getCart();
        const isEmpty = cart.length === 0;

        emptyBlock.hidden = !isEmpty;
        summaryBlock.hidden = isEmpty;
        clearButton.hidden = isEmpty;

        const count = getCartItemsCount();
        countText.textContent = isEmpty
            ? ""
            : `${count} ${pluralize(count, ["товар", "товара", "товаров"])}`;

        itemsContainer.innerHTML = "";

        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "cart-item";
            row.innerHTML = `
                <div class="cart-item-cover">
                    <img src="/static/images/${escapeHtml(item.image_name)}"
                         alt="${escapeHtml(item.title)}"
                         onerror="this.src='/static/images/default-cover.jpg'">
                </div>
                <div class="cart-item-info">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p class="cart-item-author">${escapeHtml(item.author)}</p>
                </div>
                <div class="cart-item-side">
                    <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                    <div class="quantity-controls">
                        <button type="button" data-action="dec" data-id="${item.id}" aria-label="Уменьшить количество">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-action="inc" data-id="${item.id}" aria-label="Увеличить количество">+</button>
                    </div>
                    <button type="button" class="cart-remove-btn" data-action="remove" data-id="${item.id}" aria-label="Удалить из корзины">🗑</button>
                </div>
            `;
            itemsContainer.appendChild(row);
        });

        const total = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        totalElement.textContent = formatPrice(total);
    }

    // Один обработчик на весь список: кнопки + / − / удалить
    itemsContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const productId = Number(button.dataset.id);
        let cart = getCart();
        const item = cart.find((cartItem) => cartItem.id === productId);
        if (!item) return;

        if (button.dataset.action === "inc") {
            item.quantity += 1;
        } else if (button.dataset.action === "dec") {
            item.quantity = Math.max(1, item.quantity - 1);
        } else if (button.dataset.action === "remove") {
            cart = cart.filter((cartItem) => cartItem.id !== productId);
        }

        saveCart(cart);
        renderCart();
    });

    clearButton.addEventListener("click", () => {
        if (!confirm("Очистить корзину?")) return;
        saveCart([]);
        successBlock.hidden = true;
        renderCart();
    });

    // Оформление: сохраняем заказ локально и показываем его потом в профиле.
    // (Когда на бэкенде появится POST /api/orders, здесь будет fetch к нему.)
    checkoutButton.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) return;

        const order = {
            id: Date.now(),
            date: new Date().toISOString(),
            status: "Новый",
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
            delivery: "Самовывоз",
            items: cart,
        };

        const orders = getLocalOrders();
        orders.unshift(order); // новые заказы сверху
        saveLocalOrders(orders);

        saveCart([]);
        renderCart();
        successBlock.hidden = false;
        successBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    renderCart();
});
