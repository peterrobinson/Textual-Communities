var $ = require('jquery')
  , CommunityService = require('./services/community')
  , config = require('./config')
  , BrowserFunctionService = require('./services/functions')
;

var RetrieveCollationComponent = ng.core.Component({
  selector: 'tc-managemodal-retrievecollation',
  templateUrl: '/app/retrievecollation.html',
  inputs : ['community'],
  directives: [
    require('./directives/modaldraggable')
  ],
}).Class({
  constructor: [CommunityService, function(communityService) {
//    var Doc = TCService.Doc, doc = new Doc()
    this._communityService = communityService;
    this.message=this.success="";
    this.everycollation=true;
    this.nAllCollations=0;
    this.inSearch=false;
    }],
  closeModalCE: function() {
    this.message=this.success="";
    $('#MMADdiv').css("margin-top", "30px");
    $('#MMADbutton').css("margin-top", "20px");
    $('#manageModal').modal('hide');
  },
  ngOnInit: function() {
    this.header="Retrieve Collations for "+this.community.attrs.name;
    if (this.community.attrs.collationents.length>1) {
    	this.success="Collation entity file "+this.community.attrs.collentsfilename+" loaded with "+this.community.attrs.collationents.length+" entities.";
    } else {
    	this.success="No collation entity file loaded. If your texts are complex or long you should load a collation entity file through the Edit community dialogue.";
    }
    this.ranges=[{start:this.community.attrs.abbr+"/entity=X:line=Y", end:this.community.attrs.abbr+"/entity=X:line=Y", count:0}];
    let self=this;
    this.inSearch=false;
    if (this.community.attrs.collationents.length>1) {
    	self.nAllCollations=self.community.attrs.collationents.length;
    } else {
		$.get(config.BACKEND_URL+'countCommunityCollations?community='+this.community.attrs.abbr, function(res) {
			if (res.success) self.nAllCollations=res.count;
		});
	}
  },
  ngOnChanges: function() {
//    this.communi
    this.message="";
    this.success="";
    $('#manageModal').width("700px");
    $('#manageModal').height("310px");
  },
 chooseCollations: function(choice){
    this.everycollation=choice;
  },
  addRange: function() {
  	this.ranges.push({start:"", end:"", count:0});
  	let height=$('#manageModal').height();
  	$('#manageModal').height(height+20);
  },
  removeRange: function(i) {
  	this.ranges.splice(i, 1);
  	 let height=$('#manageModal').height();
  	$('#manageModal').height(height-20);
  },
  clickEntity: function(i) {
  	  let self=this;
  	  if (rangeReady(self, self.ranges[i].start) && rangeReady(self, self.ranges[i].end)) {
  	  	  if (self.inSearch) {
  	  	  	self.success="Searching range. Wait!";
  	  	  	self.ranges[i].count=0;
  	  	  	return;
  	  	  }
  	  	  self.inSearch=true;
		  $.ajax({
			url:config.BACKEND_URL+'countRangeCollations?community='+self.community.attrs.abbr,
			type: 'POST',
			data: JSON.stringify({range: self.ranges[i], collentities: self.community.attrs.collationents}),
			accepts: 'application/json',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		  })
		   .done(function(data){
		//	if (data.success) self.success="Found "+data.count+" approved collations"
			 self.ranges[i].count=data.count-1;
			 self.success="";
			 self.inSearch=false;
		   })
		   .fail(function( jqXHR, textStatus, errorThrown) {
		    self.inSearch=false;
		    self.success="";
			alert( "error" + errorThrown );
		   });
	  } else {
	  	self.ranges[i].count=0;
	  }
  },
  submit: function(){
      var self=this;
      let choice=$("input[name='outputForm']:checked").val();
      let partorall="all"
      if (!this.everycollation) partorall="part"
      $.ajax({
      	url:config.BACKEND_URL+'getCollations?community='+self.community.attrs.abbr,
      	type: 'POST',
      	data: JSON.stringify({ranges: self.ranges, collentities: self.community.attrs.collationents, output:choice, partorall:partorall}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	 .done (function(result) {
	 	  self.success="Collation for "+result.length+" block(s) found. Now downloading..Check your downloads folder; close this window when it is downloaded"
          BrowserFunctionService.download(JSON.stringify(result), self.community.attrs.abbr+"-COLLATION.json", "application/json")
	})
     .fail (function(jqXHR, textStatus, errorThrown) {
         alert( "error" + errorThrown );
    });
 }
});


function rangesReady(self) {
	for (let i=0; i<self.ranges.length; i++) {
		if (!rangeReady(self, self.ranges[i].start) || !rangeReady(self, self.ranges[i].end)) return false;
	}
	return true;
}

function rangeReady(self, entity) {
	if (entity=="") return true;
	let community=entity.slice(0, entity.indexOf("/"));
	if (community!=self.community.attrs.abbr) return false;
	let parts=entity.slice( entity.indexOf("/")+1).split(":");
	let topEntity=parts[0].slice(parts[0].indexOf("=")+1);  //do we know the top entity?
	if (self.community.attrs.entities.filter(entity=>entity.attrs.name==topEntity).length==0) return false;
	for (let i=1; i<parts.length; i++) {
		let bits=parts[i].split("=");
		if (bits.length!=2) return false;
		if (bits[0]=="" || bits[1]=="") return false;
	}
	return true;
}

module.exports = RetrieveCollationComponent;
