# TSR demo - Demonstrační aplikace na rozpoznání textu a struktury tabulek
Dokumentace k projektu WAP - Webové aplikace
autor: Vojtěch Vlach (xvlach22)

## Popis aplikace
Webová aplikace TSR demo (Table structure recognition) představuje jednoduché webové rozhraní k systému rozpoznání textu a struktury tabulek za pomocí deep-learning modelů (téma mojí diplomové práce). Hlavní přínos tohoto projektu je tedy umožnění využití systému bez lokální instalace a bez znalostí vnitřní funkcionality. Do budoucna je v plánu toto rozhraní využít pro  testování odkudkoliv a možnost zpětné vazby od potenciálních uživatelů.

Samotná aplikace TSR demo ve složce `tsr_demo` je tvořena jednotným rozhraním `fastapi`, které zprostředkovává jak 2 hlavní API endpointy pro zpracování obrázků a zprostředkování výsledků v prostředí serveru (backend), tak webové soubory pro poslání vstupů a zobrazení výsledků na webu (frontend). Pro testování aplikace je přiložena složka `libs` obsahující veškeré soubory nutné k lokálnímu nasazení. Kódy v této složce jsou částečně převzaté z open-source repozitářů a částečně z mojí diplomové práce.

## Instalace a spuštění
**!! Upozornění: kvůli nutnosti stáhnout několik deep-learning modelů, využije aplikace při prvním běhu několik GB disku. Částečně v python virtuálním prostředí. Částečně v `~/.cache` a dalších adresářích**

Jednoduché spuštění je připraveno ve skriptu install_and_run.sh
```bash
python3 -m venv .venv_tsr_demo
source venv/bin/activate
pip install -r requirements.txt --no-cache-dir 
bash tsr_demo/start_tsr_demo.sh
```
První spuštění bude trvat déle, protože se stahuje několik deep-learning modelů.

Potřebné nástroje před spuštěním:
- python3.8+
- pip
