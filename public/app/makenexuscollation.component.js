var $ = require('jquery')
  , CommunityService = require('./services/community')
  , UIService = require('./services/ui')
  , config = require('./config')
  , BrowserFunctionService = require('./services/functions')
  , DualFunctionService = require('./services/dualfunctions')
;

var makeNexusCollationComponent = ng.core.Component({
  selector: 'tc-managemodal-makenexuscollation',
  templateUrl: '/app/makenexuscollation.html',
  inputs : ['community'],
  directives: [
    require('./directives/modaldraggable'),
    require('./directives/filereader'),
  ],
}).Class({
  constructor: [CommunityService, UIService, function(communityService, uiService) {
//    var Doc = TCService.Doc, doc = new Doc()
    this._communityService = communityService;
    this.success="";
    this.message="";
    this.uiService = uiService;
    this.skipValidation=false;
    }],
  closeModalCXN: function() {
    this.message=this.success="";
//    $('#MMADdiv').css("margin-top", "30px");
//    $('#MMADbutton').css("margin-top", "20px");
    $('#manageModal').modal('hide');
  },
  filechange: function(filecontent) {
    this.filecontent = filecontent;
  },
  ngOnChanges: function() {
    this.success="";
    this.message="";
    $('#manageModal').width("500px");
    $('#manageModal').height("170px");
  },
  infoMN: function(){
  	alert("This function creates a NEXUS file suitable for processing by a phylogenetic analysis program (for example, PAUP*).\rYou should use a TEI/XML file created from the 'Retrieve Collations' item for this conversion.");
  },
  submit: function(){
      var self=this;
      var text = this.filecontent;
      if (!text) {
        this.message = 'Choose a file';
        $('#manageModal').height("220px");
        return;
      } else if (this.skipValidation) {
      	  self.success="Skipped parse of uploaded file. Now converting to NEXUS";
          $('#manageModal').height("220px");
          self.message="";
          var result=DualFunctionService.makeNEXUS(text);
          result=result.replace(/<br\/>/gi, "\r").replace(/&nbsp;/gi," ");
          BrowserFunctionService.download(result, self.community.attrs.abbr+"-NEXUS", "text/plain");
		  self.message="";
		  self.success="Converted to NEXUS. Check your downloads folder."; 
      } else $.post(config.BACKEND_URL+'validate?'+'id='+this.community.getId(), {
  //      xml: "<TEI><teiHeader><fileDesc><titleStmt><title>dummy</title></titleStmt><publicationStmt><p>dummy</p></publicationStmt><sourceDesc><p>dummy</p></sourceDesc></fileDesc></teiHeader>\r"+text+"</TEI>",
          xml: text,
      }, function(res) {
        if (res.error.length>0) {
          //check that error line exists
            self.uiService.manageModal$.emit({
              type: 'parse-xmlload',
              error: res.error,
              docname: "Source apparatus file",
              lines: text.split("\n")
            });
          return;
        } else {
          //convert this text to NEXUS...not asynchronous!
          self.success="Parsed uploaded file. Now converting to NEXUS";
          $('#manageModal').height("220px");
          self.message="";
          var result=DualFunctionService.makeNEXUS(text);
          result=result.replace(/<br\/>/gi, "\r").replace(/&nbsp;/gi," ");
          BrowserFunctionService.download(result, self.community.attrs.abbr+"-NEXUS.nex", "text/plain");
		  self.message="";
		  self.success="Converted to NEXUS. Check your downloads folder.";
      }
    });
  }
});








module.exports = makeNexusCollationComponent;
