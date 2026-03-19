import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
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
    projectUrl : ?Text;
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
    projectUrl : ?Text;
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
    projectUrl : ?Text;
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
      projectUrl = input.projectUrl;
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
          projectUrl = input.projectUrl;
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

    let sortedProjects = filteredProjects.sort(func(a : PortfolioProject, b : PortfolioProject) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let total = sortedProjects.size();
    let start = (if (page > 0) { page - 1 } else { 0 }) * pageSize;
    if (start >= total) {
      return {
        items = [];
        total;
      };
    };

    let end = Nat.min(start + pageSize, total);
    {
      items = sortedProjects.sliceToArray(start, end);
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

  // ─── Testimonial Types ───────────────────────────────────────────────

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

  // ─── Testimonial CRUD ────────────────────────────────────────────────

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

    let sortedTestimonials = filtered.sort(func(a : Testimonial, b : Testimonial) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let total = sortedTestimonials.size();
    let start = (if (page > 0) { page - 1 } else { 0 }) * pageSize;
    if (start >= total) {
      return { items = []; total };
    };
    let end = Nat.min(start + pageSize, total);
    { items = sortedTestimonials.sliceToArray(start, end); total };
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

  // ─── Service Types ────────────────────────────────────────────────

  public type ServiceProcessStep = {
    step : Text;
    description : Text;
  };

  public type ServiceFaq = {
    question : Text;
    answer : Text;
  };

  public type Service = {
    id : Nat;
    title : Text;
    icon : ?Storage.ExternalBlob;
    shortDescription : Text;
    fullDescription : Text;
    useCases : [Text];
    processSteps : [ServiceProcessStep];
    targetAudience : Text;
    faqs : [ServiceFaq];
    displayOrder : Nat;
    isVisible : Bool;
    createdDate : ?Int;
    lastUpdatedDate : ?Int;
  };

  public type ServiceInput = {
    title : Text;
    icon : ?Storage.ExternalBlob;
    shortDescription : Text;
    fullDescription : Text;
    useCases : [Text];
    processSteps : [ServiceProcessStep];
    targetAudience : Text;
    faqs : [ServiceFaq];
    displayOrder : Nat;
    isVisible : Bool;
  };

  public type ServiceUpdate = {
    id : Nat;
    title : Text;
    icon : ?Storage.ExternalBlob;
    shortDescription : Text;
    fullDescription : Text;
    useCases : [Text];
    processSteps : [ServiceProcessStep];
    targetAudience : Text;
    faqs : [ServiceFaq];
    displayOrder : Nat;
    isVisible : Bool;
  };

  public type PaginatedServices = {
    items : [Service];
    total : Nat;
  };

  public type ServiceFilter = {
    isVisible : ?Bool;
    search : ?Text;
  };

  // Service State
  let services = Map.empty<Nat, Service>();
  var lastServiceId = 0;

  // ─── Service CRUD ────────────────────────────────────────────────

  public shared ({ caller }) func createService(input : ServiceInput) : async Service {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create services");
    };
    let newId = lastServiceId + 1;
    lastServiceId := newId;
    let service : Service = {
      id = newId;
      title = input.title;
      icon = input.icon;
      shortDescription = input.shortDescription;
      fullDescription = input.fullDescription;
      useCases = input.useCases;
      processSteps = input.processSteps;
      targetAudience = input.targetAudience;
      faqs = input.faqs;
      displayOrder = input.displayOrder;
      isVisible = input.isVisible;
      createdDate = ?Time.now();
      lastUpdatedDate = ?Time.now();
    };
    services.add(newId, service);
    service;
  };

  public shared ({ caller }) func updateService(input : ServiceUpdate) : async ?Service {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update services");
    };
    switch (services.get(input.id)) {
      case (null) { null };
      case (?existing) {
        let updated : Service = {
          id = input.id;
          title = input.title;
          icon = input.icon;
          shortDescription = input.shortDescription;
          fullDescription = input.fullDescription;
          useCases = input.useCases;
          processSteps = input.processSteps;
          targetAudience = input.targetAudience;
          faqs = input.faqs;
          displayOrder = input.displayOrder;
          isVisible = input.isVisible;
          createdDate = existing.createdDate;
          lastUpdatedDate = ?Time.now();
        };
        services.add(input.id, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteService(id : Nat) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete services");
    };
    switch (services.get(id)) {
      case (null) { false };
      case (?_) {
        services.remove(id);
        true;
      };
    };
  };

  public query func getService(id : Nat) : async ?Service {
    services.get(id);
  };

  public query func getServices(page : Nat, pageSize : Nat, filter : ?ServiceFilter) : async PaginatedServices {
    if (pageSize == 0) { Runtime.trap("Page size must be greater than 0") };
    let all = services.values().toArray();
    let filtered = switch (filter) {
      case (null) { all };
      case (?f) {
        all.filter(func(s) {
          let matchesVisible = switch (f.isVisible) {
            case (null) { true };
            case (?v) { s.isVisible == v };
          };
          let matchesSearch = switch (f.search) {
            case (null) { true };
            case (?q) {
              let ql = q.toLower();
              s.title.toLower().contains(#text(ql)) or
              s.shortDescription.toLower().contains(#text(ql));
            };
          };
          matchesVisible and matchesSearch;
        });
      };
    };
    let sortedServices = filtered.sort(func(a : Service, b : Service) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let total = sortedServices.size();
    let start = (if (page > 0) { page - 1 } else { 0 }) * pageSize;
    if (start >= total) {
      return { items = []; total };
    };
    let end = Nat.min(start + pageSize, total);
    { items = sortedServices.sliceToArray(start, end); total };
  };

  public shared ({ caller }) func reorderServices(ids : [Nat]) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reorder services");
    };
    let total = services.values().toArray().size();
    for ((index, id) in ids.enumerate()) {
      switch (services.get(id)) {
        case (?s) {
          services.add(id, { s with displayOrder = total - index; lastUpdatedDate = ?Time.now() });
        };
        case (null) {};
      };
    };
    true;
  };

  public shared ({ caller }) func bulkUpdateServiceVisibility(ids : [Nat], isVisible : Bool) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk update services");
    };
    var count = 0;
    for (id in ids.values()) {
      switch (services.get(id)) {
        case (?s) {
          services.add(id, { s with isVisible; lastUpdatedDate = ?Time.now() });
          count += 1;
        };
        case (null) {};
      };
    };
    count;
  };

  public shared ({ caller }) func bulkDeleteServices(ids : [Nat]) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can bulk delete services");
    };
    var count = 0;
    for (id in ids.values()) {
      if (services.containsKey(id)) {
        services.remove(id);
        count += 1;
      };
    };
    count;
  };

  // ─── Contact Settings Types ────────────────────────────────────────

  public type BusinessHours = {
    monday : Text;
    tuesday : Text;
    wednesday : Text;
    thursday : Text;
    friday : Text;
    saturday : Text;
    sunday : Text;
  };

  public type ContactWhatsApp = {
    number : ?Text;
    isEnabled : Bool;
  };

  public type ContactEmail = {
    primary : Text;
    secondary : ?Text;
    responseTime : Text;
  };

  public type ContactPhone = {
    primary : ?Text;
    secondary : ?Text;
    isEnabled : Bool;
  };

  public type ContactAddress = {
    fullAddress : Text;
    businessHours : BusinessHours;
  };

  public type ContactMap = {
    latitude : Float;
    longitude : Float;
  };

  public type ContactSettings = {
    whatsapp : ContactWhatsApp;
    email : ContactEmail;
    phone : ContactPhone;
    address : ContactAddress;
    map : ContactMap;
    lastUpdated : Int;
  };

  // Contact Settings defaults
  let defaultContactSettings : ContactSettings = {
    whatsapp = { number = ?"34695250655"; isEnabled = true };
    email = {
      primary = "Aldotelicosl@hotmail.com";
      secondary = null;
      responseTime = "Usualmente responde en 2 horas";
    };
    phone = { primary = null; secondary = null; isEnabled = false };
    address = {
      fullAddress = "C. Albertillas, 5, LOCAL, 29003 Málaga";
      businessHours = {
        monday = "09:30 - 22:00";
        tuesday = "09:30 - 22:00";
        wednesday = "09:30 - 22:00";
        thursday = "09:30 - 22:00";
        friday = "09:30 – 14:00, 17:00 – 22:00";
        saturday = "09:30 – 22:00";
        sunday = "10:00 – 14:00, 17:00 – 20:00";
      };
    };
    map = { latitude = 36.696990; longitude = -4.447439 };
    lastUpdated = 0;
  };

  // Contact Settings stable state
  var contactSettings : ContactSettings = defaultContactSettings;
  var previousContactSettings : ?ContactSettings = null;

  // ─── Contact Settings CRUD ─────────────────────────────────────

  public query func getContactSettings() : async ContactSettings {
    contactSettings;
  };

  public shared ({ caller }) func updateContactSettings(input : ContactSettings) : async ContactSettings {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update contact settings");
    };
    previousContactSettings := ?contactSettings;
    let updated : ContactSettings = {
      input with lastUpdated = Time.now();
    };
    contactSettings := updated;
    updated;
  };

  public query func getPreviousContactSettings() : async ?ContactSettings {
    previousContactSettings;
  };

  public shared ({ caller }) func resetContactSettings() : async ContactSettings {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reset contact settings");
    };
    previousContactSettings := ?contactSettings;
    let reset : ContactSettings = {
      defaultContactSettings with lastUpdated = Time.now();
    };
    contactSettings := reset;
    reset;
  };

  // ─── Data Export ─────────────────────────────────────────────

  public type ExportTotalRecords = {
    portfolio : Nat;
    services : Nat;
    testimonials : Nat;
  };

  public type ExportMetadata = {
    exportDate : Int;
    exportVersion : Text;
    totalRecords : ExportTotalRecords;
  };

  public type ExportData = {
    metadata : ExportMetadata;
    portfolio : [PortfolioProject];
    services : [Service];
    testimonials : [Testimonial];
    contactSettings : ?ContactSettings;
  };

  public shared query ({ caller }) func exportData() : async ExportData {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can export data");
    };
    let portfolioItems = portfolioProjects.values().toArray();
    let serviceItems = services.values().toArray();
    let testimonialItems = testimonials.values().toArray();
    {
      metadata = {
        exportDate = Time.now();
        exportVersion = "1.0";
        totalRecords = {
          portfolio = portfolioItems.size();
          services = serviceItems.size();
          testimonials = testimonialItems.size();
        };
      };
      portfolio = portfolioItems;
      services = serviceItems;
      testimonials = testimonialItems;
      contactSettings = ?contactSettings;
    };
  };

  // ─── Data Import ─────────────────────────────────────────────

  public type ImportMode = {
    #createAndUpdate;
    #createOnly;
    #replaceAll;
    #skip;
  };

  public type ImportOptions = {
    portfolioMode : ImportMode;
    servicesMode : ImportMode;
    testimonialsMode : ImportMode;
    importContactSettings : Bool;
  };

  public type ImportResultCounts = {
    created : Nat;
    updated : Nat;
  };

  public type ImportResult = {
    portfolio : ImportResultCounts;
    services : ImportResultCounts;
    testimonials : ImportResultCounts;
    contactSettingsUpdated : Bool;
  };

  public shared ({ caller }) func importData(data : ExportData, options : ImportOptions) : async ImportResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can import data");
    };

    let portfolioIdMap = Map.empty<Nat, Nat>();
    let testimonialIdMap = Map.empty<Nat, Nat>();
    let portfolioTestimonialRefs = Map.empty<Nat, Nat>();

    var portfolioCreated = 0;
    var portfolioUpdated = 0;
    var servicesCreated = 0;
    var servicesUpdated = 0;
    var testimonialsCreated = 0;
    var testimonialsUpdated = 0;
    var contactUpdated = false;

    // ── Portfolio ────────────────────────────────────────────────
    switch (options.portfolioMode) {
      case (#skip) {};
      case (#replaceAll) {
        let savedPortfolioImages = portfolioProjects.values().toArray();
        let pkeys = portfolioProjects.keys().toArray();
        for (k in pkeys.vals()) { portfolioProjects.remove(k) };
        for (p in data.portfolio.vals()) {
          let newId = lastPortfolioProjectId + 1;
          lastPortfolioProjectId := newId;
          portfolioIdMap.add(p.id, newId);
          switch (p.linkedTestimonialId) {
            case (null) {};
            case (?tid) { portfolioTestimonialRefs.add(newId, tid) };
          };
          let savedPrj = savedPortfolioImages.find(func(e) { e.title == p.title and e.clientName == p.clientName });
          let existingThumbnail = switch (savedPrj) { case (?e) { e.thumbnail }; case (null) { null } };
          let existingGallery = switch (savedPrj) { case (?e) { e.galleryImages }; case (null) { [] } };
          portfolioProjects.add(newId, {
            id = newId; title = p.title; clientName = p.clientName;
            industry = p.industry; category = p.category; tags = p.tags;
            thumbnail = existingThumbnail; galleryImages = existingGallery;
            description = p.description; technologiesUsed = p.technologiesUsed;
            results = p.results; linkedTestimonialId = null;
            publishStatus = p.publishStatus; displayOrder = p.displayOrder; projectUrl = p.projectUrl;
            createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
          });
          portfolioCreated += 1;
        };
      };
      case (#createOnly) {
        for (p in data.portfolio.vals()) {
          let existing = portfolioProjects.values().toArray().find(func(e) { e.title == p.title and e.clientName == p.clientName });
          switch (existing) {
            case (?e) { portfolioIdMap.add(p.id, e.id) };
            case (null) {
              let newId = lastPortfolioProjectId + 1;
              lastPortfolioProjectId := newId;
              portfolioIdMap.add(p.id, newId);
              switch (p.linkedTestimonialId) {
                case (null) {};
                case (?tid) { portfolioTestimonialRefs.add(newId, tid) };
              };
              portfolioProjects.add(newId, {
                id = newId; title = p.title; clientName = p.clientName;
                industry = p.industry; category = p.category; tags = p.tags;
                thumbnail = p.thumbnail; galleryImages = p.galleryImages;
                description = p.description; technologiesUsed = p.technologiesUsed;
                results = p.results; linkedTestimonialId = null;
                publishStatus = p.publishStatus; displayOrder = p.displayOrder; projectUrl = p.projectUrl;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              portfolioCreated += 1;
            };
          };
        };
      };
      case (#createAndUpdate) {
        for (p in data.portfolio.vals()) {
          let existing = portfolioProjects.values().toArray().find(func(e) { e.title == p.title and e.clientName == p.clientName });
          switch (existing) {
            case (?e) {
              portfolioIdMap.add(p.id, e.id);
              switch (p.linkedTestimonialId) {
                case (null) {};
                case (?tid) { portfolioTestimonialRefs.add(e.id, tid) };
              };
              portfolioProjects.add(e.id, {
                id = e.id; title = p.title; clientName = p.clientName;
                industry = p.industry; category = p.category; tags = p.tags;
                thumbnail = e.thumbnail; galleryImages = e.galleryImages;
                description = p.description; technologiesUsed = p.technologiesUsed;
                results = p.results; linkedTestimonialId = null;
                publishStatus = p.publishStatus; displayOrder = p.displayOrder; projectUrl = p.projectUrl;
                createdDate = e.createdDate; lastUpdatedDate = ?Time.now();
              });
              portfolioUpdated += 1;
            };
            case (null) {
              let newId = lastPortfolioProjectId + 1;
              lastPortfolioProjectId := newId;
              portfolioIdMap.add(p.id, newId);
              switch (p.linkedTestimonialId) {
                case (null) {};
                case (?tid) { portfolioTestimonialRefs.add(newId, tid) };
              };
              portfolioProjects.add(newId, {
                id = newId; title = p.title; clientName = p.clientName;
                industry = p.industry; category = p.category; tags = p.tags;
                thumbnail = p.thumbnail; galleryImages = p.galleryImages;
                description = p.description; technologiesUsed = p.technologiesUsed;
                results = p.results; linkedTestimonialId = null;
                publishStatus = p.publishStatus; displayOrder = p.displayOrder; projectUrl = p.projectUrl;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              portfolioCreated += 1;
            };
          };
        };
      };
    };

    // ── Services ─────────────────────────────────────────────────
    switch (options.servicesMode) {
      case (#skip) {};
      case (#replaceAll) {
        let savedServicesImages = services.values().toArray();
        let skeys = services.keys().toArray();
        for (k in skeys.vals()) { services.remove(k) };
        for (s in data.services.vals()) {
          let newId = lastServiceId + 1;
          lastServiceId := newId;
          let savedSvc = savedServicesImages.find(func(e) { e.title == s.title });
          let existingIcon = switch (savedSvc) { case (?e) { e.icon }; case (null) { null } };
          services.add(newId, {
            id = newId; title = s.title; icon = existingIcon;
            shortDescription = s.shortDescription; fullDescription = s.fullDescription;
            useCases = s.useCases; processSteps = s.processSteps;
            targetAudience = s.targetAudience; faqs = s.faqs;
            displayOrder = s.displayOrder; isVisible = s.isVisible;
            createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
          });
          servicesCreated += 1;
        };
      };
      case (#createOnly) {
        for (s in data.services.vals()) {
          let existing = services.values().toArray().find(func(e) { e.title == s.title });
          switch (existing) {
            case (?_) {};
            case (null) {
              let newId = lastServiceId + 1;
              lastServiceId := newId;
              services.add(newId, {
                id = newId; title = s.title; icon = s.icon;
                shortDescription = s.shortDescription; fullDescription = s.fullDescription;
                useCases = s.useCases; processSteps = s.processSteps;
                targetAudience = s.targetAudience; faqs = s.faqs;
                displayOrder = s.displayOrder; isVisible = s.isVisible;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              servicesCreated += 1;
            };
          };
        };
      };
      case (#createAndUpdate) {
        for (s in data.services.vals()) {
          let existing = services.values().toArray().find(func(e) { e.title == s.title });
          switch (existing) {
            case (?e) {
              services.add(e.id, {
                id = e.id; title = s.title; icon = e.icon;
                shortDescription = s.shortDescription; fullDescription = s.fullDescription;
                useCases = s.useCases; processSteps = s.processSteps;
                targetAudience = s.targetAudience; faqs = s.faqs;
                displayOrder = s.displayOrder; isVisible = s.isVisible;
                createdDate = e.createdDate; lastUpdatedDate = ?Time.now();
              });
              servicesUpdated += 1;
            };
            case (null) {
              let newId = lastServiceId + 1;
              lastServiceId := newId;
              services.add(newId, {
                id = newId; title = s.title; icon = s.icon;
                shortDescription = s.shortDescription; fullDescription = s.fullDescription;
                useCases = s.useCases; processSteps = s.processSteps;
                targetAudience = s.targetAudience; faqs = s.faqs;
                displayOrder = s.displayOrder; isVisible = s.isVisible;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              servicesCreated += 1;
            };
          };
        };
      };
    };

    // ── Testimonials ─────────────────────────────────────────────
    switch (options.testimonialsMode) {
      case (#skip) {};
      case (#replaceAll) {
        let savedTestimonialsImages = testimonials.values().toArray();
        let tkeys = testimonials.keys().toArray();
        for (k in tkeys.vals()) { testimonials.remove(k) };
        for (t in data.testimonials.vals()) {
          let newId = lastTestimonialId + 1;
          lastTestimonialId := newId;
          testimonialIdMap.add(t.id, newId);
          let remappedPid : ?Nat = switch (t.linkedPortfolioId) {
            case (null) { null };
            case (?pid) { portfolioIdMap.get(pid) };
          };
          let savedTst = savedTestimonialsImages.find(func(e) { e.authorName == t.authorName and e.companyName == t.companyName });
          let existingPhoto = switch (savedTst) { case (?e) { e.photo }; case (null) { null } };
          testimonials.add(newId, {
            id = newId; quote = t.quote; authorName = t.authorName;
            jobTitle = t.jobTitle; companyName = t.companyName; photo = existingPhoto;
            linkedPortfolioId = remappedPid; rating = t.rating;
            displayOrder = t.displayOrder; isVisible = t.isVisible;
            createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
          });
          testimonialsCreated += 1;
        };
      };
      case (#createOnly) {
        for (t in data.testimonials.vals()) {
          let existing = testimonials.values().toArray().find(func(e) { e.authorName == t.authorName and e.companyName == t.companyName });
          switch (existing) {
            case (?e) { testimonialIdMap.add(t.id, e.id) };
            case (null) {
              let newId = lastTestimonialId + 1;
              lastTestimonialId := newId;
              testimonialIdMap.add(t.id, newId);
              let remappedPid : ?Nat = switch (t.linkedPortfolioId) {
                case (null) { null };
                case (?pid) { portfolioIdMap.get(pid) };
              };
              testimonials.add(newId, {
                id = newId; quote = t.quote; authorName = t.authorName;
                jobTitle = t.jobTitle; companyName = t.companyName; photo = t.photo;
                linkedPortfolioId = remappedPid; rating = t.rating;
                displayOrder = t.displayOrder; isVisible = t.isVisible;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              testimonialsCreated += 1;
            };
          };
        };
      };
      case (#createAndUpdate) {
        for (t in data.testimonials.vals()) {
          let existing = testimonials.values().toArray().find(func(e) { e.authorName == t.authorName and e.companyName == t.companyName });
          switch (existing) {
            case (?e) {
              testimonialIdMap.add(t.id, e.id);
              let remappedPid : ?Nat = switch (t.linkedPortfolioId) {
                case (null) { null };
                case (?pid) { portfolioIdMap.get(pid) };
              };
              testimonials.add(e.id, {
                id = e.id; quote = t.quote; authorName = t.authorName;
                jobTitle = t.jobTitle; companyName = t.companyName; photo = e.photo;
                linkedPortfolioId = remappedPid; rating = t.rating;
                displayOrder = t.displayOrder; isVisible = t.isVisible;
                createdDate = e.createdDate; lastUpdatedDate = ?Time.now();
              });
              testimonialsUpdated += 1;
            };
            case (null) {
              let newId = lastTestimonialId + 1;
              lastTestimonialId := newId;
              testimonialIdMap.add(t.id, newId);
              let remappedPid : ?Nat = switch (t.linkedPortfolioId) {
                case (null) { null };
                case (?pid) { portfolioIdMap.get(pid) };
              };
              testimonials.add(newId, {
                id = newId; quote = t.quote; authorName = t.authorName;
                jobTitle = t.jobTitle; companyName = t.companyName; photo = t.photo;
                linkedPortfolioId = remappedPid; rating = t.rating;
                displayOrder = t.displayOrder; isVisible = t.isVisible;
                createdDate = ?Time.now(); lastUpdatedDate = ?Time.now();
              });
              testimonialsCreated += 1;
            };
          };
        };
      };
    };

    // ── Remap portfolio linkedTestimonialId ───────────────────────
    for ((sysPortfolioId, fileTid) in portfolioTestimonialRefs.entries()) {
      switch (portfolioProjects.get(sysPortfolioId)) {
        case (null) {};
        case (?p) {
          let remappedTid : ?Nat = testimonialIdMap.get(fileTid);
          portfolioProjects.add(sysPortfolioId, {
            id = p.id; title = p.title; clientName = p.clientName;
            industry = p.industry; category = p.category; tags = p.tags;
            thumbnail = p.thumbnail; galleryImages = p.galleryImages;
            description = p.description; technologiesUsed = p.technologiesUsed;
            results = p.results; linkedTestimonialId = remappedTid;
            publishStatus = p.publishStatus; displayOrder = p.displayOrder; projectUrl = p.projectUrl;
            createdDate = p.createdDate; lastUpdatedDate = p.lastUpdatedDate;
          });
        };
      };
    };

    // ── Contact Settings ──────────────────────────────────────────
    if (options.importContactSettings) {
      switch (data.contactSettings) {
        case (null) {};
        case (?cs) {
          previousContactSettings := ?contactSettings;
          contactSettings := { cs with lastUpdated = Time.now() };
          contactUpdated := true;
        };
      };
    };

    {
      portfolio = { created = portfolioCreated; updated = portfolioUpdated };
      services = { created = servicesCreated; updated = servicesUpdated };
      testimonials = { created = testimonialsCreated; updated = testimonialsUpdated };
      contactSettingsUpdated = contactUpdated;
    };
  };

  // ─── Homepage Data ────────────────────────────────────────────

  public type HomepageData = {
    services : [Service];
    featuredProjects : [PortfolioProject];
    testimonials : [Testimonial];
  };

  public query func getHomepageData() : async HomepageData {
    // Services: visible only, sorted by displayOrder desc, max 3
    let visibleServices = services.values().toArray().filter(func(s) { s.isVisible });
    let sortedServices = visibleServices.sort(func(a : Service, b : Service) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let topServices = if (sortedServices.size() <= 3) { sortedServices } else { sortedServices.sliceToArray(0, 3) };

    // Portfolio: published only, sorted by displayOrder desc, max 3
    let publishedProjects = portfolioProjects.values().toArray().filter(func(p) { p.publishStatus == #published });
    let sortedProjects = publishedProjects.sort(func(a : PortfolioProject, b : PortfolioProject) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let topProjects = if (sortedProjects.size() <= 3) { sortedProjects } else { sortedProjects.sliceToArray(0, 3) };

    // Testimonials: visible only, sorted by displayOrder desc, max 3
    let visibleTestimonials = testimonials.values().toArray().filter(func(t) { t.isVisible });
    let sortedTestimonials = visibleTestimonials.sort(func(a : Testimonial, b : Testimonial) : { #less; #equal; #greater } {
      if (a.displayOrder > b.displayOrder) { #less }
      else if (a.displayOrder < b.displayOrder) { #greater }
      else { #equal }
    });
    let topTestimonials = if (sortedTestimonials.size() <= 3) { sortedTestimonials } else { sortedTestimonials.sliceToArray(0, 3) };

    {
      services = topServices;
      featuredProjects = topProjects;
      testimonials = topTestimonials;
    };
  };
};
