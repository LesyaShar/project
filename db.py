import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    database = os.getenv("DB_NAME")
    driver = os.getenv("DB_DRIVER")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")

    if os.getenv("DOCKER_ENV") == "true":
        server = "host.docker.internal,1433"
    else:
        server = r"Lesya\SQLEXPRESS"

    print("=== ДАННЫЕ ПОДКЛЮЧЕНИЯ ===")
    print("SERVER:", server)
    print("DATABASE:", database)
    print("DRIVER:", driver)
    print("USER:", username)
    print("===========================")

    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
    )

    print("Строка подключения сформирована.")

    try:
        connection = pyodbc.connect(connection_string)

        print("✅ Flask подключился к SQL Server")

        return connection

    except pyodbc.Error as e:
        print("❌ Ошибка подключения к БД:")
        print(e)

        return None
