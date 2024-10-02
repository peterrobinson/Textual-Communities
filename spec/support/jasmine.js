const Jasmine = require('jasmine');
const jasmine = new Jasmine();

jasmine.loadConfig({
  "spec_dir": "spec",
  "spec_files": [
    "**/*[sS]pec.js"
  ],
  "helpers": [
    "helpers/**/*.js"
  ],
  "stopSpecOnExpectationFailure": false,
  "random": false
});

jasmine.exitOnCompletion = false;


/* async function getResult() {
	console.log("inside function");
	const result = await jasmine.execute();
	if (result.overallStatus === 'passed') {
		console.log('All specs have passed');
	} else {
		console.log('At least one spec has failed');
	}
} */


/* jasmine.onComplete(function(passed) {
  if (passed) {
    console.log('All specs have passed now. Great news');
  } else {
    console.log('At least one spec has failed');
  }
}); */


jasmine.configureDefaultReporter({
    // The `timer` passed to the reporter will determine the mechanism for seeing how long the suite takes to run.
    timer: new jasmine.jasmine.Timer(),
    // The `print` function passed the reporter will be called to print its results.
    print: function() {
 //      process.stdout.write(JSON.stringify(arguments));
 //      console.log('Test completed');
    },
    // `showColors` determines whether or not the reporter should use ANSI color codes.
    showColors: true
}); 

jasmine.execute([
  'spec/doc.spec.js',
]); 
