# Szkolna Prezentacja Projektu: World Recipes

Niniejszy dokument opisuje architekturę oraz operacje w aplikacji **World Recipes** (React + PHP + SQLite), łącząc wymagania techniczne projektu z przykładami przesyłu danych pod maską systemu (z przeglądarki aż do samej bazy danych).

---

## 1. Dodawanie Nowych Danych (Pełen Cykl Operacji)
**Realizuje warunek:** *możliwość dodawania nowych danych do systemu*

Aby perfekcyjnie zrozumieć, jak współpracuje u nas aplikacja, prześledźmy jedną z głównych funkcji: **Dodanie nowego przepisu do ulubionych**.

**KROK 1: Interakcja Użytkownika (Klik na stronie)**
W pliku [src/pages/recipeDetails.js](src/pages/recipeDetails.js) po kliknięciu przycisku "Add to favorites" wywołana zostaje funkcja w React:
```jsx
<button onClick={handleFavoriteClick} disabled={isFavoriteLoading}>
  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
</button>
```

**KROK 2: Funkcja React.js i Fetch na backend**
Funkcja `handleFavoriteClick()` wywołuje zapytanie HTTP używając modułu [src/api/favorites.js](src/api/favorites.js). Przekształcamy dane w ciąg JSON używając obiektu `fetch`:
```javascript
// src/api/favorites.js
export function addProfileFavorite(recipeId) {
  const profileId = getRequiredProfileId();
  
  return fetch('/api/profile/favorites', {
    method: 'POST',
    body: JSON.stringify({ recipeId: String(recipeId) }), // Przekształcenie do JSON
    headers: {
      'Content-Type': 'application/json',
      'X-Profile-Id': profileId // Wysyłamy, by zweryfikować użytkownika
    }
  });
}
```

**KROK 3: Odbieranie JSON przez PHP i odczyt z bazy**
Zwrócone zapytanie trafia na nasz router do [backend/public/index.php](backend/public/index.php), gdzie serwer odczytuje dane wejściowe przekodowując je z formy zdekodowanego na tablicę JSON'a:
```php
if ($method === 'POST' && $path === '/api/profile/favorites') {
    $body = readJsonBody(); // Dekodowanie: json_decode(file_get_contents('php://input'), true)
    $recipeId = validateRecipeId((string)($body['recipeId'] ?? ''));

    // Bindowanie PDO (zabezpieczenie przed SQL Injection!) 
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO favorites (profile_id, recipe_id) VALUES (:profile_id, :recipe_id)');
    $stmt->execute([
        ':profile_id' => $profileId,
        ':recipe_id' => $recipeId
    ]);
    
    // Zwrócenie pozytywnej wiadomości (response z JSON) do Frontendu
    jsonResponse(201, ['ok' => true]); 
}
```

---

## 2. Dynamiczna tabela HTML, usuwanie wierszy oraz strona elementu
**Realizuje warunki:** *wypisywanie danych w tabeli HTML z linkiem do usunięcia, strona dotycząca jednego wiersza danych*

Dane zalogowanego użytkownika (ulubione dania) wypisywane są strukturą przypominającą tabelę (tzw. elastyczna siatka Grid).

**JSX (nasza Tabela) i Strona Wiersza (`src/pages/profile.js`)**
Każdy generowany w pętli `.map()` bloczek pełni rolę zdefiniowanego wiersza ze spersonalizowanym linkiem (do strony dla szczególnego wiersza danych np. `recipe/52772`) i własnym interfejsem usuwania:
```jsx
<div className="recipeGrid">
  {favoriteRecipes.map(function(recipe) {
    return (
      <div key={recipe.idMeal}>
        {/* Link do strony dotyczącej konkretnego elementu - Wymóg Projektu */}
        <Link to={`/recipe/${recipe.idMeal}`}>
            <RecipeCard title={recipe.strMeal} image={recipe.strMealThumb} />
        </Link>
        {/* Konkretny link/przycisk do usunięcia wiersza danych - Wymóg Projektu */}
        <button onClick={function() { handleRemove(recipe.idMeal); }}>
          Remove from favorites
        </button>
      </div>
    );
  })}
</div>
```

**Odpowiedź w serwerze PHP (usunięcie zasobu):**
```php
if ($method === 'DELETE' && preg_match('#^/api/profile/favorites/([0-9]{1,32})$#', $path, $matches) === 1) {
    $recipeId = validateRecipeId($matches[1]);
    $stmt = $pdo->prepare('DELETE FROM favorites WHERE profile_id = :profile_id AND recipe_id = :recipe_id');
    $stmt->execute([':profile_id' => $profileId, ':recipe_id' => $recipeId]);
    jsonResponse(200, ['ok' => true]);
}
```

---

## 3. Logowanie i Rejestracja - Mechanizm Sesji i Zapisywania
**Realizuje warunki:** *okienko logowania - zapisywanie danych logowania w sesji, rejestracja*

U nas okienko logowania funkcjonuje jako panel logowania profilem (znanym ze środowisk VOD/Netflix).
Kiedy użytkownik podaje imię:
1. **Frontend (React)** wyświetla `<form>` przekazujący w requeście POST wpisaną nazwę.
2. **Backend (PHP)** weryfikuje istnienie. Jeżeli go nie ma - zapisuje dane do SQL; jeśli jest - pozwala się uwierzytelnić zwracając ID.
3. Stan konta jest utrzymywany dzięki przesyłanemu nagłówkowi `X-Profile-Id`.

```sql
/* Fragment schematu generowania i rejestracji tabel z init.sql */
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 4. Wygląd strony (Jasny/Ciemny) i Ciasteczka
**Realizuje warunek:** *możliwość zmiany wyglądu, dane zapisywane w ciasteczkach i edycja*

Motyw strony przełączany w Reactcie jest składowany nie tylko w LocalStorage, ale również przesyłany z żądaniem do PHP i **przechowywany dzięki użyciu PHP SESSION (bazującej na wbudowanych ciasteczkach `PHPSESSID`)**. 

```php
// Zabezpieczony start sesji wykorzystujący HTTP-Only Ciasteczka
session_start([
    'cookie_path' => '/',
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

// Ciasteczko nadpisuje/zapisuje tryb Dark lub Light wyczytwany następnie globalnie we front-endzie.
if ($method === 'POST' && $path === '/api/theme') {
    $body = readJsonBody();
    $newTheme = ($body['theme'] ?? '') === 'dark' ? 'dark' : 'light';
    
    $_SESSION['theme'] = $newTheme; // PHP magicznie obsługuje to jako ciastko pod spodem
    
    jsonResponse(200, ['theme' => $newTheme]);
}
```

---

## 5. Baza Danych - Opracowana Struktura
**Realizuje warunek:** *tabele użytkowników i inne dane pod projekt*

Baza SQLite3 zbudowana jest tak, że generuje sama swoją instalację, łącząc profile i unkalne ulubione przepisy:

1. **Tablica użytkowników (`profiles`)** - Posiada m.in. `id` oraz `username`.
2. **Tabela z innymi zapotrzebowaniami projektu (`favorites`)** - Posiada relacyjne kolumny łączące klucz przypisujący ulubiony posiłek `recipe_id` pod powiązanego użytkownika profilowego (`profile_id`). Ponadto posiada pole zapamiętania daty modyfikacji wpisu - co wypełnia potrzebę edytowalności danych.
