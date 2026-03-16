import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Portfolio Types
  public type PortfolioCategory = {
    #web;
    #mobile;
    #saas;
    #ai;
    #blockchain;
    #branding;
  };

  public type PublishStatus = {
    #draft;
    #published;
    #archived;
  };

  public type PortfolioProject = {
    id : Nat;
    title : Text;
    clientName : Text;
    industry : Text;
    category : PortfolioCategory;
    tags : [Text];
    thumbnail : ?Storage.ExternalBlob;
    galleryImages : [Storage.ExternalBlob];
    description : Text;
    technologiesUsed : [Text];
    results : [Text];
    linkedTestimonialId : ?Nat;
    publishStatus : PublishStatus;
    displayOrder : Nat;
    createdDate : ?Int;
    lastUpdatedDate : ?Int;
  };

  public type PortfolioProjectInput = {
    title : Text;
    clientName : Text;
    industry : Text;
    category : PortfolioCategory;
    tags : [Text];
    thumbnail : ?Storage.ExternalBlob;
    galleryImages : [Storage.ExternalBlob];
    description : Text;
    technologiesUsed : [Text];
    results : [Text];
    linkedTestimonialId : ?Nat;
    publishStatus : PublishStatus;
    displayOrder : Nat;
  };

  public type PortfolioProjectUpdate = {
    id : Nat;
    title : Text;
    clientName : Text;
    industry : Text;
    category : PortfolioCategory;
    tags : [Text];
    thumbnail : ?Storage.ExternalBlob;
    galleryImages : [Storage.ExternalBlob];
    description : Text;
    technologiesUsed : [Text];
    results : [Text];
    linkedTestimonialId : ?Nat;
    publishStatus : PublishStatus;
    displayOrder : Nat;
  };

  public type PaginatedPortfolioProjects = {
    items : [PortfolioProject];
    total : Nat;
  };

  public type PortfolioFilter = {
    category : ?PortfolioCategory;
    status : ?PublishStatus;
    search : ?Text;
  };

  // State
  let portfolioProjects = Map.empty<Nat, PortfolioProject>();
  var lastPortfolioProjectId = 0;

  // Portfolio CRUD Functions
  public shared ({ caller }) func createPortfolioProject(input : PortfolioProjectInput) : async PortfolioProject {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create portfolio projects");
    };

    let newId = lastPortfolioProjectId + 1;
    lastPortfolioProjectId := newId;

    let project : PortfolioProject = {
      id = newId;
      title = input.title;
      clientName = input.clientName;
      industry = input.industry;
      category = input.category;
      tags = input.tags;
      thumbnail = input.thumbnail;
      galleryImages = input.galleryImages;
      description = input.description;
      technologiesUsed = input.technologiesUsed;
      results = input.results;
      linkedTestimonialId = input.linkedTestimonialId;
      publishStatus = input.publishStatus;
      displayOrder = input.displayOrder;
      createdDate = ?Time.now();
      lastUpdatedDate = ?Time.now();
    };

    portfolioProjects.add(newId, project);
    project;
  };

  public shared ({ caller }) func updatePortfolioProject(input : PortfolioProjectUpdate) : async ?PortfolioProject {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update portfolio projects");
    };

    switch (portfolioProjects.get(input.id)) {
      case (null) { null };
      case (?existingProject) {
        let updatedProject : PortfolioProject = {
          id = input.id;
          title = input.title;
          clientName = input.clientName;
          industry = input.industry;
          category = input.category;
          tags = input.tags;
          thumbnail = input.thumbnail;
          galleryImages = input.galleryImages;
          description = input.description;
          technologiesUsed = input.technologiesUsed;
          results = input.results;
          linkedTestimonialId = input.linkedTestimonialId;
          publishStatus = input.publishStatus;
          displayOrder = input.displayOrder;
          createdDate = existingProject.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        portfolioProjects.add(input.id, updatedProject);
        ?updatedProject;
      };
    };
  };

  public shared ({ caller }) func deletePortfolioProject(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete portfolio projects");
    };

    switch (portfolioProjects.get(id)) {
      case (null) { false };
      case (?_) {
        portfolioProjects.remove(id);
        true;
      };
    };
  };

  public query ({ caller }) func getPortfolioProject(id : Nat) : async ?PortfolioProject {
    portfolioProjects.get(id);
  };

  public query ({ caller }) func getPortfolioProjects(page : Nat, pageSize : Nat, filter : ?PortfolioFilter) : async PaginatedPortfolioProjects {
    if (pageSize == 0) { Runtime.trap("Page size must be greater than 0") };

    let filteredProjects = switch (filter) {
      case (null) { portfolioProjects.values().toArray() };
      case (?f) {
        portfolioProjects.values().toArray().filter(
          func(p) {
            let matchesCategory = switch (f.category) {
              case (null) { true };
              case (?c) { p.category == c };
            };
            let matchesStatus = switch (f.status) {
              case (null) { true };
              case (?s) { p.publishStatus == s };
            };
            let matchesSearch = switch (f.search) {
              case (null) { true };
              case (?s) {
                p.title.toLower().contains(#text(s.toLower())) or p.description.toLower().contains(#text(s.toLower()));
              };
            };

            matchesCategory and matchesStatus and matchesSearch;
          }
        );
      };
    };

    let total = filteredProjects.size();
    if (pageSize == 0) { Runtime.trap("Page size must be greater than 0") };
    let start = (if (page > 0) { page - 1 } else { 0 }) * pageSize;
    if (start >= total) {
      return {
        items = [];
        total;
      };
    };

    let end = Nat.min(start + pageSize, total);
    {
      items = filteredProjects.sliceToArray(start, end);
      total;
    };
  };

  public shared ({ caller }) func reorderPortfolioProjects(ids : [Nat]) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reorder portfolio projects");
    };

    let projects = portfolioProjects.values().toArray();
    for ((index, id) in ids.enumerate()) {
      switch (portfolioProjects.get(id)) {
        case (?project) {
          let updatedProject = {
            project with
            displayOrder = projects.size() - index;
          };
          portfolioProjects.add(id, updatedProject);
        };
        case (null) {};
      };
    };
    true;
  };

  public shared ({ caller }) func bulkUpdatePortfolioStatus(ids : [Nat], status : PublishStatus) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk update portfolio status");
    };

    var count = 0;
    for (id in ids.values()) {
      switch (portfolioProjects.get(id)) {
        case (?project) {
          let updatedProject = {
            project with
            publishStatus = status;
            lastUpdatedDate = ?Time.now();
          };
          portfolioProjects.add(id, updatedProject);
          count += 1;
        };
        case (null) {};
      };
    };
    count;
  };

  public shared ({ caller }) func bulkDeletePortfolioProjects(ids : [Nat]) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk delete portfolio projects");
    };

    var count = 0;
    for (id in ids.values()) {
      if (portfolioProjects.containsKey(id)) {
        portfolioProjects.remove(id);
        count += 1;
      };
    };
    count;
  };

  // ─── Testimonial Types ───────────────────────────────────────────────────────

  public type Testimonial = {
    id : Nat;
    quote : Text;
    authorName : Text;
    jobTitle : Text;
    companyName : Text;
    photo : ?Storage.ExternalBlob;
    linkedPortfolioId : ?Nat;
    rating : Nat; // 1-5
    displayOrder : Nat;
    isVisible : Bool;
    createdDate : ?Int;
    lastUpdatedDate : ?Int;
  };

  public type TestimonialInput = {
    quote : Text;
    authorName : Text;
    jobTitle : Text;
    companyName : Text;
    photo : ?Storage.ExternalBlob;
    linkedPortfolioId : ?Nat;
    rating : Nat;
    displayOrder : Nat;
    isVisible : Bool;
  };

  public type TestimonialUpdate = {
    id : Nat;
    quote : Text;
    authorName : Text;
    jobTitle : Text;
    companyName : Text;
    photo : ?Storage.ExternalBlob;
    linkedPortfolioId : ?Nat;
    rating : Nat;
    displayOrder : Nat;
    isVisible : Bool;
  };

  public type PaginatedTestimonials = {
    items : [Testimonial];
    total : Nat;
  };

  public type TestimonialFilter = {
    isVisible : ?Bool;
    minRating : ?Nat;
    maxRating : ?Nat;
    search : ?Text;
  };

  // Testimonial State
  let testimonials = Map.empty<Nat, Testimonial>();
  var lastTestimonialId = 0;

  // ─── Testimonial CRUD ────────────────────────────────────────────────────────

  public shared ({ caller }) func createTestimonial(input : TestimonialInput) : async Testimonial {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create testimonials");
    };

    let newId = lastTestimonialId + 1;
    lastTestimonialId := newId;

    let testimonial : Testimonial = {
      id = newId;
      quote = input.quote;
      authorName = input.authorName;
      jobTitle = input.jobTitle;
      companyName = input.companyName;
      photo = input.photo;
      linkedPortfolioId = input.linkedPortfolioId;
      rating = input.rating;
      displayOrder = input.displayOrder;
      isVisible = input.isVisible;
      createdDate = ?Time.now();
      lastUpdatedDate = ?Time.now();
    };

    testimonials.add(newId, testimonial);
    testimonial;
  };

  public shared ({ caller }) func updateTestimonial(input : TestimonialUpdate) : async ?Testimonial {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update testimonials");
    };

    switch (testimonials.get(input.id)) {
      case (null) { null };
      case (?existing) {
        let updated : Testimonial = {
          id = input.id;
          quote = input.quote;
          authorName = input.authorName;
          jobTitle = input.jobTitle;
          companyName = input.companyName;
          photo = input.photo;
          linkedPortfolioId = input.linkedPortfolioId;
          rating = input.rating;
          displayOrder = input.displayOrder;
          isVisible = input.isVisible;
          createdDate = existing.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        testimonials.add(input.id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteTestimonial(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete testimonials");
    };
    switch (testimonials.get(id)) {
      case (null) { false };
      case (?_) {
        testimonials.remove(id);
        true;
      };
    };
  };

  public query func getTestimonial(id : Nat) : async ?Testimonial {
    testimonials.get(id);
  };

  public query func getTestimonials(page : Nat, pageSize : Nat, filter : ?TestimonialFilter) : async PaginatedTestimonials {
    if (pageSize == 0) { Runtime.trap("Page size must be greater than 0") };

    let all = testimonials.values().toArray();

    let filtered = switch (filter) {
      case (null) { all };
      case (?f) {
        all.filter(func(t) {
          let matchesVisible = switch (f.isVisible) {
            case (null) { true };
            case (?v) { t.isVisible == v };
          };
          let matchesMin = switch (f.minRating) {
            case (null) { true };
            case (?min) { t.rating >= min };
          };
          let matchesMax = switch (f.maxRating) {
            case (null) { true };
            case (?max) { t.rating <= max };
          };
          let matchesSearch = switch (f.search) {
            case (null) { true };
            case (?s) {
              let q = s.toLower();
              t.authorName.toLower().contains(#text(q)) or
              t.companyName.toLower().contains(#text(q)) or
              t.quote.toLower().contains(#text(q));
            };
          };
          matchesVisible and matchesMin and matchesMax and matchesSearch;
        });
      };
    };

    let total = filtered.size();
    let start = (if (page > 0) { page - 1 } else { 0 }) * pageSize;
    if (start >= total) {
      return { items = []; total };
    };
    let end = Nat.min(start + pageSize, total);
    { items = filtered.sliceToArray(start, end); total };
  };

  public shared ({ caller }) func reorderTestimonials(ids : [Nat]) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reorder testimonials");
    };
    let total = testimonials.values().toArray().size();
    for ((index, id) in ids.enumerate()) {
      switch (testimonials.get(id)) {
        case (?t) {
          testimonials.add(id, { t with displayOrder = total - index; lastUpdatedDate = ?Time.now() });
        };
        case (null) {};
      };
    };
    true;
  };

  public shared ({ caller }) func bulkUpdateTestimonialVisibility(ids : [Nat], isVisible : Bool) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk update testimonials");
    };
    var count = 0;
    for (id in ids.values()) {
      switch (testimonials.get(id)) {
        case (?t) {
          testimonials.add(id, { t with isVisible; lastUpdatedDate = ?Time.now() });
          count += 1;
        };
        case (null) {};
      };
    };
    count;
  };

  public shared ({ caller }) func bulkDeleteTestimonials(ids : [Nat]) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk delete testimonials");
    };
    var count = 0;
    for (id in ids.values()) {
      if (testimonials.containsKey(id)) {
        testimonials.remove(id);
        count += 1;
      };
    };
    count;
  };
};
