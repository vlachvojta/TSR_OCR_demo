# TSR demo - Demonstrační aplikace na rozpoznání textu a struktury tabulek
Dokumentace k projektu WAP - Webové aplikace
autor: Vojtěch Vlach (xvlach22)

**Mock aplikace je nasazená na [pcsevcik.fit.vutbr.cz](http://pcsevcik.fit.vutbr.cz:8000/)
pro možnost spuštění bez instalace**

## Popis aplikace
Webová aplikace TSR demo (Table structure recognition) představuje jednoduché webové rozhraní k systému rozpoznání textu a struktury tabulek za pomocí deep-learning modelů (téma mojí diplomové práce). Hlavní přínos tohoto projektu je tedy umožnění využití systému bez lokální instalace a bez znalostí vnitřní funkcionality. Do budoucna je v plánu toto rozhraní využít pro testování odkudkoliv a možnost zpětné vazby od potenciálních uživatelů.

Samotná aplikace TSR demo ve složce `tsr_demo` je tvořena jednotným rozhraním `fastapi`, které zprostředkovává jak 2 hlavní API endpointy pro zpracování obrázků a zprostředkování výsledků v prostředí serveru (backend), tak webové soubory pro nahrátí vstupů a zobrazení výsledků na webu (frontend). Pro **jednoduché testování aplikace** je vytvořen `mock engine`, který po několika časových krocích prochází kroky, které dělá reálný `TSR engine`, ale jinak pouze čeká.
V souboru `start.py` je ukázán způsob, jakým by se reálný `TSR engine` importoval z knihovny `libs`. Pro účely představení systému v mockovacím režimu systém po nahrátí jakéhokoliv obrázku zobrazí `example_page` výsledky.

## Instalace a spuštění
Potřebné nástroje před spuštěním:
- python3.8+
- pip

Jednoduché spuštění je připraveno ve skriptu install_and_run.sh
```bash
python3 -m venv .venv_tsr_demo
source venv/bin/activate
pip install -r requirements.txt --no-cache-dir 
bash tsr_demo/start_tsr_demo.sh
```

## Fungování GUI webové aplikace
Webová aplikace umožňuje nahrát obrázek na domovské stránce, který pošle na backend. Dále se periodicky dotazuje na aktuální stav zpracování, dokud nedostane stav `error` nebo `processed`. V druhém případě zobrazí leaflet s obrázkem a vyrenderovanými řádky textu a tabulkami. Dále na stránce zobrazí tabulky v XML formátu a jednotlivé řádky textu. Uživatel může klikat na jednotlivé řádky/tabulky v Leafletu pro navigaci mezi výsledky.
Dále aplikace umožňuje stáhnout výsledný XML soubor.

*Pro lepší vizualizaci by bylo ideální XML reprezentaci převést na HTML s texty, ale tato funkcionalita bohužel nebyla dokončena včas.*

## Fungování backendu
Backend přijímá vstupní obrázky a spouští na nich `mock engine`. Vstupy a výstupy ukládá ve složce `uploads` s `uuid` a JSON souborem reprezentujícím stav a výsledky daného zpracování.

## Popis tabulek ve formátu PAGE-XML
PAGE-XML je formát umožňující definovat vizuální objekty libovolných tvarů, nejčastěji se používá na rozpoznání textu. Tabulky v PAGE-XML souboru mají souřadnice (`coords`) a buňky. Každá buňka má vlastní souřadnice a hlavně atributy `col`, `row`, `rowSpan` a `colSpan` definující strukturu tabulky. V každé buňce je pak možné mít několik řádků textu. viz příklad:

```xml
<TableRegion id="printed_page_3_table_0">
    <Coords points="73,352 676,352 676,622 73,622"/>
    <TableCell id="c000" row="0" col="0" rowSpan="1" colSpan="1">
        <Coords points="..."/>
        <TextLine id="c000_l000" index="0">
            <Coords points="73,354 185,354 185,366 73,366"/>
            <TextEquiv>
                <Unicode>Category (mean, SEM)</Unicode>
            </TextEquiv>
        </TextLine>
    </TableCell>
    <TableCell id="c001" row="0" col="1" rowSpan="1" colSpan="1">
        <Coords points="..."/>
        <TextLine id="c001_l000" index="0">
            <Coords points="199,354 247,354 247,366 199,366"/>
            <TextEquiv>
                <Unicode>KD Group</Unicode>
            </TextEquiv>
        </TextLine>
    </TableCell>
    <TableCell id="c002" row="0" col="2" rowSpan="1" colSpan="1">
        <Coords points="..."/>
        <TextLine id="c002_l000" index="0">
            <Coords points="..."/>
            <TextEquiv>
                <Unicode>Hospital Controls</Unicode>
            </TextEquiv>
        </TextLine>
    </TableCell>
    ...
</TableRegion>
```
