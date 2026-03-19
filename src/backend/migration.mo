import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldPortfolioProject = {
    id : Nat;
    title : Text;
    clientName : Text;
    industry : Text;
    category : {
      #web;
      #mobile;
      #saas;
      #ai;
      #blockchain;
      #branding;
    };
    tags : [Text];
    thumbnail : ?Storage.ExternalBlob;
    galleryImages : [Storage.ExternalBlob];
    description : Text;
    technologiesUsed : [Text];
    results : [Text];
    linkedTestimonialId : ?Nat;
    publishStatus : {
      #draft;
      #published;
      #archived;
    };
    displayOrder : Nat;
    createdDate : ?Int;
    lastUpdatedDate : ?Int;
  };

  type OldActor = {
    portfolioProjects : Map.Map<Nat, OldPortfolioProject>;
    lastPortfolioProjectId : Nat;
    // Other state fields...
  };

  type NewPortfolioProject = {
    id : Nat;
    title : Text;
    clientName : Text;
    industry : Text;
    category : {
      #web;
      #mobile;
      #saas;
      #ai;
      #blockchain;
      #branding;
    };
    tags : [Text];
    thumbnail : ?Storage.ExternalBlob;
    galleryImages : [Storage.ExternalBlob];
    description : Text;
    technologiesUsed : [Text];
    results : [Text];
    linkedTestimonialId : ?Nat;
    publishStatus : {
      #draft;
      #published;
      #archived;
    };
    displayOrder : Nat;
    projectUrl : ?Text;
    createdDate : ?Int;
    lastUpdatedDate : ?Int;
  };

  type NewActor = {
    portfolioProjects : Map.Map<Nat, NewPortfolioProject>;
    lastPortfolioProjectId : Nat;
    // Other state fields...
  };

  public func run(old : OldActor) : NewActor {
    let newProjects = old.portfolioProjects.map<Nat, OldPortfolioProject, NewPortfolioProject>(
      func(_id, oldProject) {
        { oldProject with projectUrl = null };
      }
    );
    {
      old with
      portfolioProjects = newProjects;
      // Other state fields remain unchanged
    };
  };
};
