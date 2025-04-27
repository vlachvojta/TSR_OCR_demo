# Assignement

Předběžný návrh API: (fastapi / flask)

* `/upload_image` - nahrátí obrázku a výběr metody pro rozpoznání, součástí odpovědi je interní identifikátor obrázku `image_id`, po nahrátí se
 spustí zpracování obrázku (na několik sekund)

  * parametr `image` - zakódovaný pro přenos v JSONu
  * parametr `method` - výběr metody pro zpracování obrázku

* `/get_result/<format>/<image_id>` - dotaz na výsledek systému v požadovaném formátu.

  * formáty PAGE XML, csv, html, ...
  * 202, pokud se obrázek ještě zpracovává
  * 404 pro neexistující `image_id`

Stručný popis demo aplikace: (např. Vue.js)

* Uživatel má možnost vybrat obrázek ze souborů, nebo vyfotit pomocí kamery, má možnost vybrat metodu a další parametry zpracování
* Aplikace zobrazí výsledek ve vhodném formátu pro web: původní obrázek s označenými regiony, ve vedlejší části přepis s možností kliknutí
 pro zaměření na korespondující ekvivalent (kliknu na region  tabulky/řádku, v sekci výsledky se zaměří přepis tabulky/řádku,  a naopak)
* Aplikace umožní stáhnout všechny dostupné formáty
* Aplikace udržuje zpracovaná data po nějakou dobu, pak automaticky maže.
