import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.content_type.startswith("text/html")

    html = response.get_data(as_text=True)
    assert "В стране книг" in html


def test_get_products(client, monkeypatch):
    class Row:
        ProductID = 1
        Title = "Тестовая книга"
        Author = "Тестовый автор"
        Price = 700
        StockQuantity = 10
        ImageName = "test-cover.jpg"
        CategoryName = "Фантастика"

    class Cursor:
        def execute(self, query, *args):
            pass

        def fetchall(self):
            return [Row()]

        def close(self):
            pass

    class Connection:
        def cursor(self):
            return Cursor()

        def close(self):
            pass

    monkeypatch.setattr("app.get_db_connection", lambda: Connection())

    response = client.get("/api/products")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Тестовая книга"
    assert data[0]["price"] == 700
    assert data[0]["image_name"] == "test-cover.jpg"


def test_get_services(client, monkeypatch):
    class Row:
        ServiceID = 1
        ServiceName = "Тестовая услуга"
        Description = "Описание услуги"
        Price = 300

    class Cursor:
        def execute(self, query, *args):
            pass

        def fetchall(self):
            return [Row()]

        def close(self):
            pass

    class Connection:
        def cursor(self):
            return Cursor()

        def close(self):
            pass

    monkeypatch.setattr("app.get_db_connection", lambda: Connection())

    response = client.get("/api/services")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["name"] == "Тестовая услуга"


def test_get_user_orders(client, monkeypatch):
    class Row:
        OrderID = 1
        OrderDate = "2026-10-07"
        Status = "Новый"
        TotalAmount = 1000
        DeliveryName = "Курьер"

    class Cursor:
        def execute(self, query, *args):
            pass

        def fetchall(self):
            return [Row()]

        def close(self):
            pass

    class Connection:
        def cursor(self):
            return Cursor()

        def close(self):
            pass

    monkeypatch.setattr("app.get_db_connection", lambda: Connection())

    response = client.get("/api/users/1/orders")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["order_id"] == 1
    assert data[0]["status"] == "Новый"


# Новые страницы сайта должны открываться и содержать свои заголовки
@pytest.mark.parametrize(
    "path, marker",
    [
        ("/catalog", "Новинки"),
        ("/recommendations", "Что почитать?"),
        ("/cart", "Корзина"),
        ("/profile", "Профиль"),
    ],
)
def test_pages(client, path, marker):
    response = client.get(path)

    assert response.status_code == 200
    assert marker in response.get_data(as_text=True)
