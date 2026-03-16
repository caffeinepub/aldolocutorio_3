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
}
