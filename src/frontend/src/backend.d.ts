import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Testimonial {
    id: bigint;
    displayOrder: bigint;
    authorName: string;
    createdDate?: bigint;
    quote: string;
    linkedPortfolioId?: bigint;
    jobTitle: string;
    isVisible: boolean;
    companyName: string;
    lastUpdatedDate?: bigint;
    rating: bigint;
    photo?: ExternalBlob;
}
export interface TestimonialUpdate {
    id: bigint;
    displayOrder: bigint;
    authorName: string;
    quote: string;
    linkedPortfolioId?: bigint;
    jobTitle: string;
    isVisible: boolean;
    companyName: string;
    rating: bigint;
    photo?: ExternalBlob;
}
export interface ExportData {
    portfolio: Array<PortfolioProject>;
    metadata: ExportMetadata;
    testimonials: Array<Testimonial>;
    services: Array<Service>;
    contactSettings?: ContactSettings;
}
export interface ServiceProcessStep {
    step: string;
    description: string;
}
export interface TestimonialFilter {
    minRating?: bigint;
    search?: string;
    isVisible?: boolean;
    maxRating?: bigint;
}
export interface PortfolioProject {
    id: bigint;
    galleryImages: Array<ExternalBlob>;
    title: string;
    thumbnail?: ExternalBlob;
    clientName: string;
    displayOrder: bigint;
    technologiesUsed: Array<string>;
    tags: Array<string>;
    createdDate?: bigint;
    publishStatus: PublishStatus;
    description: string;
    results: Array<string>;
    linkedTestimonialId?: bigint;
    category: PortfolioCategory;
    lastUpdatedDate?: bigint;
    projectUrl?: string;
    industry: string;
}
export interface PortfolioFilter {
    status?: PublishStatus;
    search?: string;
    category?: PortfolioCategory;
}
export interface ServiceFilter {
    search?: string;
    isVisible?: boolean;
}
export interface PaginatedPortfolioProjects {
    total: bigint;
    items: Array<PortfolioProject>;
}
export interface TestimonialInput {
    displayOrder: bigint;
    authorName: string;
    quote: string;
    linkedPortfolioId?: bigint;
    jobTitle: string;
    isVisible: boolean;
    companyName: string;
    rating: bigint;
    photo?: ExternalBlob;
}
export interface ImportResultCounts {
    created: bigint;
    updated: bigint;
}
export interface ImportResult {
    portfolio: ImportResultCounts;
    contactSettingsUpdated: boolean;
    testimonials: ImportResultCounts;
    services: ImportResultCounts;
}
export interface PortfolioProjectUpdate {
    id: bigint;
    galleryImages: Array<ExternalBlob>;
    title: string;
    thumbnail?: ExternalBlob;
    clientName: string;
    displayOrder: bigint;
    technologiesUsed: Array<string>;
    tags: Array<string>;
    publishStatus: PublishStatus;
    description: string;
    results: Array<string>;
    linkedTestimonialId?: bigint;
    category: PortfolioCategory;
    projectUrl?: string;
    industry: string;
}
export interface HomepageData {
    featuredProjects: Array<PortfolioProject>;
    testimonials: Array<Testimonial>;
    services: Array<Service>;
}
export interface ContactSettings {
    map: ContactMap;
    lastUpdated: bigint;
    whatsapp: ContactWhatsApp;
    email: ContactEmail;
    address: ContactAddress;
    phone: ContactPhone;
}
export interface ServiceInput {
    useCases: Array<string>;
    title: string;
    displayOrder: bigint;
    faqs: Array<ServiceFaq>;
    icon?: ExternalBlob;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    shortDescription: string;
    isVisible: boolean;
    fullDescription: string;
}
export interface ServiceFaq {
    question: string;
    answer: string;
}
export interface ImportOptions {
    portfolioMode: ImportMode;
    importContactSettings: boolean;
    servicesMode: ImportMode;
    testimonialsMode: ImportMode;
}
export interface ContactWhatsApp {
    isEnabled: boolean;
    number?: string;
}
export interface PortfolioProjectInput {
    galleryImages: Array<ExternalBlob>;
    title: string;
    thumbnail?: ExternalBlob;
    clientName: string;
    displayOrder: bigint;
    technologiesUsed: Array<string>;
    tags: Array<string>;
    publishStatus: PublishStatus;
    description: string;
    results: Array<string>;
    linkedTestimonialId?: bigint;
    category: PortfolioCategory;
    projectUrl?: string;
    industry: string;
}
export interface ServiceUpdate {
    id: bigint;
    useCases: Array<string>;
    title: string;
    displayOrder: bigint;
    faqs: Array<ServiceFaq>;
    icon?: ExternalBlob;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    shortDescription: string;
    isVisible: boolean;
    fullDescription: string;
}
export interface ContactPhone {
    secondary?: string;
    isEnabled: boolean;
    primary?: string;
}
export interface PaginatedTestimonials {
    total: bigint;
    items: Array<Testimonial>;
}
export interface ExportTotalRecords {
    portfolio: bigint;
    testimonials: bigint;
    services: bigint;
}
export interface BusinessHours {
    tuesday: string;
    wednesday: string;
    saturday: string;
    thursday: string;
    sunday: string;
    friday: string;
    monday: string;
}
export interface Service {
    id: bigint;
    useCases: Array<string>;
    title: string;
    displayOrder: bigint;
    faqs: Array<ServiceFaq>;
    icon?: ExternalBlob;
    createdDate?: bigint;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    shortDescription: string;
    isVisible: boolean;
    lastUpdatedDate?: bigint;
    fullDescription: string;
}
export interface PaginatedServices {
    total: bigint;
    items: Array<Service>;
}
export interface ExportMetadata {
    exportVersion: string;
    exportDate: bigint;
    totalRecords: ExportTotalRecords;
}
export interface ContactAddress {
    businessHours: BusinessHours;
    fullAddress: string;
}
export interface ContactMap {
    latitude: number;
    longitude: number;
}
export interface ContactEmail {
    secondary?: string;
    primary: string;
    responseTime: string;
}
export interface UserProfile {
    name: string;
}
export enum ImportMode {
    createAndUpdate = "createAndUpdate",
    skip = "skip",
    createOnly = "createOnly",
    replaceAll = "replaceAll"
}
export enum PortfolioCategory {
    ai = "ai",
    web = "web",
    saas = "saas",
    blockchain = "blockchain",
    mobile = "mobile",
    branding = "branding"
}
export enum PublishStatus {
    published = "published",
    draft = "draft",
    archived = "archived"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkDeletePortfolioProjects(ids: Array<bigint>): Promise<bigint>;
    bulkDeleteServices(ids: Array<bigint>): Promise<bigint>;
    bulkDeleteTestimonials(ids: Array<bigint>): Promise<bigint>;
    bulkUpdatePortfolioStatus(ids: Array<bigint>, status: PublishStatus): Promise<bigint>;
    bulkUpdateServiceVisibility(ids: Array<bigint>, isVisible: boolean): Promise<bigint>;
    bulkUpdateTestimonialVisibility(ids: Array<bigint>, isVisible: boolean): Promise<bigint>;
    createPortfolioProject(input: PortfolioProjectInput): Promise<PortfolioProject>;
    createService(input: ServiceInput): Promise<Service>;
    createTestimonial(input: TestimonialInput): Promise<Testimonial>;
    deletePortfolioProject(id: bigint): Promise<boolean>;
    deleteService(id: bigint): Promise<boolean>;
    deleteTestimonial(id: bigint): Promise<boolean>;
    exportData(): Promise<ExportData>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactSettings(): Promise<ContactSettings>;
    getHomepageData(): Promise<HomepageData>;
    getPortfolioProject(id: bigint): Promise<PortfolioProject | null>;
    getPortfolioProjects(page: bigint, pageSize: bigint, filter: PortfolioFilter | null): Promise<PaginatedPortfolioProjects>;
    getPreviousContactSettings(): Promise<ContactSettings | null>;
    getService(id: bigint): Promise<Service | null>;
    getServices(page: bigint, pageSize: bigint, filter: ServiceFilter | null): Promise<PaginatedServices>;
    getTestimonial(id: bigint): Promise<Testimonial | null>;
    getTestimonials(page: bigint, pageSize: bigint, filter: TestimonialFilter | null): Promise<PaginatedTestimonials>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    importData(data: ExportData, options: ImportOptions): Promise<ImportResult>;
    isCallerAdmin(): Promise<boolean>;
    reorderPortfolioProjects(ids: Array<bigint>): Promise<boolean>;
    reorderServices(ids: Array<bigint>): Promise<boolean>;
    reorderTestimonials(ids: Array<bigint>): Promise<boolean>;
    resetContactSettings(): Promise<ContactSettings>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateContactSettings(input: ContactSettings): Promise<ContactSettings>;
    updatePortfolioProject(input: PortfolioProjectUpdate): Promise<PortfolioProject | null>;
    updateService(input: ServiceUpdate): Promise<Service | null>;
    updateTestimonial(input: TestimonialUpdate): Promise<Testimonial | null>;
}
