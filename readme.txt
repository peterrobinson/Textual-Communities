Running node/npm

cd ~/venv/TCangular/tc
//start the mongod database
mongod

//start the server
npm start

//see the logs
npm run logs


////updated september 2022

Running textual communities on a local machine

1. Start mongodb in any terminal window with:
brew services restart mongodb/brew/mongodb-community@6.0

2. Start TC itself:
cd ~/venv/TCangular/TC
npm start
npm run logs

3. Start the collation editor
cd /Applications/collation_editor/
./startup.sh

This starts the python part of the collation editor but the code embedded here to start the CollateX server fails, with numerous Java errors. So:

4. Start the collateX server:
In the same Collation editor folder there is collatex-tools-1.7.1.jar
Start it up with:
java -jar collatex-tools-1.7.1.jar -S
(the minus S starts the collateX server on localhost:7369. -h invokes help)

that's it! good luck!

Now, to commit to GIT

git status 
git commit -a -m "Changes for complex collate conversions"
//need to switch to vpn usask
git push


//checking if  mongodb is running and accessible:
nc -zv 127.0.0.1 27017
Connection to 127.0.0.1 port 27017 [tcp/*] succeeded!
NOTE under Ventura 13.4 if the firewall is turned on in network settings 27017 is NOT accessible even though mongodb is running fine.

//manipulating database
Deleting database
Start mongosh from command line (while mongo is running)
At the prompt:
show dbs //shows all our databases, including tc_dev and tc_test
use tc_dev  //this one!
 db.dropDatabase()  //removes! repeat for tc_test
 show dbs //check it is gone! 
 
// Saving and restoring database
 from the shell (NOT mongoSh)
 mongodump //dumps the current database into a folder called dump into the current directory
 mongorestore dump/      //navigate to folder with the dump
 