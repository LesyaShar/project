// Каталог: загружаем все книги одним запросом, а дальше
// фильтрация, сортировка, поиск и пагинация работают на клиенте.
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("catalog-products-container");
    const categoryFilter = document.getElementById("category-filter");
    const sortFilter = document.getElementById("sort-filter");
    const paginationContainer = document.getElementById("pagination-container");
    const statusText = document.getElementById("catalog-status");
    const searchInput = document.getElementById("site-search");

    const PAGE_SIZE = 10; // как в макете: 2 ряда по 5 книг
    let allProducts = [];
    let currentPage = 1;

    // Запрос из строки поиска в шапке приходит как /catalog?q=...
    const searchQuery = new URLSearchParams(window.location.search)
        .get("q")?.trim().toLowerCase() || "";
    if (searchInput && searchQuery) {
        searchInput.value = searchQuery;
    }

    function getFilteredProducts() {
        let result = [...allProducts];

        if (searchQuery) {
            result = result.filter((product) =>
                product.title.toLowerCase().includes(searchQuery) ||
                product.author.toLowerCase().includes(searchQuery)
            );
        }

        if (categoryFilter.value !== "all") {
            result = result.filter(
                (product) => product.category === categoryFilter.value
            );
        }

        switch (sortFilter.value) {
            case "price_asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price_desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "title":
                result.sort((a, b) => a.title.localeCompare(b.title, "ru"));
                break;
            default: // "new" — порядок из базы (по ProductID)
                result.sort((a, b) => a.id - b.id);
        }

        return result;
    }

    function renderProducts(products) {
        container.innerHTML = "";

        products.forEach((product) => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.dataset.id = product.id;
            card.innerHTML = `
                <div class="product-cover">
                    <img src="/static/images/${escapeHtml(product.image_name)}"
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

            bindAddToCartButton(card.querySelector(".buy-btn"), product);
            container.appendChild(card);
        });
    }

    function renderPagination(totalPages) {
        paginationContainer.innerHTML = "";
        if (totalPages <= 1) return;

        for (let page = 1; page <= totalPages; page += 1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "page-number-btn" + (page === currentPage ? " active" : "");
            button.textContent = page;
            button.addEventListener("click", () => {
                currentPage = page;
                render();
                container.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            paginationContainer.appendChild(button);
        }
    }

    function render() {
        const filtered = getFilteredProducts();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageProducts = filtered.slice(start, start + PAGE_SIZE);

        if (filtered.length === 0) {
            container.innerHTML = "<p>По вашему запросу книги не нашлись.</p>";
            paginationContainer.innerHTML = "";
        } else {
            renderProducts(pageProducts);
            renderPagination(totalPages);
        }

        statusText.textContent = searchQuery
            ? `По запросу «${searchQuery}» найдено книг: ${filtered.length}`
            : `Всего книг: ${filtered.length}`;
    }

    function fillCategories(products) {
        const categories = [
            ...new Set(products.map((p) => p.category).filter(Boolean)),
        ].sort((a, b) => a.localeCompare(b, "ru"));

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    categoryFilter.addEventListener("change", () => {
        currentPage = 1;
        render();
    });
    sortFilter.addEventListener("change", () => {
        currentPage = 1;
        render();
    });

    // Загружаем абсолютно все книги из базы данных
    fetch("/api/products/all")
        .then((response) => {
            if (!response.ok) throw new Error("Ошибка загрузки данных каталога");
            return response.json();
        })
        .then((products) => {
            allProducts = products;
            fillCategories(products);
            render();
        })
        .catch((error) => {
            console.error("Ошибка:", error);
            container.innerHTML =
                "<p style='color: #ef4444;'>Не удалось загрузить товары каталога</p>";
            statusText.textContent = "";
        });
});
