# Claw Quest — pierwsza wyprawa i progresja

## Cel
Przekształcić prototyp z bezkońcowych fal w czytelną, mobilną pętlę roguelite 2D: wybór celu, walka turowa, precyzyjny chwyt łupu, nagroda, trwały rozwój i kolejny etap.

## Zakres
- Pięć ręcznie zaprojektowanych etapów startowych z kontrolowanymi składami przeciwników i tempem trudności.
- Przejrzysta informacja o etapie, fali, aktualnym celu i zamiarze przeciwnika.
- Sterowanie dotykowe: tapnięcie wroga wybiera cel; tapnięcie i przeciągnięcie w komorze ustawia chwytak; przyciski kierunkowe nadal pozwalają korygować położenie.
- Trwały profil lokalny: monety, doświadczenie, poziom bohatera, ulepszenia ataku/życia/chwytaka, odblokowany etap i rekord.
- Nagrody za pokonanych wrogów, etapy i przedmioty z automatu.
- Ulepszenia kupowane za monety, z natychmiastowym wpływem na statystyki.
- Różnicowanie palety tła i przeciwników w pierwszych etapach, przy zachowaniu lekkiego Canvas 2D bez zewnętrznych assetów.

## Kierunek wizualny
Oryginalna, czytelna kreskówkowa oprawa inspirowana ogólną hierarchią Claw Master: nasycone tła lokacji, kontrastowe obiekty, duże panele statusu i wyraźne nagrody. Bez kopiowania cudzych grafik, nazw własnych, kodu lub układów piksel w piksel.

## Podejścia i decyzja
1. Przepisać silnik na nowy framework i atlas sprite'ów — największy potencjał docelowy, ale niepotrzebne ryzyko i opóźnienie dla istniejącej działającej wersji.
2. Rozszerzać obecny Canvas 2D o dane etapów, profil i stany UI — wybrana opcja, najmniejszy koszt integracji, zachowuje PWA/offline i obecną walkę turową.
3. Zrobić wyłącznie lifting UI — odrzucone, bo nie naprawia braku progresji ani niedopracowanych pierwszych poziomów.

## Decyzje projektowe
- Pierwsze pięć etapów będzie stałych i uczących, dalsze etapy będą skalowaną kontynuacją.
- Waluta i ulepszenia zapisują się w localStorage; brak konta i serwera.
- Ulepszenia trwałe: atak, maksymalne zdrowie, precyzja chwytaka.
- Walka pozostaje turowa; nie wprowadzamy auto-strzelania.
- Canvas 2D i istniejący PWA service worker pozostają podstawą.

## Poza zakresem
- System online, synchronizacja chmury, reklamy, płatności, multiplayer.
- Zewnętrzne lub licencjonowane sprite-sheety.
- Zmiana modelu gry na 3D lub auto-battle.
