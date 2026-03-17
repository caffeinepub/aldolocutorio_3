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
    industry: string;
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
    industry: string;
}
export interface PortfolioFilter {
    status?: PublishStatus;
    search?: string;
    category?: PortfolioCategory;
}
export interface PaginatedPortfolioProjects {
    total: bigint;
    items: Array<PortfolioProject>;
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
    industry: string;
}
export interface UserProfile {
    name: string;
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
export interface Testimonial {
    id: bigint;
    quote: string;
    authorName: string;
    jobTitle: string;
    companyName: string;
    photo?: ExternalBlob;
    linkedPortfolioId?: bigint;
    rating: bigint;
    displayOrder: bigint;
    isVisible: boolean;
    createdDate?: bigint;
    lastUpdatedDate?: bigint;
}
export interface TestimonialInput {
    quote: string;
    authorName: string;
    jobTitle: string;
    companyName: string;
    photo?: ExternalBlob;
    linkedPortfolioId?: bigint;
    rating: bigint;
    displayOrder: bigint;
    isVisible: boolean;
}
export interface TestimonialUpdate {
    id: bigint;
    quote: string;
    authorName: string;
    jobTitle: string;
    companyName: string;
    photo?: ExternalBlob;
    linkedPortfolioId?: bigint;
    rating: bigint;
    displayOrder: bigint;
    isVisible: boolean;
}
export interface TestimonialFilter {
    isVisible?: boolean;
    minRating?: bigint;
    maxRating?: bigint;
    search?: string;
}
export interface PaginatedTestimonials {
    total: bigint;
    items: Array<Testimonial>;
}
export interface ServiceProcessStep {
    step: string;
    description: string;
}
export interface ServiceFaq {
    question: string;
    answer: string;
}
export interface Service {
    id: bigint;
    title: string;
    icon?: ExternalBlob;
    shortDescription: string;
    fullDescription: string;
    useCases: Array<string>;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    faqs: Array<ServiceFaq>;
    displayOrder: bigint;
    isVisible: boolean;
    createdDate?: bigint;
    lastUpdatedDate?: bigint;
}
export interface ServiceInput {
    title: string;
    icon?: ExternalBlob;
    shortDescription: string;
    fullDescription: string;
    useCases: Array<string>;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    faqs: Array<ServiceFaq>;
    displayOrder: bigint;
    isVisible: boolean;
}
export interface ServiceUpdate {
    id: bigint;
    title: string;
    icon?: ExternalBlob;
    shortDescription: string;
    fullDescription: string;
    useCases: Array<string>;
    processSteps: Array<ServiceProcessStep>;
    targetAudience: string;
    faqs: Array<ServiceFaq>;
    displayOrder: bigint;
    isVisible: boolean;
}
export interface ServiceFilter {
    isVisible?: boolean;
    search?: string;
}
export interface PaginatedServices {
    total: bigint;
    items: Array<Service>;
}
export interface BusinessHours {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}
export interface ContactWhatsApp {
    number?: string;
    isEnabled: boolean;
}
export interface ContactEmail {
    primary: string;
    secondary?: string;
    responseTime: string;
}
export interface ContactPhone {
    primary?: string;
    secondary?: string;
    isEnabled: boolean;
}
export interface ContactAddress {
    fullAddress: string;
    businessHours: BusinessHours;
}
export interface ContactMap {
    latitude: number;
    longitude: number;
}
export interface ContactSettings {
    whatsapp: ContactWhatsApp;
    email: ContactEmail;
    phone: ContactPhone;
    address: ContactAddress;
    map: ContactMap;
    lastUpdated: bigint;
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkDeletePortfolioProjects(ids: Array<bigint>): Promise<bigint>;
    bulkUpdatePortfolioStatus(ids: Array<bigint>, status: PublishStatus): Promise<bigint>;
    createPortfolioProject(input: PortfolioProjectInput): Promise<PortfolioProject>;
    deletePortfolioProject(id: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPortfolioProject(id: bigint): Promise<PortfolioProject | null>;
    getPortfolioProjects(page: bigint, pageSize: bigint, filter: PortfolioFilter | null): Promise<PaginatedPortfolioProjects>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    reorderPortfolioProjects(ids: Array<bigint>): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePortfolioProject(input: PortfolioProjectUpdate): Promise<PortfolioProject | null>;
    createTestimonial(input: TestimonialInput): Promise<Testimonial>;
    updateTestimonial(input: TestimonialUpdate): Promise<Testimonial | null>;
    deleteTestimonial(id: bigint): Promise<boolean>;
    getTestimonial(id: bigint): Promise<Testimonial | null>;
    getTestimonials(page: bigint, pageSize: bigint, filter: TestimonialFilter | null): Promise<PaginatedTestimonials>;
    reorderTestimonials(ids: Array<bigint>): Promise<boolean>;
    bulkUpdateTestimonialVisibility(ids: Array<bigint>, isVisible: boolean): Promise<bigint>;
    bulkDeleteTestimonials(ids: Array<bigint>): Promise<bigint>;
    createService(input: ServiceInput): Promise<Service>;
    updateService(input: ServiceUpdate): Promise<Service | null>;
    deleteService(id: bigint): Promise<boolean>;
    getService(id: bigint): Promise<Service | null>;
    getServices(page: bigint, pageSize: bigint, filter: ServiceFilter | null): Promise<PaginatedServices>;
    reorderServices(ids: Array<bigint>): Promise<boolean>;
    bulkUpdateServiceVisibility(ids: Array<bigint>, isVisible: boolean): Promise<bigint>;
    bulkDeleteServices(ids: Array<bigint>): Promise<bigint>;
    getContactSettings(): Promise<ContactSettings>;
    updateContactSettings(input: ContactSettings): Promise<ContactSettings>;
    getPreviousContactSettings(): Promise<ContactSettings | null>;
    resetContactSettings(): Promise<ContactSettings>;
}
