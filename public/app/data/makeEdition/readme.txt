How this is organized
1. All the files are in /Users/pmr906/venv/TCangular/tc/public/app/data/makeEdition/common/js/common.js

2. Inside /Users/pmr906/venv/TCangular/tc/public/app/data/makeEdition/common/
are the files which get copied into the static site each time
so: /makeEdition/common/transcript.js is the file which controls how transcripts appear, et

3. Inside /Users/pmr906/venv/TCangular/tc/public/app/data/makeEdition/driver/
are the files which make the static site files
so: 
/makeEdition/driver/js/transcript.js is the file which makes each static transcript page
You can test out how this driver file is working by:
http://localhost:3000/app/data/makeEdition/driver/index.html?page=35v&ms=El&community=FRG1

4. Inside the static site /Users/pmr906/Downloads/edition 53/common/js
are the files which control how the pages render (these are copied from 2)
so: edition 53/common/js/transcript.js controls how the transcripts on this static site are rendered

To do:
configuration files needed..
1. mssEntities from the mssEntities file need to be ordered to dictate what order the entities/subentities/etc appear in each grouping in the master dropdown menus. The same file can be used to supply aliases for the page rubrics and for the menu entries
Thus a JSON file like this will do:
entityAliases = [
	{original: "L1", menu: "Link 1", rubric: "Link 1"}
]

2. The sequence and specification of collateable and collated entities needs to be declared

3. Maybe: an alias file for the manuscripts? and specify their ordering also?

Further configuration files can be deployed to override css styling, and javascript rendering, splash pages, etc etc

Some useful functions...
let place=compareIndex.findIndex(x => x.entity === myEntity);
...brings back the position in compareIndex of "entity: myEntity"