from flask import Flask, jsonify, request, render_template, send_from_directory
from db import get_db_connection

app = Flask(__name__)


# ГЛАВНАЯ СТРАНИЦА
# ГЛАВНАЯ СТРАНИЦА
@app.route('/')
def index():
    return render_template('index.html')



# GET /api/products
# Получить все доступные товары

@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        # Запрос выбирает строго оригинальные 5 книг И включает ImageName
        query = """
            SELECT
                p.ProductID,
                p.Title,
                p.Author,
                p.Price,
                p.StockQuantity,
                p.ImageName,
                c.CategoryName
            FROM Products p
            LEFT JOIN Categories c
                ON p.CategoryID = c.CategoryID
            WHERE p.IsAvailable = 1
              AND p.Title IN (
                  N'Бисквит', 
                  N'Целиком и полностью', 
                  N'Меня укутай в ночь и тень', 
                  N'Тень Дануолла', 
                  N'Плюшевая девочка'
              )
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        products = []

        for row in rows:
            products.append({
                "id": row.ProductID,
                "title": row.Title,
                "author": row.Author,
                "price": float(row.Price),
                "stock": row.StockQuantity,
                # Если вдруг имя картинки в базе пустое, подставляем имя по умолчанию
                "image_name": row.ImageName if row.ImageName else "default-cover.jpg",
                "category": row.CategoryName
            })

        cursor.close()
        conn.close()

        return jsonify(products), 200

    except Exception as e:
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500



# POST /api/products
# Добавить новый товар

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Не переданы данные"
        }), 400

    title = data.get("title")
    author = data.get("author")
    price = data.get("price")
    stock = data.get("stock")
    category_id = data.get("category_id")

    if (
        not title
        or not author
        or price is None
        or stock is None
        or category_id is None
    ):
        return jsonify({
            "error": "Необходимо передать title, author, price, stock, category_id"
        }), 400

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        query = """
            INSERT INTO Products
                (
                    Title,
                    Author,
                    Price,
                    StockQuantity,
                    CategoryID,
                    IsAvailable
                )
            OUTPUT INSERTED.ProductID
            VALUES (?, ?, ?, ?, ?, 1)
        """

        cursor.execute(
            query,
            (
                title,
                author,
                price,
                stock,
                category_id
            )
        )

        product_id = cursor.fetchone()[0]

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Товар успешно создан",
            "id": product_id,
            "title": title,
            "author": author,
            "price": price,
            "stock": stock,
            "category_id": category_id
        }), 201

    except Exception as e:
        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500


# PUT /api/products/<product_id>
# Изменить существующий товар

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Не переданы данные"
        }), 400

    title = data.get("title")
    author = data.get("author")
    price = data.get("price")
    stock = data.get("stock")
    category_id = data.get("category_id")

    if (
        not title
        or not author
        or price is None
        or stock is None
        or category_id is None
    ):
        return jsonify({
            "error": "Необходимо передать title, author, price, stock, category_id"
        }), 400

    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        # Проверяем существование товара
        cursor.execute(
            "SELECT ProductID FROM Products WHERE ProductID = ?",
            (product_id,)
        )

        existing_product = cursor.fetchone()

        if existing_product is None:
            cursor.close()
            conn.close()

            return jsonify({
                "error": "Товар не найден"
            }), 404

        # Обновляем товар
        query = """
            UPDATE Products
            SET
                Title = ?,
                Author = ?,
                Price = ?,
                StockQuantity = ?,
                CategoryID = ?
            WHERE ProductID = ?
        """

        cursor.execute(
            query,
            (
                title,
                author,
                price,
                stock,
                category_id,
                product_id
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Товар успешно обновлён",
            "id": product_id,
            "title": title,
            "author": author,
            "price": price,
            "stock": stock,
            "category_id": category_id
        }), 200

    except Exception as e:
        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500


# DELETE /api/products/<product_id>
# Удалить товар

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        # Проверяем существование товара
        cursor.execute(
            "SELECT ProductID FROM Products WHERE ProductID = ?",
            (product_id,)
        )

        existing_product = cursor.fetchone()

        if existing_product is None:
            cursor.close()
            conn.close()

            return jsonify({
                "error": "Товар не найден"
            }), 404

        # Удаляем товар
        cursor.execute(
            "DELETE FROM Products WHERE ProductID = ?",
            (product_id,)
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Товар успешно удалён",
            "id": product_id
        }), 200

    except Exception as e:
        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500


# GET /api/services
# Получить все услуги

@app.route('/api/services', methods=['GET'])
def get_services():
    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        query = """
            SELECT
                ServiceID,
                ServiceName,
                Description,
                Price
            FROM Services
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        services = []

        for row in rows:
            services.append({
                "id": row.ServiceID,
                "name": row.ServiceName,
                "description": row.Description,
                "price": float(row.Price)
            })

        cursor.close()
        conn.close()

        return jsonify(services), 200

    except Exception as e:
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500


# GET /api/users/<user_id>/orders
# Получить заказы конкретного пользователя

@app.route('/api/users/<int:user_id>/orders', methods=['GET'])
def get_user_orders(user_id):
    conn = get_db_connection()

    if conn is None:
        return jsonify({
            "error": "Не удалось подключиться к БД"
        }), 500

    try:
        cursor = conn.cursor()

        query = """
            SELECT
                o.OrderID,
                o.OrderDate,
                o.Status,
                o.TotalAmount,
                dm.DeliveryName
            FROM Orders o
            LEFT JOIN DeliveryMethods dm
                ON o.DeliveryMethodID = dm.DeliveryMethodID
            WHERE o.UserID = ?
        """

        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        orders = []

        for row in rows:
            orders.append({
                "order_id": row.OrderID,
                "date": str(row.OrderDate),
                "status": row.Status,
                "total": float(row.TotalAmount),
                "delivery": row.DeliveryName
            })

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500

# Роут для отдачи robots.txt из папки static
@app.route('/robots.txt')
def response_robots():
    return send_from_directory(app.static_folder, 'robots.txt')

# Роут для отдачи sitemap.xml из папки static
@app.route('/sitemap.xml')
def response_sitemap():
    return send_from_directory(app.static_folder, 'sitemap.xml')

# Автоматическое добавление заголовка X-Robots-Tag для всех API-запросов (Раздел "Для API")
@app.after_request
def add_seo_headers(response):
    if request.path.startswith('/api'):
        response.headers['X-Robots-Tag'] = 'noindex, nofollow'
    return response

# Страница полного каталога (отображение HTML-шаблона)
@app.route('/catalog')
def catalog_page():
    return render_template('catalog.html')


# Страница подборок «Что почитать?»
@app.route('/recommendations')
def recommendations_page():
    return render_template('recommendations.html')


# Страница корзины (товары хранятся на клиенте в localStorage, см. cart.js)
@app.route('/cart')
def cart_page():
    return render_template('cart.html')


# Страница профиля (заказы подгружаются через /api/users/<id>/orders)
@app.route('/profile')
def profile_page():
    return render_template('profile.html')

# GET /api/products/all
# Получить абсолютно все доступные книги из БД для сетки каталога
@app.route('/api/products/all', methods=['GET'])
def get_all_products():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Не удалось подключиться к БД"}), 500
    try:
        cursor = conn.cursor()
        query = """
            SELECT
                p.ProductID,
                p.Title,
                p.Author,
                p.Price,
                p.StockQuantity,
                p.ImageName,
                c.CategoryName
            FROM Products p
            LEFT JOIN Categories c
                ON p.CategoryID = c.CategoryID
            WHERE p.IsAvailable = 1
            ORDER BY p.ProductID ASC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        products = []
        for row in rows:
            products.append({
                "id": row.ProductID,
                "title": row.Title,
                "author": row.Author,
                "price": float(row.Price),
                "stock": row.StockQuantity,
                "image_name": row.ImageName if row.ImageName else "default-cover.jpg",
                "category": row.CategoryName
            })
        cursor.close()
        conn.close()
        return jsonify(products), 200
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

# ЗАПУСК СЕРВЕРА

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )

