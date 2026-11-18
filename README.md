# Elarion
Era I: Przebudzenie Rdzenia - Punkt startowy Lumina Vivens, Wieża Główna (Centrala)


Koncepcja Architektury Gry, Płyty Głównej nadaje grze unikalny charakter i naturalnie rozwiązuje dwie kluczowe mechaniki:

Warstwowa rozbudowa (Stacking): Ulepszenie budynku nie musi burzyć starej bryły — gracz dokłada na jego gnieździe (sockecie) kolejną warstwę logiczną lub pierścień energetyczny.

Ekspansja „płyta do płyty”: Złote złącza krawędziowe na bokach grafitowego laminatu wprost pokazują graczowi, gdzie może dopiąć następną płytę rozszerzeń (nowy sektor mapy), a magistrala automatycznie zasili nowy obszar.

Algorytm Przepływu Prądu z Procesora
To serce logiki planszy — sprawdza w czasie rzeczywistym, do których modułów dociera sygnał z Rdzenia Procesora po Magistralach Złotego Przepływu (jeśli gracz przerwie ścieżkę, moduł na końcu obwodu gaśnie i wstrzymuje produkcję)

# ELARION — Isometric Motherboard City-Builder

Gra strategiczna typu *city-builder* osadzona w uniwersum **Lumina Vivens** (`elarion.luminavivens.eu`), w której gracz rozbudowuje monumentalną, wielowarstwową płytę główną wokół centralnego Rdzenia Procesora.

## Uruchomienie lokalne

```bash
npm install
npm run dev
git add .
git commit -m "feat: full 2.5D motherboard UI, offline progress and README"
git push origin main
