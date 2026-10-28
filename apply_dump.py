"""
Распаковывает текстовый дамп проекта (формат make_dump.py) обратно в файлы.

Как пользоваться:
1. Положи этот файл и update_dump.txt в корень проекта — рядом с app.py.
2. Запусти в терминале VS Code:  python apply_dump.py
   (или с явным именем дампа:  python apply_dump.py update_dump.txt)
3. Скрипт создаст/обновит файлы из дампа. Старые версии перезаписываемых
   файлов на всякий случай сохранятся в папку backup_before_update/ —
   когда убедишься, что всё работает, её и оба служебных файла можно удалить
   (в репозиторий их коммитить не надо).
"""

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKUP_DIR = ROOT / "backup_before_update"


def main() -> None:
    dump_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "update_dump.txt"
    if not dump_path.is_absolute():
        dump_path = ROOT / dump_path

    if not dump_path.exists():
        print(f"Не найден файл дампа: {dump_path}")
        print("Положи update_dump.txt рядом с apply_dump.py и запусти ещё раз.")
        sys.exit(1)

    text = dump_path.read_text(encoding="utf-8", errors="ignore")
    parts = re.split(r"^===== FILE: (.+?) =====\s*$", text, flags=re.M)

    written = 0
    for i in range(1, len(parts), 2):
        rel_raw = parts[i].strip()
        content = parts[i + 1] if i + 1 < len(parts) else ""

        if content.startswith("\r\n"):
            content = content[2:]
        elif content.startswith("\n"):
            content = content[1:]
        content = content.replace("\r\n", "\n")
        # make_dump добавляет один пустой перевод строки после каждого файла
        if content.endswith("\n"):
            content = content[:-1]
            if content and not content.endswith("\n"):
                content += "\n"

        rel = rel_raw.replace("\\", "/")
        target = (ROOT / rel).resolve()

        # Защита: не пишем ничего за пределы папки проекта
        if ROOT not in target.parents:
            print(f"ПРОПУЩЕНО (подозрительный путь): {rel_raw}")
            continue

        # Бэкап существующей версии файла
        if target.exists():
            backup = BACKUP_DIR / rel
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup)

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        written += 1
        print(f"Записан: {rel}")

    print(f"\nГотово: обновлено файлов — {written}.")
    if BACKUP_DIR.exists():
        print("Старые версии лежат в backup_before_update/ (потом можно удалить).")
    print("Теперь запусти сайт (python app.py) и проверь страницы:")
    print("  http://127.0.0.1:5000/recommendations")
    print("  http://127.0.0.1:5000/cart")
    print("  http://127.0.0.1:5000/profile")


if __name__ == "__main__":
    main()
