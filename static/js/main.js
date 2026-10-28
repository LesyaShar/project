document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("products-container");

    // запасной подбор имени файла картинки по названию книги,
    // если в базе ImageName пустой (API тогда шлёт default-cover.jpg)
    function getSlug(title) {
        const trans = {
            "бисквит": "biscuit",
            "целиком и полностью": "celikom",
            "меня укутай в ночь и тень": "ukusy",
            "тень дануолла": "dishonored",
            "плюшевая девочка": "plush",
        };
        const lowerTitle = title.toLowerCase().trim();
        return trans[lowerTitle] || "default-cover";
    }

    function resolveImageName(product) {
        if (product.image_name && product.image_name !== "default-cover.jpg") {
            return product.image_name;
        }
        return `${getSlug(product.title)}.jpg`;
    }

    // Асинхронный запрос к Flask API (только 5 новинок для главной)
    fetch("/api/products")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Ошибка при получении товаров");
            }
            return response.json();
        })
        .then((products) => {
            container.innerHTML = "";

            if (products.length === 0) {
                container.innerHTML = "<p>Нет доступных новинок</p>";
                return;
            }

            // Отрисовываем каждую книгу из БД с сохранением структуры стилей
            products.forEach((product) => {
                const imageName = resolveImageName(product);

                const card = document.createElement("div");
                card.className = "product-card";
                card.dataset.id = product.id;
                card.innerHTML = `
                    <div class="product-cover">
                        <img src="/static/images/${escapeHtml(imageName)}"
                             alt="${escapeHtml(product.title)}"
                             onerror="this.src='/static/images/default-cover.jpg'">
                    </div>
                    <div class="product-info">
                        <div class="product-price">${formatPrice(product.price)}</div>
                        <h4 class="product-name">${escapeHtml(product.title)}</h4>
                        <p class="product-author">${escapeHtml(product.author)}</p>
                        <div class="product-actions">
                            <button class="buy-btn" type="button">Купить</button>
                            <button class="wishlist-btn" type="button" aria-label="В закладки">🔖</button>
                        </div>
                    </div>
                `;

                // Кнопка «Купить» кладёт именно эту книгу в корзину (cart.js)
                bindAddToCartButton(card.querySelector(".buy-btn"), {
                    ...product,
                    image_name: imageName,
                });

                container.appendChild(card);
            });
        })
        .catch((error) => {
            console.error("Ошибка:", error);
            container.innerHTML = "<p style='color: #ef4444;'>Не удалось загрузить новинки</p>";
        });
});
