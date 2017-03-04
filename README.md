#Techtaboros zenekar app

## Kezdes
Gittel ennek a reponak a klonozasa:
`git clone https://github.com/msaska9/Zenekar`

Kovetkezo parancs:
`npm install`
ez felteszi az osszes fuggosegeket (body-parser, express, pug, sqlite3)

Inditas:
'node index.js'

## Tobb branch hasznalata
Ahhoz, hogy megnezd, hogy milyen branch-eket hasznal a projekt, ezt kell beirnod a terminalba valahol a projekt mappajan belul:
`git branch`
Ez kiirja az osszes branchet, es megjeloli, hogy eppen melyik van hasznalatban (altalaban egy kis csillaggal). Ahhoz, hogy egy masik branchre atvalts, a *checkout* parancs
hasznalatos:
`git checkout <branch neve>`
A dev branchhez peldaul pl:
`git checkout dev`
Ilyenkor az osszes fajl a dev branchben levore valtozik at. **VIGYAZZ!** ha nem commitolsz a master (ez a fo branch) branchbe elotte, akkor
elveszhetnek a valtoztatasaid (bar ilyenkor a git szol magatol es nem is engedi, hogy atvalts).
