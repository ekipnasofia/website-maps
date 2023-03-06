## Карти за вграждане в ekipnasofia.bg

### Карти

- [Жилищна собственост](https://ekipnasofia.github.io/website-maps/ownership.html)
- [Градски единици](https://ekipnasofia.github.io/website-maps/g_spot.html)

### Разработка


1. Копирай хранилището:

```
git clone git@github.com:ekipnasofia/website-maps.git
```

2. Влез в директорията:

```
cd website-maps
```

3. Стартирай уебсървър:

```
python3 -m http.server
```


Алтернативно стъпка 3. може да бъде заменена с друг уебсървър. Например уебсървър с презареждане при всяка промяна на файловете.

За настройка във Visual Studio Code:

1. Отвори проекта във Visual Studio Code:

```
code .
```

2. Инсталирай разширението [live-server](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server).

3. Отворете някой HTML файл от проекта, например `ownership.html`.

4. Натиснете `Ctrl+Shift+P` и напишете `Live Preview: Show Preview (External Browser)` и натиснете `Enter`. Страницата с картата ще се отвори в нов таб в уеб браузъра с адрес подобен на http://127.0.0.1:3000/ownership.html .
