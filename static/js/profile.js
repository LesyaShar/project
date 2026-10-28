// Профиль: показываем активные заказы пользователя.
// Источника два:
//   1) заказы, оформленные на сайте (лежат в localStorage, см. cart_page.js);
//   2) заказы из базы данных — готовый эндпоинт GET /api/users/<id>/orders.
document.addEventListener("DOMContentLoaded", () => {
    const ordersContainer = document.getElementById("orders-container");
    const ordersStatus = document.getElementById("orders-status");

    // Пока нет авторизации, считаем текущим пользователя с ID = 1.
    const DEMO_USER_ID = 1;

    function formatDate(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return String(dateValue);
        return date.toLocaleDateString("ru-RU");
    }

    function renderOrder(order) {
        const card = document.createElement("article");
        card.className = "order-card";

        const itemsHtml = Array.isArray(order.items)
            ? `<div class="order-items">
                   ${order.items.map((item) => `
                       <img src="/static/images/${escapeHtml(item.image_name)}"
                            alt="${escapeHtml(item.title)}"
                            title="${escapeHtml(item.title)}"
                            onerror="this.src='/static/images/default-cover.jpg'">
                   `).join("")}
               </div>`
            : "";

        card.innerHTML = `
            <div class="order-header">
                <strong>Заказ №${escapeHtml(order.id)} от ${escapeHtml(formatDate(order.date))}</strong>
                <span class="order-total">${formatPrice(order.total)}</span>
            </div>
            <p class="order-status">Статус: ${escapeHtml(order.status || "Новый")}</p>
            ${order.delivery ? `<p class="order-delivery">Доставка: ${escapeHtml(order.delivery)}</p>` : ""}
            ${itemsHtml}
        `;
        ordersContainer.appendChild(card);
    }

    function showFinalStatus(hasAnyOrders, apiFailed) {
        if (hasAnyOrders) {
            ordersStatus.hidden = true;
        } else if (apiFailed) {
            ordersStatus.textContent =
                "Не удалось загрузить заказы из базы данных.";
        } else {
            ordersStatus.textContent = "У вас пока нет активных заказов";
        }
    }

    // 1) Сначала локальные заказы — они доступны мгновенно
    const localOrders = getLocalOrders();
    localOrders.forEach(renderOrder);

    // 2) Потом подтягиваем заказы из базы данных
    fetch(`/api/users/${DEMO_USER_ID}/orders`)
        .then((response) => {
            if (!response.ok) throw new Error("Ошибка загрузки заказов");
            return response.json();
        })
        .then((databaseOrders) => {
            databaseOrders.forEach((order) =>
                renderOrder({
                    id: order.order_id,
                    date: order.date,
                    status: order.status,
                    total: order.total,
                    delivery: order.delivery,
                })
            );
            showFinalStatus(
                localOrders.length + databaseOrders.length > 0,
                false
            );
        })
        .catch((error) => {
            console.error("Ошибка загрузки заказов:", error);
            showFinalStatus(localOrders.length > 0, true);
        });
});
